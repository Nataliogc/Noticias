// Pro con imágenes + logos dimensionados + fallback integrado
const el = s=>document.querySelector(s);
const featured = el('#featured');
const grid = el('#grid');
const q = el('#q'); const year = el('#year'); const tag = el('#tag');
const prev = el('#prev'); const next = el('#next'); const pageInfo = el('#pageInfo');
const PAGE_SIZE = 6;

// Lightbox sencillo
const dlg = document.createElement('dialog'); dlg.id='lightbox'; dlg.innerHTML='<img id="lbimg" alt="">'; document.body.appendChild(dlg);
dlg.addEventListener('click',e=>{ if(e.target===dlg) dlg.close(); });
const lbimg = document.getElementById('lbimg');

let NEWS=[], filtered=[], page=1;

async function load(){
  try{
    try{
      const res = await fetch('./news.json', {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      NEWS = await res.json();
    }catch(e){
      if(Array.isArray(window.NEWS_FALLBACK)){ NEWS = window.NEWS_FALLBACK; console.warn('Usando NEWS_FALLBACK'); }
      else { throw e; }
    }
    if(!Array.isArray(NEWS)) throw new Error('news.json no es un array');
    NEWS.forEach(n=>n.dateObj=new Date(n.date));
    NEWS.sort((a,b)=>b.dateObj-a.dateObj);
    fillFilters(); applyFilters(); bindEvents();
  }catch(e){
    showError(e);
    console.error(e);
  }
}

function showError(e){
  featured.innerHTML='';
  grid.innerHTML='<article class="card" style="grid-column:span 12"><div class="card-body"><h3 class="card-title">No se pudo cargar news.json</h3><p class="card-text">Sube <b>docs/news.json</b> o deja <b>NEWS_FALLBACK</b> en index.html.</p></div></article>';
}

function unique(a){return [...new Set(a)];}
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/\\p{Diacritic}/gu,'');}

function fillFilters(){
  const years = unique(NEWS.map(n=>(n.dateObj||new Date()).getFullYear())).sort((a,b)=>b-a);
  year.innerHTML = '<option value=\"\">Año</option>'+years.map(y=>`<option>${y}</option>`).join('');
  const tags = unique(NEWS.flatMap(n=>n.tags||[])).sort((a,b)=>a.localeCompare(b));
  tag.innerHTML = '<option value=\"\">Etiqueta</option>'+tags.map(t=>`<option>${t}</option>`).join('');
}

function applyFilters(){
  const qv=norm(q.value), yv=year.value, tv=tag.value;
  filtered = NEWS.filter(n=>{
    const inQ = !qv || norm(n.title).includes(qv) || norm(n.place||'').includes(qv) || norm(n.text).includes(qv) || (n.tags||[]).some(t=>norm(t).includes(qv));
    const inY = !yv || (n.dateObj && n.dateObj.getFullYear().toString()===yv);
    const inT = !tv || (n.tags||[]).includes(tv);
    return inQ && inY && inT;
  });
  page=1; render();
}

function paginate(list,size,p){const i=(p-1)*size;return list.slice(i,i+size);}

function render(){
  renderFeatured();
  const items = paginate(filtered.slice(1), PAGE_SIZE, page);
  grid.innerHTML = items.map(card).join('') || emptyState();
  const totalPages = Math.max(1, Math.ceil(Math.max(0, filtered.length-1)/PAGE_SIZE));
  pageInfo.textContent = `Página ${page}/${totalPages}`;
  prev.disabled = page<=1; next.disabled = page>=totalPages;
  document.querySelectorAll('[data-zoom]').forEach(img=>img.addEventListener('click',()=>{ lbimg.src=img.src; dlg.showModal(); }));
}

function emptyState(){return '<div class=\"card\" style=\"grid-column:span 12\"><div class=\"card-body\"><div class=\"card-title\">Sin resultados</div><p class=\"card-text\">Quita filtros o prueba otra búsqueda.</p></div></div>';}

function renderFeatured(){
  const f = filtered[0] || NEWS[0];
  if(!f){ featured.innerHTML=''; return; }
  const dateStr = (f.dateObj||new Date()).toLocaleDateString('es-ES',{day:'2-digit', month:'long', year:'numeric'});
  const tags = (f.tags||[]).map(t=>`<span class=\"tag\">${t}</span>`).join('');
  const read = f.url ? `<a class=\"btn-share\" href=\"${f.url}\" target=\"_blank\" rel=\"noopener\">Leer más →</a>` : '';
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

function escapeHtml(s){return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function bindEvents(){
  q.addEventListener('input', debounce(applyFilters, 200));
  year.addEventListener('change', applyFilters);
  tag.addEventListener('change', applyFilters);
  prev.addEventListener('click', ()=>{ if(page>1){ page--; render(); } });
  next.addEventListener('click', ()=>{ const totalPages = Math.ceil(Math.max(0, filtered.length-1)/PAGE_SIZE); if(page<totalPages){ page++; render(); } });
}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}}

load();
