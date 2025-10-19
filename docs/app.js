(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
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
    if (!list) {
      console.error('[Noticias] Falta #news-list en el DOM');
      return;
    }

    // URL inteligente: en local (file://) usa la URL pública; en Pages/servidor usa el JSON local
    const jsonURL = (location.protocol === 'file:')
      ? 'https://Nataliogc.github.io/Noticias/news.json'
      : 'news.json?v=' + Date.now(); // anti-caché en Pages

    console.log('[Noticias] Fetch:', jsonURL);

    let data;
    try {
      const res = await fetch(jsonURL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error('[Noticias] Error cargando news.json:', err);
      showStatus('No se pudo cargar “news.json”. Verifica la ruta y el formato JSON.', true);
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[Noticias] news.json vacío o formato incorrecto:', data);
      showStatus('No hay noticias para mostrar (news.json vacío).', false);
      return;
    }

    // Orden por fecha descendente
    data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Render
    const frag = document.createDocumentFragment();
    data.forEach(n => {
      const fecha = n.fecha
        ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
            .format(new Date(n.fecha + 'T12:00:00'))
        : '';

      const card = document.createElement('article');
      card.className = 'card';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <h3 style="margin:0 0 .25rem; color:#0b3e59">${n.titulo || 'Sin título'}</h3>
        ${fecha ? `<div style="color:#667085; font-size:.9rem; margin:0 0 .5rem">Fecha: ${fecha}</div>` : ''}
        ${n.texto ? `<p style="margin:.25rem 0 0; color:#073763">${n.texto}</p>` : ''}
        ${n.url ? `<p style="margin:.5rem 0 0;"><a href="${n.url}" target="_blank" rel="noopener">Leer completa ↗</a></p>` : ''}
      `;
      frag.appendChild(card);
    });

    list.innerHTML = ''; // limpia placeholder
    list.appendChild(frag);
    console.log(`[Noticias] Renderizadas ${data.length} noticia(s).`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews);
  } else {
    loadNews();
  }
})();
