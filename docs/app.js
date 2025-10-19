(function(){
  'use strict';

  const $ = (s, c=document) => c.querySelector(s);
  const grid = $('#grid');
  const q = $('#q'), yearSel = $('#year'), tagSel = $('#tag');

  const fmt = (d) => new Intl.DateTimeFormat('es-ES',{day:'2-digit', month:'long', year:'numeric'}).format(new Date(d+'T12:00:00'));

  function render(list){
    if(!grid) return;
    grid.innerHTML = '';
    if(!Array.isArray(list) || list.length === 0){
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.textContent = 'No hay noticias para mostrar.';
      grid.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(n => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <h3>${n.titulo || 'Sin título'}</h3>
        ${n.fecha ? `<div class="meta">Fecha: ${fmt(n.fecha)}</div>` : ''}
        ${n.texto ? `<p style="margin:0">${n.texto}</p>` : ''}
        ${n.url ? `<a class="link" href="${n.url}" target="_blank" rel="noopener">Leer completa ↗</a>` : ''}
      `;
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function fillFilters(items){
    // Años
    const years = Array.from(new Set(items
      .filter(n => n.fecha)
      .map(n => String(new Date(n.fecha).getFullYear()))
    )).sort((a,b)=>b.localeCompare(a));
    yearSel.innerHTML = '<option value="">Año</option>' + years.map(y=>`<option>${y}</option>`).join('');

    // Etiquetas (si existe campo tags)
    const tags = Array.from(new Set(items.flatMap(n => n.tags || []))).sort();
    tagSel.innerHTML = '<option value="">Etiqueta</option>' + tags.map(t=>`<option>${t}</option>`).join('');
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
    render(filtered);
  }

  async function load(){
    let data = [];
    try{
      // En file:// muchos navegadores bloquean fetch local → intento, y si falla, fallback.
      const jsonURL = (location.protocol === 'file:') ? 'news.json' : ('news.json?v=' + Date.now());
      const res = await fetch(jsonURL, {cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const clean = text.replace(/^\uFEFF/, '').trim(); // quita BOM si lo hubiera
      data = JSON.parse(clean);
      if(!Array.isArray(data)) throw new Error('JSON no es un array');
    }catch(e){
      console.warn('[Noticias] Usando fallback. Motivo:', e.message);
      data = Array.isArray(window.NEWS_FALLBACK) ? window.NEWS_FALLBACK : [];
    }

    // Orden descendente por fecha si existe
    data.sort((a,b)=> new Date(b.fecha||0) - new Date(a.fecha||0));

    fillFilters(data);

    // Eventos
    q.addEventListener('input', ()=>applyFilters(data));
    yearSel.addEventListener('change', ()=>applyFilters(data));
    tagSel.addEventListener('change', ()=>applyFilters(data));

    applyFilters(data); // primera render
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
