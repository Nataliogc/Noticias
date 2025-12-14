/**
 * Noticias App - Logic
 * Separa la lógica de presentación y filtrado.
 */

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Estado global
const state = {
    allPosts: [],
    currentPosts: [],
    filters: {
        year: 'all',
        tag: 'all',
        search: ''
    }
};

function initApp() {
    const app = document.getElementById("app");

    // 1. Cargar datos
    const postsRaw = Array.isArray(window.POSTS_DATA) ? window.POSTS_DATA.slice() : [];

    if (!postsRaw.length) {
        if (app) {
            app.innerHTML = `
        <section class="loading-state">
            <h2>Últimas noticias</h2>
            <p>No hay noticias publicadas todavía.</p>
        </section>`;
        }
        return;
    }

    // 2. Procesar datos (ordenar, fechas)
    state.allPosts = postsRaw.sort((a, b) => new Date(b.date) - new Date(a.date));
    state.currentPosts = [...state.allPosts]; // Copia inicial

    // 3. Render inicial
    renderApp();

    // 4. Configurar eventos (Search, Filtros)
    setupSearch();
    setupFilterButtons();
}

/**
 * Renderiza toda la aplicación basándose en state.currentPosts
 */
function renderApp() {
    const app = document.getElementById("app");
    if (!app) return;

    // Si hay búsqueda o filtro activo, quizás no queramos mostrar el Hero, 
    // o quizás sí. Por ahora, mantenemos la lógica original:
    // Hero = 3 primeros (si no hay filtro búsqueda agresivo)
    // Grid = Resto

    // MEJORA: Si estamos filtrando, tal vez 'Hero' desaparezca y todo sea Grid.
    // Para mantener compatibilidad visual 100% con lo que había, 
    // si estamos en estado "default" (sin filtros), mostramos Hero.
    // Si hay filtros, mostramos todo en Grid para facilitar la lectura.

    const isDefaultState = (state.filters.search === '' && state.filters.year === 'all' && state.filters.tag === 'all');

    let heroPosts = [];
    let gridPosts = [];

    if (isDefaultState) {
        heroPosts = state.currentPosts.slice(0, 3);
        gridPosts = state.currentPosts.slice(3);
    } else {
        // Modo filtrado: todo al grid
        heroPosts = [];
        gridPosts = state.currentPosts;
    }

    const html = renderLayout(heroPosts, gridPosts, isDefaultState);
    app.innerHTML = html;

    if (heroPosts.length > 0) {
        setupHeroSlider();
    }
}

/**
 * Genera el HTML
 */
