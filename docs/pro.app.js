(function(){
  'use strict';
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  const grid = $('#grid');
  const q = $('#q'), yearSel = $('#year'), tagSel = $('#tag');
  const slider = $('#slider'), dots = $('#dots');
  const btnPrev = $('#prev'), btnNext = $('#next');
  const tagcloud = $('#tagcloud');

  const fmt = (d) => new Intl.DateTimeFormat('es-ES',{day:'2-digit', month:'long', year:'numeric'}).format(new Date(d+'T12:00:00'));
  const hb = h => h ? `<span class="badge">${h}</span>` : '';

  const makeCard = n => `
    <article class="card">
      <div class="card-media">
        ${n.img ? `<img alt="" loading="lazy" src="${n.img}" onerror="this.onerror=null; this.src='img/ph-workshop.svg'">` : ''}
      </div>
      <div class="card-body">
        <h3 class="title">${n.titulo||'Sin título'}</h3>
        <div class="meta">
          ${n.fecha?`<span>${fmt(n.fecha)}</span>`:''}
          ${hb(n.hotel)}
        </div>
        ${n.texto?`<p>${n.texto}</p>`:''}
        ${n.tags?`<div class="tags">${n.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}
        ${n.url?`<div class="actions"><a class="btn-card" href="${n.url}" target="_blank" rel="noopener">Leer noticia ↗</a></div>`:''}
      </div>
    </article>`;

  // === Slider con pista horizontal
  function buildSlider(items){
    // limpiar y crear contenedores
    slider.innerHTML = `
      <div class="nav"><button id="prev" aria-label="Anterior">‹</button><button id="next" aria-label="Siguiente">›</button></div>
      <div class="dots" id="dots"></div>`;
    const dotsEl = slider.querySelector('#dots');
    const track = document.createElement('div');
    track.className = 'track';
    slider.insertBefore(track, dotsEl);

    const slides = items.slice(0,3);
    slides.forEach((it,i)=>{
      const el = document.createElement('div');
      el.className = 'slide';
      el.innerHTML = `
        <div class="slide-media">
          ${it.img?`<img alt="" src="${it.img}" onerror="this.onerror=null; this.src='img/ph-workshop.svg'">`:''}
        </div>
        <div class="slide-body">
          <div class="h-eyebrow">Destacado</div>
          <h2 class="h-title">${it.titulo||''}</h2>
          <div class="h-meta">${it.fecha?`<span>${fmt(it.fecha)}</span>`:''} ${hb(it.hotel)}</div>
          ${it.texto?`<p class="h-text">${it.texto}</p>`:''}
          ${it.url?`<div class="actions"><a class="btn" href="${it.url}" target="_blank" rel="noopener">Leer completa ↗</a></div>`:''}
        </div>`;
      track.appendChild(el);

      const d = document.createElement('div');
      d.className = 'dot'+(i===0?' active':'');
      dotsEl.appendChild(d);
    });

    // navegación
    let idx = 0, total = slides.length;
    const setDots = () => [...dotsEl.children].forEach((d,k)=>d.classList.toggle('active',k===idx));
    const show = i => { idx = (i+total)%total; track.style.transform = `translateX(-${idx*100}%)`; setDots(); };
    setDots();
    slider.querySelector('#prev').onclick = ()=> show(idx-1);
    slider.querySelector('#next').onclick = ()=> show(idx+1);
    let timer = setInterval(()=>show(idx+1), 6500);
    slider.addEventListener('pointerenter', ()=>clearInterval(timer));
    slider.addEventListener('pointerleave', ()=> timer = setInterval(()=>show(idx+1), 6500));
  }

  function fillFilters(items){
    const years = Array.from(new Set(items.filter(n=>n.fecha).map(n=>String(new Date(n.fecha).getFullYear())))).sort((a,b)=>b.localeCompare(a));
    yearSel.innerHTML = '<option value=\"\">Año</option>'+years.map(y=>`<option>${y}</option>`).join('');
    const tags = Array.from(new Set(items.flatMap(n=>n.tags||[]))).sort();
    tagSel.innerHTML = '<option value=\"\">Etiqueta</option>'+tags.map(t=>`<option>${t}</option>`).join('');
    tagcloud.innerHTML = tags.slice(0,10).map(t=>`<button class="t-pill" data-tag="${t}">${t}</button>`).join('');
    tagcloud.onclick = (e)=>{
      const b = e.target.closest('.t-pill'); if(!b) return;
      const t = b.dataset.tag; tagSel.value = tagSel.value===t ? '' : t;
      Array.from(tagcloud.children).forEach(x=>x.classList.toggle('active', x.dataset.tag===tagSel.value));
      apply(items);
    };
  }

  function render(list){
    if(!grid) return;
    if(!list.length){
      grid.innerHTML = '<div class="card" style="grid-column:span 12; padding:20px">No hay noticias para mostrar.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(n => {
      const c = document.createElement('div');
      c.innerHTML = makeCard(n);
      frag.appendChild(c.firstElementChild);
    });
    grid.innerHTML=''; grid.appendChild(frag);
  }

  function apply(items){
    const term = (q.value||'').toLowerCase().trim();
    const y = yearSel.value; const t = tagSel.value;
    const out = items.filter(n=>{
      const okTerm = !term || JSON.stringify(n).toLowerCase().includes(term);
      const okYear = !y || (n.fecha && String(new Date(n.fecha).getFullYear())===y);
      const okTag = !t || (n.tags||[]).includes(t);
      return okTerm && okYear && okTag;
    }).sort((a,b)=> new Date(b.fecha||0) - new Date(a.fecha||0));
    buildSlider(out);
    render(out);
  }

  async function load(){
    let data = [];
    try{
      const res = await fetch('./news.json?v='+Date.now(), {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const text = await res.text();
      data = JSON.parse(text.replace(/^\uFEFF/, '').trim());
      if(!Array.isArray(data)) throw new Error('JSON no es un array');
    }catch(e){
      console.warn('[Noticias] usando fallback:', e.message);
      data = Array.isArray(window.NEWS_FALLBACK) ? window.NEWS_FALLBACK : [];
    }
    fillFilters(data);
    q.addEventListener('input', ()=>apply(data));
    yearSel.addEventListener('change', ()=>apply(data));
    tagSel.addEventListener('change', ()=>apply(data));
    window.addEventListener('keydown', ev=>{
      if((ev.ctrlKey||ev.metaKey)&&ev.key==='/'){ ev.preventDefault(); q.focus(); }
    });
    apply(data);
  }

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded', load)
    : load();
})();
