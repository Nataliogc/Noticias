// App robusta: asegura bloques, carga JSON con fallback y usa imagen por defecto
(function ensureBlocks(){
  const main = document.querySelector('main.wrap') || document.body;
  if (!document.getElementById('featured')) {
    const s = document.createElement('section'); s.id='featured'; s.className='featured'; main.prepend(s);
  }
  if (!document.getElementById('grid')) {
    const s = document.createElement('section'); s.id='grid'; s.className='grid'; main.appendChild(s);
  }
  if (!document.getElementById('prev') || !document.getElementById('next') || !document.getElementById('pageInfo')) {
    const nav = document.createElement('nav'); nav.className='pager';
    nav.innerHTML = '<button id="prev" class="btn" disabled>← Anterior</button><span id="pageInfo" class="page-info">Página 1/1</span><button id="next" class="btn" disabled>Siguiente →</button>';
    main.appendChild(nav);
  }
})();

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
const btnRss = el('#btnRss');
const lightbox = document.createElement('dialog'); lightbox.id='lightbox'; lightbox.className='lightbox'; lightbox.innerHTML='<img id="lightImg" alt="Imagen ampliada">'; document.body.appendChild(lightbox);
const lightImg = document.getElementById('lightImg');

const FALLBACK_IMG = "./img/logo-guadiana.png";
const useImg = (src)=> (src && src.trim()) ? src : FALLBACK_IMG;

let NEWS = [];
let filtered = [];
let page = 1;
const PAGE_SIZE = 6;

async function load() {
  try {
    let usedFallback = false;

    try {
      const res = await fetch('./news.json', {cache: 'no-store'});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      NEWS = await res.json();
    } catch (e) {
      if (Array.isArray(window.NEWS_FALLBACK)) { NEWS = window.NEWS_FALLBACK; usedFallback = true; }
      else { showMissingJSON(e); return; }
    }

    if (!Array.isArray(NEWS)) { showInvalidJSON(); return; }

    NEWS.forEach(n => n.dateObj = new Date(n.date));
    NEWS.sort((a,b)=> b.dateObj - a.dateObj);

    featured.innerHTML=''; grid.innerHTML='';

    fillFilters();
    buildChips();
    applyFilters();
    bindEvents();

    if (usedFallback && document.querySelector('.toolbar')) {
      const notice=document.createElement('div');
      notice.style.cssText='margin:6px 0;color:#64748b;font-size:12px';
      notice.textContent='Vista con datos de respaldo. Sube docs/news.json para publicar.';
      document.querySelector('.toolbar').appendChild(notice);
    }
  } catch (e) {
    showMissingJSON(e);
    console.error(e);
  }
}

function showInvalidJSON(){
  featured.innerHTML = '';
  grid.innerHTML = '<article class="card" style="grid-column:span 12"><div class="card-body"><h3 class="card-title">Formato de news.json inválido</h3><p class="card-text">Debe ser un array JSON: [ {...}, {...} ]</p></div></article>';
}
function showMissingJSON(e){
  const sample = JSON.stringify([{
    "title":"COMUNICACIÓN INTERNA · Éxito en Murcia",
    "place":"Murcia · Cuartel de Artillería",
    "date":"2025-10-14",
    "image":"./img/logo-guadiana.png",
    "tags":["Comunicación interna","B2B","Murcia","Promoción"],
    "text":"Resumen breve de la acción institucional y comercial.",
    "url":"./posts/workshop-murcia.html"
  }], null, 2);
  featured.innerHTML='';
  grid.innerHTML = '<article class="card" style="grid-column:span 12"><div class="card-body"><h3 class="card-title">No se pudo cargar news.json</h3><p class="card-text">Crea el archivo docs/news.json con este ejemplo:</p><pre style="white-space:pre-wrap;background:#f7fafc;border:1px solid #e5e7eb;border-radius:10px;padding:10px;overflow:auto">'+escapeHtml(sample)+'</pre></div></article>';
}

function unique(arr){ return [...new Set(arr)]; }
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/\\p{Diacritic}/gu,'');}

function fillFilters(){
  try{
    const years = unique(NEWS.map(n => (n.dateObj||new Date()).getFullYear())).sort((a,b)=>b-a);
    if (year) year.innerHTML = '<option value=\"\">Año</option>'+years.map(y=>`<option>${y}</option>`).join('');
    const tags = unique(NEWS.flatMap(n => n.tags || [])).sort((a,b)=>a.localeCompare(b));
    if (tag) tag.innerHTML = '<option value=\"\">Etiqueta</option>'+tags.map(t=>`<option>${t}</option>`).join('');
  }catch(_){}
}

function topTags(limit=8){
  const count = {}; (NEWS||[]).flatMap(n=>n.tags||[]).forEach(t=>count[t]=(count[t]||0)+1);
  return Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
}

