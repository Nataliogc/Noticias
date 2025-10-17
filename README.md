# Noticias · Portada v5 + Automatización

## 1) Cómo publicar cambios con el BAT
Coloca estos dos archivos en la **raíz del repositorio** (junto a la carpeta `docs/`):
- `set_remote.bat`
- `push_changes.bat`

### Primer uso (una vez)
1. Haz doble clic en `set_remote.bat` para configurar el remoto `origin` (usa `https://github.com/Nataliogc/Noticias.git`).
2. Si tu repo aún no tiene Pages activado: Settings → Pages → Source = Deploy from branch → Branch `main` → Folder `/docs`.

### En cada actualización
1. Edita `docs/news.json`, añade imágenes en `docs/img/` o HTMLs en `docs/posts/`.
2. Doble clic en `push_changes.bat` → hace **git add + commit con timestamp + pull --rebase + push**.
3. Refresca tu GitHub Pages (Ctrl+F5).

> Si Git te pide usuario/contraseña en el primer push, inicia sesión con GitHub Desktop o usa Git Credential Manager (se instala con Git).

## 2) Cómo subir nuevas noticias
- Abre `docs/news.json` y añade una entrada al principio del array para que aparezca **como destacada**.
- Campos:
```json
{
  "title": "Título",
  "place": "Ciudad / sede",
  "date": "YYYY-MM-DD",
  "image": "./img/archivo.jpg",
  "tags": ["Etiqueta1", "Etiqueta2"],
  "text": "Resumen en una o dos frases.",
  "url": "./posts/mi-noticia.html"   // opcional (Blogger o HTML local)
}
```
- **Imagen**: usa URL externa (Blogger) o sube a `docs/img/` y referencia con `./img/...`.
- **Página completa** (opcional): crea `docs/posts/mi-noticia.html` y enlázala con `url` para tener el botón **“Leer más →”**.
- **Orden**: la primera del array es la **destacada**; el resto salen abajo con paginación automática.

## 3) Contenido incluido en esta versión
- Portada mejorada (tipografía, sombras, badges y layout).
- `news.json` de ejemplo con **3 tarjetas**.
- Botón “Leer más →” (Blogger o post interno).
- Lightbox para imágenes, filtros, chips, RSS.
