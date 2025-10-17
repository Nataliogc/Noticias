// Portada mejorada v5 + "Leer más" y fallback local
const el = (sel) => document.querySelector(sel);
const grid = el('#grid');
const featured = el('#featured');
const chips = el('#chips');
const q = el('#q');
const year = el('#year');
const tag = el('#tag');
const onlyHeaders = el('#onlyHeaders');
const prev = el('#prev');
const next = el('#next');
const pageInfo = el('#pageInfo');
const lightbox = el('#lightbox');
const lightImg = el('#lightImg');
const btnRss = el('#btnRss');

let NEWS = [];
let filtered = [];
let page = 1;
const PAGE_SIZE = 6;

async function load() {
  try {
    // intenta cargar news.json; si falla, usa fallback embebido
    try {
      const res = await fetch('./news.json', {cache: 'no-store'});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      NEWS = await res.json();
    } catch(e) {
      if (Array.isArray(window.NEWS_FALLBACK)) NEWS = window.NEWS_FALLBACK;
      else throw e;
    }
    NEWS.forEach(n => n.dateObj = new Date(n.date));
    NEWS.sort((a,b) => b.dateObj - a.dateObj);
    fillFilters();
    buildChips();
    applyFilters();
    bindEvents();
  } catch (e) {
    showMissingJSON(e);
    console.error(e);
  }
}

function showMissingJSON(e){
  const msg = `<article class="card" style="grid-column:span 12">
    <div class="card-body">
      <h3 class="card-title">No se pudo cargar <code>news.json</code></h3>
      <p class="card-text">Crea <b>docs/news.json</b> con este ejemplo (3 tarjetas):</p>
      <pre style="white-space:pre-wrap;background:#f7fafc;border:1px solid #e5e7eb;border-radius:10px;padding:10px;overflow:auto">${escapeHtml(JSON.stringify(sampleNews(), null, 2))}</pre>
    </div>
  </article>`;
  featured.innerHTML = "";
  grid.innerHTML = msg;
}

function sampleNews(){
  return window.NEWS_FALLBACK || [];
}

function unique(arr){ return [...new Set(arr)]; }
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');}

function fillFilters(){
  const years = unique(NEWS.map(n => (n.dateObj||new Date()).getFullYear())).sort((a,b)=>b-a);
  year.innerHTML = `<option value="">Año</option>` + years.map(y=>`<option>${y}</option>`).join('');
  const tags = unique(NEWS.flatMap(n => n.tags || [])).sort((a,b)=>a.localeCompare(b));
  tag.innerHTML = `<option value="">Etiqueta</option>` + tags.map(t=>`<option>${t}</option>`).join('');
}

function topTags(limit=8){
  const count = {};
  NEWS.flatMap(n=>n.tags||[]).forEach(t=>count[t]=(count[t]||0)+1);
  return Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
}

function buildChips(){
  const tops = topTags();
  chips.innerHTML = tops.map(t=>`<button class="chip" data-tag="${t}">#${t}</button>`).join('');
  chips.addEventListener('click', (e)=>{
    const b = e.target.closest('.chip'); if(!b) return;
    const t = b.dataset.tag;
    tag.value = (tag.value === t) ? "" : t;
    chips.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.tag===tag.value));
    applyFilters();
  });
}

function applyFilters(){
  const qv = norm(q.value);
  const yv = year.value;
  const tv = tag.value;
  filtered = NEWS.filter(n => {
    const inQ = !qv || norm(n.title).includes(qv) || norm(n.place||'').includes(qv) || norm(n.text).includes(qv) || (n.tags||[]).some(t=>norm(t).includes(qv));
    const inY = !yv || (n.dateObj && n.dateObj.getFullYear().toString() === yv);
    const inT = !tv || (n.tags||[]).includes(tv);
    return inQ && inY && inT;
  });
  page = 1;
  render();
}

function paginate(list, pageSize, pageNum){
  const start = (pageNum-1)*pageSize;
  return list.slice(start, start+pageSize);
}

