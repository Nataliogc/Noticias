async function load() {
  try {
    let usedFallback = false;

    try {
      const res = await fetch('./news.json', {cache: 'no-store'});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      NEWS = await res.json();
    } catch (e) {
      if (Array.isArray(window.NEWS_FALLBACK)) {
        NEWS = window.NEWS_FALLBACK;
        usedFallback = true;
      } else {
        showMissingJSON(e);
        return; // salimos: no re-render
      }
    }

    NEWS.forEach(n => n.dateObj = new Date(n.date));
    NEWS.sort((a,b) => b.dateObj - a.dateObj);

    // Limpia cualquier mensaje residual antes de pintar
    featured.innerHTML = '';
    grid.innerHTML = '';

    fillFilters();
    buildChips();
    applyFilters();
    bindEvents();

    // Solo para depurar: indica si estás viendo fallback
    if (usedFallback) console.info('Usando NEWS_FALLBACK (modo local)');
  } catch (e) {
    showMissingJSON(e);
    console.error(e);
  }
}
