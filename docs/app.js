(function(){
  'use strict';
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const grid = $('#grid');
  const featured = $('#featured');
  const pager = $('#pager');
  const prev = $('#prev'); const next = $('#next'); const pageInfo = $('#pageInfo');
  const q = $('#q'), yearSel = $('#year'), tagSel = $('#tag');

  const PAGE_SIZE = 6;

  const fmt = (d) => new Intl.DateTimeFormat('es-ES',{day:'2-digit', month:'long', year:'numeric'}).format(new Date(d+'T12:00:00'));

  function badgeHotel(h){
    if(!h) return '';
    const map = {
      'Guadiana': '<span class="badge">Guadiana</span>',
      'Cumbria': '<span class="badge">Cumbria</span>'
    };
    return map[h] || `<span class="badge">${h}</span>`;
  }

  function makeCard(n){
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-media">${n.img ? `<img alt="" src="${n.img}">` : ''}</div>
      <div class="card-body">
        <h3 class="card-title">${n.titulo || 'Sin título'}</h3>
        <div class="card-meta">
          ${n.fecha ? `<span class="date">${fmt(n.fecha)}</span>` : ''}
          ${badgeHotel(n.hotel)}
        </div>
        ${n.texto ? `<p class="card-text">${n.texto}</p>` : ''}
        ${Array.isArray(n.tags) && n.tags.length ? `<div class="tags">${n.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}
        ${n.url ? `<div class="actions"><a class="btn" href="${n.url}" target="_blank" rel="noopener">Leer noticia ↗</a></div>` : ''}
      </div>`;
    return el;
  }

  function renderFeatured(item){
    if(!featured) return;
    featured.innerHTML = '';
    if(!item) return;
    const box = document.createElement('article');
    box.className = 'feature-card';
    box.innerHTML = `
      <div class="feature-media">${item.img ? `<img alt="" src="${item.img}">` : ''}</div>
      <div class="feature-body">
        <h2 class="feature-title">${item.titulo || 'Sin título'}</h2>
        <div class="feature-meta">
          ${item.fecha ? `<span class="date">${fmt(item.fecha)}</span>` : ''}
          ${badgeHotel(item.hotel)}
          ${Array.isArray(item.tags) ? item.tags.slice(0,2).map(t=>`<span class="badge">${t}</span>`).join(''): ''}
        </div>
        ${item.texto ? `<p class="feature-text">${item.texto}</p>` : ''}
        <div class="actions">
          ${item.url ? `<a class="btn" href="${item.url}" target="_blank" rel="noopener">Leer completa ↗</a>` : ''}
          <button class="btn-share" data-title="${(item.titulo||'').replace(/"/g,'&quot;')}" data-url="${item.url||location.href}">Compartir</button>
        </div>
      </div>`;
    featured.appendChild(box);

    // share
    const shareBtn = $('.btn-share', box);
    if(shareBtn){
      shareBtn.addEventListener('click', async ()=>{
        try{
          if(navigator.share){
            await navigator.share({title: item.titulo, url: item.url || location.href});
          }else{
            await navigator.clipboard.writeText(item.url || location.href);
            shareBtn.textContent = 'Copiado ✓';
            setTimeout(()=> shareBtn.textContent = 'Compartir', 1800);
          }
        }catch(e){/*noop*/}
      });
    }
  }

  function render(list, page){
    if(!grid) return;
    grid.innerHTML = '';
    if(!Array.isArray(list) || list.length === 0){
      const empty = document.createElement('div');
      empty.className = 'empty'; empty.textContent = 'No hay noticias para mostrar.';
      grid.appendChild(empty);
      pager.hidden = true;
      renderFeatured(null);
      return;
    }
    // Featured = primer elemento
    renderFeatured(list[0]);

    // Paginación del resto
    const items = list.slice(1);
    const maxPage = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page||1), maxPage);
    const start = (page-1)*PAGE_SIZE;
    const slice = items.slice(start, start+PAGE_SIZE);

    const frag = document.createDocumentFragment();
    slice.forEach(n => frag.appendChild(makeCard(n)));
    grid.appendChild(frag);

    pageInfo.textContent = `${page}/${maxPage}`;
    prev.disabled = (page<=1); next.disabled = (page>=maxPage);
    pager.hidden = (maxPage<=1);

    prev.onclick = ()=> render(list, page-1);
    next.onclick = ()=> render(list, page+1);
  }

  function fillFilters(items){
    // Años
    const years = Array.from(new Set(items
      .filter(n => n.fecha)
      .map(n => String(new Date(n.fecha).getFullYear()))
    )).sort((a,b)=>b.localeCompare(a));
    yearSel.innerHTML = '<option value=\"\">Año</option>' + years.map(y=>`<option>${y}</option>`).join('');

    // Etiquetas
    const tags = Array.from(new Set(items.flatMap(n => n.tags || []))).sort();
    tagSel.innerHTML = '<option value=\"\">Etiqueta</option>' + tags.map(t=>`<option>${t}</option>`).join('');
  }

  function applyFilters(items){
    const term = (q.value || '').toLowerCase().trim();
    const y = yearSel.value;
    const t = tagSel.value;

    const filtered = items.filter(n => {
      const okTerm = !term || JSON.stringify(n).toLowerCase().includes(term);
      const okYear = !y || (n.fecha && String(new Date(n.fecha).getFullYear()) === y);
      const okTag = !t || (n.tags || []).includes(t);
      return okTerm && okYear && okTag;
    });
    // Orden descendente por fecha
    filtered.sort((a,b)=> new Date(b.fecha||0) - new Date(a.fecha||0));
    render(filtered, 1);
  }

  async function load(){
    if(grid){
      const loading = document.createElement('div');
      loading.className = 'loading'; loading.textContent = 'Cargando noticias…';
      grid.replaceChildren(loading);
    }

    let data = [];
    try{
      const jsonURL = (location.protocol === 'file:') ? 'news.json' : ('news.json?v=' + Date.now());
      const res = await fetch(jsonURL, {cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const clean = text.replace(/^\\uFEFF/, '').trim();
      data = JSON.parse(clean);
      if(!Array.isArray(data)) throw new Error('JSON no es un array');
    }catch(e){
      console.warn('[Noticias] Usando fallback. Motivo:', e.message);
      data = Array.isArray(window.NEWS_FALLBACK) ? window.NEWS_FALLBACK : [];
    }

    fillFilters(data);
    // Eventos
    q.addEventListener('input', ()=>applyFilters(data));
    yearSel.addEventListener('change', ()=>applyFilters(data));
    tagSel.addEventListener('change', ()=>applyFilters(data));

    applyFilters(data);
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();