function render(){
  document.body.classList.toggle('header-only', onlyHeaders.checked);
  renderFeatured();
  const items = paginate(filtered.slice(1), PAGE_SIZE, page);
  grid.innerHTML = items.map(card).join('') || `<div class="card" style="grid-column:span 12"><div class="card-body"><div class="card-title">Sin resultados</div><p class="card-text">Prueba otra búsqueda o limpia los filtros.</p></div></div>`;
  const totalPages = Math.max(1, Math.ceil(Math.max(0, filtered.length-1) / PAGE_SIZE));
  pageInfo.textContent = `Página ${page}/${totalPages}`;
  prev.disabled = page<=1;
  next.disabled = page>=totalPages;

  document.querySelectorAll('[data-zoom]').forEach(img => img.addEventListener('click', () => openLightbox(img.src)));
}

function featureActions(n){
  const read = n.url ? `<a class="btn-share" href="${n.url}" target="_blank" rel="noopener">Leer más →</a>` : "";
  return `<div class="actions">${read}</div>`;
}

function renderFeatured(){
  const f = filtered[0] || NEWS[0];
  if(!f){ featured.innerHTML = ""; return; }
  const dateStr = (f.dateObj||new Date()).toLocaleDateString('es-ES',{day:'2-digit', month:'long', year:'numeric'});
  const tags = (f.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');
  featured.innerHTML = `
  <article class="feature-card">
    <div class="feature-media" title="Ampliar imagen">
      <img src="${f.image}" alt="${escapeHtml(f.title)}" loading="lazy" data-zoom>
    </div>
    <div class="feature-body">
      <h2 class="feature-title">${f.title}</h2>
      <div class="feature-meta">
        <span class="date">📍 ${f.place||'—'}</span>
        <span class="badge">${dateStr}</span>
      </div>
      <p class="feature-text">${f.text}</p>
      <div class="tags">${tags}</div>
      ${featureActions(f)}
    </div>
  </article>`;
}

function card(n){
  const dateStr = (n.dateObj||new Date()).toLocaleDateString('es-ES',{day:'2-digit', month:'long', year:'numeric'});
  const tags = (n.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');
  const read = n.url ? `<a class="btn-share" href="${n.url}" target="_blank" rel="noopener">Leer más →</a>` : "";
  return `
  <article class="card">
    <div class="card-media" title="Ampliar imagen">
      <img src="${n.image}" alt="${escapeHtml(n.title)}" loading="lazy" data-zoom>
    </div>
    <div class="card-body">
      <h3 class="card-title">${n.title}</h3>
      <div class="card-meta">
        <span class="date">📍 ${n.place||'—'}</span>
        <span class="badge">${dateStr}</span>
      </div>
      <p class="card-text">${n.text}</p>
      <div class="tags">${tags}</div>
      <div class="actions">${read}</div>
    </div>
  </article>`;
}

function openLightbox(src){
  lightImg.src = src;
  lightbox.showModal();
  lightbox.addEventListener('click', (e)=>{ if (e.target === lightbox) lightbox.close(); }, {once:true});
}

function bindEvents(){
  q.addEventListener('input', debounce(applyFilters, 200));
  year.addEventListener('change', applyFilters);
  tag.addEventListener('change', ()=>{ chips.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.tag===tag.value)); applyFilters(); });
  onlyHeaders.addEventListener('change', render);
  prev.addEventListener('click', ()=>{ if(page>1){ page--; render(); } });
  next.addEventListener('click', ()=>{ const totalPages = Math.ceil(Math.max(0, filtered.length-1)/PAGE_SIZE); if(page<totalPages){ page++; render(); } });
  btnRss.addEventListener('click', generateRSS);
}

function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); } }
function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function generateRSS(){
  const items = filtered.length ? filtered : NEWS;
  const now = new Date().toUTCString();
  const site = location.href.replace(/\/docs\/.*/,'/docs/');
  const rssItems = items.map(n => `
    <item>
      <title><![CDATA[${n.title}]]></title>
      <link>${site}</link>
      <guid>${site}#${encodeURIComponent(n.title)}</guid>
      <pubDate>${new Date(n.date).toUTCString()}</pubDate>
      <description><![CDATA[${n.text}]]></description>
    </item>`).join('');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel>
    <title>Noticias · Hoteles de Calidad</title>
    <link>${site}</link>
    <description>Actualidad corporativa</description>
    <language>es-es</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${rssItems}
  </channel></rss>`;
  const blob = new Blob([rss], {type:'application/rss+xml'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rss.xml';
  a.click();
  URL.revokeObjectURL(a.href);
}

load();
