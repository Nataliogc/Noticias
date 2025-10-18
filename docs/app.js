// Portada sin imágenes y con control de chips
const el = (s)=>document.querySelector(s);
const featured = el('#featured');
const grid = el('#grid');
const chips = el('#chips');
const q = el('#q');
const year = el('#year');
const tag = el('#tag');
const onlyHeaders = el('#onlyHeaders');
const prev = el('#prev');
const next = el('#next');
const pageInfo = el('#pageInfo');
const btnRss = el('#btnRss');

// === Ajustes de comportamiento ===
const SHOW_IMAGES = false;              // <- no mostrar imágenes por ahora
const CHIPS_ORDER = ["Comunicación interna","B2B","Murcia","Promoción"]; // <- orden fijo; si vacío, se calcula por frecuencia
const PAGE_SIZE = 6;

let NEWS=[], filtered=[], page=1;

async function load(){
  try{
    const res = await fetch('./news.json', {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    NEWS = await res.json();
    NEWS.forEach(n=>n.dateObj=new Date(n.date));
    NEWS.sort((a,b)=>b.dateObj-a.dateObj);
    fillFilters();
    buildChips();
    applyFilters();
    bindEvents();
  }catch(e){
    showError(e);
    console.error(e);
  }
}

function showError(e){
  featured.innerHTML='';
  grid.innerHTML=`<article class="card" style="grid-column:span 12"><div class="card-body"><h3 class="card-title">No se pudo cargar news.json</h3><p class="card-text">Asegúrate de subir <b>docs/news.json</b>.</p></div></article>`;
}

function unique(a){return [...new Set(a)];}
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');}

function fillFilters(){
  const years=unique(NEWS.map(n=>n.dateObj.getFullYear())).sort((a,b)=>b-a);
  year.innerHTML = `<option value="">Año</option>`+years.map(y=>`<option>${y}</option>`).join('');
  const tags=unique(NEWS.flatMap(n=>n.tags||[])).sort((a,b)=>a.localeCompare(b));
  tag.innerHTML = `<option value="">Etiqueta</option>`+tags.map(t=>`<option>${t}</option>`).join('');
}

function topTags(limit=8){
  if(CHIPS_ORDER && CHIPS_ORDER.length) return CHIPS_ORDER.slice(0,limit);
  const count={};
  (NEWS||[]).flatMap(n=>n.tags||[]).forEach(t=>count[t]=(count[t]||0)+1);
  return Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
}

function buildChips(){
  const tops=topTags();
  chips.innerHTML = tops.map(t=>`<button class="chip" data-tag="${t}">#${t}</button>`).join('');
  chips.onclick=(e)=>{
    const b=e.target.closest('.chip'); if(!b) return;
    tag.value = tag.value===b.dataset.tag ? "" : b.dataset.tag;
    chips.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.tag===tag.value));
    applyFilters();
  };
}

function applyFilters(){
  const qv=norm(q.value), yv=year.value, tv=tag.value;
  filtered = NEWS.filter(n=>{
    const inQ = !qv || norm(n.title).includes(qv) || norm(n.place||'').includes(qv) || norm(n.text).includes(qv) || (n.tags||[]).some(t=>norm(t).includes(qv));
    const inY = !yv || (n.dateObj && n.dateObj.getFullYear().toString()===yv);
    const inT = !tv || (n.tags||[]).includes(tv);
    return inQ && inY && inT;
  });
  page=1;
  render();
}

function paginate(list,size,p){const i=(p-1)*size;return list.slice(i,i+size);}

function render(){
  document.body.classList.toggle('header-only', onlyHeaders.checked);
  renderFeatured();
  const items = paginate(filtered.slice(1), PAGE_SIZE, page);
  grid.innerHTML = items.map(card).join('');
  const totalPages=Math.max(1,Math.ceil(Math.max(0,filtered.length-1)/PAGE_SIZE));
  pageInfo.textContent = `Página ${page}/${totalPages}`;
  prev.disabled=page<=1; next.disabled=page>=totalPages;
}

function renderFeatured(){
  const f = filtered[0] || NEWS[0];
  if(!f){ featured.innerHTML=''; return; }
  const dateStr = (f.dateObj||new Date()).toLocaleDateString('es-ES',{day:'2-digit', month:'long', year:'numeric'});
  const tags = (f.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');
  const read = f.url ? `<a class="btn-share" href="${f.url}" target="_blank" rel="noopener">Leer más →</a>` : '';
  featured.innerHTML = `
  <article class="feature-card">
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
  const tags = (n.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');
  const read = n.url ? `<a class="btn-share" href="${n.url}" target="_blank" rel="noopener">Leer más →</a>` : '';
  return `
  <article class="card">
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

function bindEvents(){
  q.addEventListener('input', debounce(applyFilters, 200));
  year.addEventListener('change', applyFilters);
  tag.addEventListener('change', ()=>{ chips.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.tag===tag.value)); applyFilters(); });
  onlyHeaders.addEventListener('change', render);
  prev.addEventListener('click', ()=>{ if(page>1){ page--; render(); } });
  next.addEventListener('click', ()=>{ const totalPages = Math.ceil(Math.max(0, filtered.length-1)/PAGE_SIZE); if(page<totalPages){ page++; render(); } });
  btnRss.addEventListener('click', generateRSS);
}

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

function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}}

load();
