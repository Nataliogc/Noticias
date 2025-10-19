(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const list = $('#news-list');

  function showStatus(msg, isError = false) {
    if (!list) return;
    const bar = document.createElement('div');
    bar.style.margin = '12px 0';
    bar.style.padding = '10px 12px';
    bar.style.borderRadius = '8px';
    bar.style.background = isError ? '#fee2e2' : '#e6f4ff';
    bar.style.color = isError ? '#991b1b' : '#0b4a6e';
    bar.style.fontSize = '.95rem';
    bar.textContent = msg;
    list.appendChild(bar);
  }

  async function loadNews() {
    if (!list) return console.error('Falta #news-list');

    // Local (file://) usa la URL pública; en GitHub Pages/servidor usa el JSON local
   const jsonURL = (location.protocol === 'file:')
  ? 'https://Nataliogc.github.io/Noticias/news.json'
  : 'news.json?v=' + Date.now();
const res = await fetch(jsonURL, { cache: 'no-store' });


    console.log('[Noticias] Fetch:', jsonURL);

    let data;
    try {
      const res = await fetch(jsonURL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      // Limpia BOM y espacios extra, luego parsea
      const clean = text.replace(/^\uFEFF/, '').trim();
      data = JSON.parse(clean);
    } catch (err) {
      console.error('[Noticias] Error cargando o parseando news.json:', err);
      showStatus('No se pudo cargar “news.json”. Revisa que no se incluya como <script> y que sea JSON válido.', true);
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      showStatus('No hay noticias para mostrar (news.json vacío).', false);
      return;
    }

    // Orden por fecha desc
    data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Render muy simple (para comprobar carga)
    const frag = document.createDocumentFragment();
    data.forEach(n => {
      const fecha = n.fecha
        ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
            .format(new Date(n.fecha + 'T12:00:00'))
        : '';

      const card = document.createElement('article');
      card.style.background = '#fff';
      card.style.border = '1px solid rgba(0,0,0,.06)';
      card.style.borderRadius = '12px';
      card.style.boxShadow = '0 1px 0 rgba(0,0,0,.06)';
      card.style.padding = '12px';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <h3 style="margin:0 0 .25rem; color:#0b3e59">${n.titulo || 'Sin título'}</h3>
        ${fecha ? `<div style="color:#667085; font-size:.9rem; margin:0 0 .5rem">Fecha: ${fecha}</div>` : ''}
        ${n.texto ? `<p style="margin:.25rem 0 0; color:#073763">${n.texto}</p>` : ''}
        ${n.url ? `<p style="margin:.5rem 0 0;"><a href="${n.url}" target="_blank" rel="noopener">Leer completa ↗</a></p>` : ''}
      `;
      frag.appendChild(card);
    });

    list.innerHTML = '';
    list.appendChild(frag);
    console.log(`[Noticias] Renderizadas ${data.length} noticia(s).`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews);
  } else {
    loadNews();
  }
})();
