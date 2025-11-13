(function(){
  'use strict';
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));

  const state = { all:[], filtered:[], q:'', year:'', tag:'', hotel:'' };

  // Prefer local ./news.json; fallback ../news.json
  async function loadNews(){
    const candidates = ['./news.json','../news.json'];
    for(const url of candidates){
      try{
        const res = await fetch(url+'?v='+Date.now(), {cache:'no-store'});
        if(!res.ok) continue;
        const txt = await res.text();
        const arr = JSON.parse(txt.replace(/^\uFEFF/,'').trim());
        if(Array.isArray(arr)) return arr;
      }catch(e){ /* try next */ }
    }
    return [];
  }

  function fmt(dateStr){
    try{
      return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(dateStr));
    }catch(_){ return dateStr||''; }
  }

  function unique(list){ return [...new Set(list)]; }

  function tplCard(it){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = it.url;
    a.setAttribute('aria-label', it.titulo||'Ver noticia');
    a.innerHTML = `
      <div class="thumb">${it.img?`<img loading="lazy" src="${it.img}" alt="">`:''}</div>
      <div class="body">
        <div class="meta">${fmt(it.fecha)}${it.hotel?` · ${it.hotel}`:''}</div>
        <h3 class="title">${it.titulo||''}</h3>
        <div class="badges">${(it.tags||[]).map(t=>`<span class="badge">${t}</span>`).join(' ')}</div>
      </div>`;
    return a;
  }

  function renderGrid(list){
    const grid = $('#grid');
    grid.innerHTML = '';
    if(list.length===0){
      grid.innerHTML = `<div class="empty">Sin resultados. Cambia filtros o búsqueda.</div>`;
      return;
    }
    list.forEach(it=> grid.appendChild(tplCard(it)));
  }

  function renderSkeleton(n=6){
    const grid = $('#grid');
    grid.innerHTML = '';
    for(let i=0;i<n;i++){
      const c = document.createElement('div');
      c.className = 'card skel';
      c.innerHTML = `<div class="thumb"></div><div class="line"></div><div class="line" style="width:65%"></div>`;
      grid.appendChild(c);
    }
  }

  function renderFilters(items){
    const years = unique(items.map(x=>(x.fecha||'').slice(0,4))).filter(Boolean).sort((a,b)=>b.localeCompare(a));
    const tags = unique(items.flatMap(x=>x.tags||[]));
    const hotels = unique(items.map(x=>x.hotel||'').filter(Boolean));

    const selYear = $('#f-year'), selTag = $('#f-tag'), selHotel = $('#f-hotel');
    [selYear, selTag, selHotel].forEach(s=> s.innerHTML=''); // reset

    const o0 = (txt)=>{ const o=document.createElement('option'); o.value=''; o.textContent=txt; return o; };
    selYear.appendChild(o0('Año'));
    years.forEach(y=>{ const o=document.createElement('option'); o.value=y; o.textContent=y; selYear.appendChild(o); });

    selTag.appendChild(o0('Etiqueta'));
    tags.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; selTag.appendChild(o); });

    selHotel.appendChild(o0('Hotel'));
    hotels.forEach(h=>{ const o=document.createElement('option'); o.value=h; o.textContent=h; selHotel.appendChild(o); });
  }

  function apply(){
    const q = $('#f-q').value.trim().toLowerCase();
    const y = $('#f-year').value;
    const t = $('#f-tag').value;
    const h = $('#f-hotel').value;

    state.q=q; state.year=y; state.tag=t; state.hotel=h;
    let out = state.all.filter(x=>{
      const okY = y ? (x.fecha||'').startsWith(y) : true;
      const okT = t ? (x.tags||[]).includes(t) : true;
      const okH = h ? (x.hotel||'')===h : true;
      const hay = (x.titulo||'').toLowerCase().includes(q) || (x.texto||'').toLowerCase().includes(q);
      return okY && okT && okH && (!q || hay);
    });
    state.filtered = out.sort((a,b)=> new Date(b.fecha) - new Date(a.fecha));
    renderGrid(state.filtered);
  }

  async function boot(){
    renderSkeleton(9);
    const data = await loadNews();
    // Normalize URLs: remove leading 'Noticias/'
    data.forEach(x=>{ if(typeof x.url==='string' && x.url.toLowerCase().startsWith('noticias/')) x.url = x.url.slice(9); });
    state.all = data;
    renderFilters(state.all);
    apply();
  }

  addEventListener('DOMContentLoaded', boot);
  ['f-q','f-year','f-tag','f-hotel'].forEach(id=>{
    document.addEventListener('input', ev=>{ if(ev.target && ev.target.id===id) apply(); });
    document.addEventListener('change', ev=>{ if(ev.target && ev.target.id===id) apply(); });
  });
})();