function buildChips(){
  const holder = document.getElementById('chips'); if(!holder) return;
  const tops = topTags();
  holder.innerHTML = tops.map(t=>`<button class=\"chip\" data-tag=\"${t}\">#${t}</button>`).join('');
  holder.onclick = (e)=>{
    const b = e.target.closest('.chip'); if(!b) return;
    if (tag){ tag.value = tag.value === b.dataset.tag ? "" : b.dataset.tag; }
    holder.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.tag===(tag?tag.value:"")));
    applyFilters();
  };
}

function applyFilters(){
  const qv = norm(q ? q.value : '');
  const yv = year ? year.value : '';
  const tv = tag ? tag.value : '';
  filtered = NEWS.filter(n => {
    const inQ = !qv || norm(n.title).includes(qv) || norm(n.place||'').includes(qv) || norm(n.text).includes(qv) || (n.tags||[]).some(t=>norm(t).includes(qv));
    const inY = !yv || (n.dateObj && n.dateObj.getFullYear().toString() === yv);
    const inT = !tv || (n.tags||[]).includes(tv);
    return inQ && inY && inT;
  });
  page = 1;
  render();
}

function paginate(list, size, p){ const i=(p-1)*size; return list.slice(i, i+size); }

function render(){
  if (document.body && onlyHeaders) document.body.classList.toggle('header-only', !!onlyHeaders.checked);
  renderFeatured();
  const items = paginate(filtered.slice(1), PAGE_SIZE, page);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, filtered.length-1) / PAGE_SIZE));
  if (pageInfo) pageInfo.textContent = `Página ${page}/${totalPages}`;
  if (prev) prev.disabled = page<=1;
  if (next) next.disabled = page>=totalPages;
  grid.innerHTML = items.map(card).join('') || emptyState();
  document.querySelectorAll('[data-zoom]').forEach(img => img.addEventListener('click', () => openLightbox(img.src)));
}

function emptyState(){ return '<div class=\"card\" style=\"grid-column:span 12\"><div class=\"card-body\"><div class=\"card-title\">Sin resultados</div><p class=\"card-text\">Quita filtros o prueba otra búsqueda.</p></div></div>'; }

function renderFeatured(){
  const f = filtered[0] || NEWS[0];
  if(!f){ featured.innerHTML=''; return; }
  const dateStr = (f.dateObj||new Date()).toLocaleDateString('es-ES',{day:'2-digit', month:'long', year:'numeric'});
  const tags = (f.tags||[]).map(t=>`<span class=\"tag\">${t}</span>`).join('');
  const read = f.url ? `<a class=\"btn-share\" href=\"${f.url}\" target=\"_blank\" rel=\"noopener\">Leer más →</a>` : '';
  featured.innerHTML = `
  <article class="feature-card">
    <div class="feature-media" title="Ampliar imagen">
      <img src="${useImg(f.image)}" alt="${escapeHtml(f.title)}" loading="lazy" data-zoom>
    </div>
    <div class="feature-body">
      <h2 class="feature-title">${f.title}</h2>
      <div class="feature-meta">
        <span class="date">📍 ${f.place||'—'}</span>
        <span class="badge">${dateStr}</span>
      </div>
      <p class="feature-text">${f.text}</p>
      <div class="tags">${tags}</div>
      <div class="actions">${read}</div>
    </div>
  </article>`;
}

function card(n){
  const dateStr = (n.dateObj||new Date()).toLocaleDateString('es-ES',{day:'2-digit', month:'long', year:'numeric'});
  const tags = (n.tags||[]).map(t=>`<span class=\"tag\">${t}</span>`).join('');
  const read = n.url ? `<a class=\"btn-share\" href=\"${n.url}\" target=\"_blank\" rel=\"noopener\">Leer más →</a>` : '';
  return `
  <article class="card">
    <div class="card-media" title="Ampliar imagen">
      <img src="${useImg(n.image)}" alt="${escapeHtml(n.title)}" loading="lazy" data-zoom>
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
  if (q) q.addEventListener('input', debounce(applyFilters, 200));
  if (year) year.addEventListener('change', applyFilters);
  if (tag) tag.addEventListener('change', ()=>{ const holder=document.getElementById('chips'); if(holder){ holder.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.tag===tag.value)); } applyFilters(); });
  if (onlyHeaders) onlyHeaders.addEventListener('change', render);
  if (prev) prev.addEventListener('click', ()=>{ if(page>1){ page--; render(); } });
  if (next) next.addEventListener('click', ()=>{ const totalPages = Math.ceil(Math.max(0, filtered.length-1)/PAGE_SIZE); if(page<totalPages){ page++; render(); } });
  if (btnRss) btnRss.addEventListener('click', generateRSS);
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