function renderLayout(heroPosts, gridPosts, showHeroSection) {
    let heroHtml = "";

    // === Carrusel (Solo si hay posts y estamos en modo default o decidimos mostrarlo) ===
    if (heroPosts.length > 0) {
        heroHtml += `
      <section class="hero">
        <div class="hero-slides">
    `;

        heroPosts.forEach((post, index) => {
            const activeClass = index === 0 ? " hero-slide--active" : "";
            heroHtml += `
        <article class="hero-slide${activeClass}" data-index="${index}">
          <div class="hero-slide-left">
            ${post.image
                    ? `<img src="${post.image}" alt="${escapeHtml(post.title || "")}" class="hero-image">`
                    : `<h2 class="hero-slide-title">${escapeHtml(post.title || "")}</h2>`
                }
          </div>
          <div class="hero-slide-right">
            <p class="hero-badge">DESTACADO</p>
            <h3 class="hero-headline">${escapeHtml(post.title || "")}</h3>
            <p class="hero-meta">
              <span class="hero-date">${formatDate(post.date)}</span>
              ${post.hotel
                    ? `<span class="hero-hotel">${escapeHtml(post.hotel)}</span>`
                    : ""
                }
            </p>
            <p class="hero-excerpt">${escapeHtml(post.excerpt || "")}</p>
            <a class="hero-button" href="${post.url || ('posts/' + post.slug)}">Leer completa ↗</a>

            <button class="hero-next-btn" type="button" aria-label="Siguiente noticia">
               &#x25B6;
            </button>
          </div>
        </article>
      `;
        });

        heroHtml += `
        </div>
        <div class="hero-dots">
    `;

        heroPosts.forEach((_, index) => {
            const activeClass = index === 0 ? " hero-dot--active" : "";
            heroHtml += `
        <button class="hero-dot${activeClass}" data-index="${index}"
                aria-label="Ver noticia ${index + 1}"></button>
      `;
        });

        heroHtml += `
        </div>
      </section>
    `;
    }

    // === Rejilla ===
    let gridHtml = "";

    if (gridPosts.length > 0) {
        gridHtml = `
        <section class="news-grid-section">
          ${showHeroSection ? '<h2 class="section-title">Más noticias</h2>' : '<h2 class="section-title">Resultados</h2>'}
          <div class="news-grid">
      `;

        gridPosts.forEach((post) => {
            gridHtml += `
          <article class="news-card">
            ${post.image
                    ? `<a class="news-card-thumb" href="${post.url || ('posts/' + post.slug)}">
                     <img src="${post.image}" alt="${escapeHtml(post.title || "")}">
                   </a>`
                    : ""
                }
            <div class="news-card-body">
              <header class="news-card-header">
                <p class="news-card-date">${formatDate(post.date)}</p>
                ${post.hotel
                    ? `<span class="news-card-hotel">${escapeHtml(post.hotel)}</span>`
                    : ""
                }
              </header>
              <h3 class="news-card-title">
                <a href="${post.url || ('posts/' + post.slug)}">${escapeHtml(post.title || "")}</a>
              </h3>
              <p class="news-card-excerpt">${escapeHtml(post.excerpt || "")}</p>
              <a class="news-card-link" href="${post.url || ('posts/' + post.slug)}">Leer más</a>
            </div>
          </article>
        `;
        });

        gridHtml += `
          </div>
        </section>
      `;
    } else if (!showHeroSection) {
        // Si no mostramos hero y no hay grid posts, es empty state de búsqueda
        gridHtml = `
        <section class="empty-state">
            <p>No se encontraron noticias con los filtros actuales.</p>
            <button onclick="clearFilters()" class="pill-button">Borrar filtros</button>
        </section>
      `;
    }

    return heroHtml + gridHtml;
}

/**
 * Lógica del Slider
 */
function setupHeroSlider() {
    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    const dots = Array.from(document.querySelectorAll(".hero-dot"));
    const nextButtons = Array.from(document.querySelectorAll(".hero-next-btn"));
    if (!slides.length) return;

    let current = 0;
    let interval;

    const goTo = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle("hero-slide--active", i === current));
        dots.forEach((d, i) => d.classList.toggle("hero-dot--active", i === current));
    };

    const startInterval = () => {
        if (interval) clearInterval(interval);
        interval = setInterval(() => goTo(current + 1), 8000);
    }

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            const idx = parseInt(dot.dataset.index, 10) || 0;
            goTo(idx);
            startInterval();
        });
    });

    nextButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            goTo(current + 1);
            startInterval();
        });
    });

    startInterval();
}

/**
 * Filtros y Búsqueda
 */
function setupSearch() {
    const input = document.getElementById("search-main");
    if (!input) return;

    input.addEventListener("input", (e) => {
        state.filters.search = e.target.value.trim().toLowerCase();
        applyFilters();
    });
}

function setupFilterButtons() {
    const yearContainer = document.getElementById("filter-year-container");
    const tagContainer = document.getElementById("filter-tag-container");

    if (!yearContainer || !tagContainer) return;

    // 1. Extraer Años Únicos
    const years = new Set(state.allPosts.map(p => new Date(p.date).getFullYear()));
    const yearsSorted = Array.from(years).sort((a, b) => b - a);

    // 2. Renderizar Botones Años
    // Botón "Todos"
    yearContainer.innerHTML = '';
    const btnAllYears = createFilterButton("Todos", "all", "year");
    yearContainer.appendChild(btnAllYears);

    yearsSorted.forEach(y => {
        yearContainer.appendChild(createFilterButton(y, y.toString(), "year"));
    });

    // 3. Extraer Tags Únicos
    const tags = new Set();
    state.allPosts.forEach(p => {
        if (Array.isArray(p.tags)) {
            p.tags.forEach(t => tags.add(t));
        }
    });
    const tagsSorted = Array.from(tags).sort();

    // 4. Renderizar Botones Tags
    // Botón "Todos" (o icono clean)
    tagContainer.innerHTML = '';
    // Podríamos poner un select si son muchos, pero por ahora pills:
    // Para simplificar espacio: Solo top 5 tags o un dropdown? 
    // Vamos a poner un <select> customizado o pills scrollables si son muchos.
    // Dado el diseño "premium", pills horizontales con scroll son buena opcion.

    // Contenedor scrollable
    const tagScroll = document.createElement("div");
    tagScroll.className = "filter-scroll-area";
    // Nota: Necesitamos estilo para esto en CSS si queremos scroll. 
    // Por ahora, renderizamos pills simples.

    const btnAllTags = createFilterButton("Todas las etiquetas", "all", "tag");
    tagContainer.appendChild(btnAllTags);

    tagsSorted.forEach(t => {
        tagContainer.appendChild(createFilterButton(t, t, "tag"));
    });
}

function createFilterButton(label, value, type) {
    const btn = document.createElement("button");
    btn.className = "pill-button";
    if (state.filters[type] === value) {
        btn.classList.add("active");
    }
    btn.textContent = label;
    btn.onclick = () => {
        setFilter(type, value);
    };
    return btn;
}

function setFilter(type, value) {
    state.filters[type] = value;

    // Actualizar visualmente botones activos
    const container = type === 'year'
        ? document.getElementById("filter-year-container")
        : document.getElementById("filter-tag-container");

    if (container) {
        Array.from(container.children).forEach(b => {
            if (b.textContent === (value === 'all' ? (type === 'year' ? 'Todos' : 'Todas las etiquetas') : value) ||
                (value === 'all' && (b.textContent === 'Todos' || b.textContent === 'Todas las etiquetas'))) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        // Fix simple para asegurar que el click marca el correcto si el texto coincide
        // Mejor reconstruir la clase active basándose en el valor real no es trivial sin guardar referencia en DOM.
        // Re-render rápido de clases:
        Array.from(container.querySelectorAll(".pill-button")).forEach(btn => {
            // Lógica aproximada por label, idealmente dataset
            btn.classList.remove("active");
        });

        // Buscar el botón clickeado o re-generar. 
        // Para simplificar, simplemente re-ejecutamos setupFilterButtons? No, perdería foco.
        // Vamos a usar target del evento si fuera pasado, pero aquí estamos en función helper.
        // Lo más robusto: iterar botones y comparar texto y valor esperado.
    }

    // Re-render UI completa (botones se regeneran en setupFilterButtons? No, solo init)
    // Vamos a hacer una actualización visual "manual" simple:
    updateActiveButtons(type, value);

    applyFilters();
}

function updateActiveButtons(type, value) {
    const container = type === 'year'
        ? document.getElementById("filter-year-container")
        : document.getElementById("filter-tag-container");

    if (!container) return;

    const buttons = container.querySelectorAll(".pill-button");
    buttons.forEach(btn => {
        // Asumimos que el label es el value salvo "Todos"
        const btnValue = (btn.textContent === "Todos" || btn.textContent === "Todas las etiquetas") ? "all" : btn.textContent;
        if (String(btnValue) === String(value)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}


function applyFilters() {
    const { search, year, tag } = state.filters;

    state.currentPosts = state.allPosts.filter(post => {
        // Texto
        const searchText = (
            (post.title || "") + " " +
            (post.excerpt || "") + " " +
            (post.tags?.join(" ") || "") + " " +
            (post.hotel || "")
        ).toLowerCase();

        const matchesSearch = !search || searchText.includes(search);

        // Año
        const postYear = new Date(post.date).getFullYear().toString();
        const matchesYear = year === 'all' || postYear === year;

        // Tag
        const matchesTag = tag === 'all' || (post.tags && post.tags.includes(tag));

        return matchesSearch && matchesYear && matchesTag;
    });

    renderApp();
}

// Global para llamar desde HTML si hace falta
window.clearFilters = () => {
    state.filters.search = '';
    const input = document.getElementById("search-main");
    if (input) input.value = '';
    applyFilters();
}


/* UTILIDADES */
function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
