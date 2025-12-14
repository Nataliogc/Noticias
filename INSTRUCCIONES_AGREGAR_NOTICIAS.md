# 📝 Cómo agregar nuevas noticias

Este proyecto incluye una herramienta automática para facilitarte la creación de noticias sin tocar código complejo.

## Paso 1: Abrir el Generador
1. Ve a la carpeta `tools` de tu proyecto.
2. Haz doble clic en el archivo **`admin_generator.html`**. Se abrirá en tu navegador.

## Paso 2: Rellenar los datos
Rellena el formulario con la información de la noticia:
- **Título**: El titular de la noticia.
- **Fecha**: Fecha de publicación.
- **Hotel**: Selecciona si es para Guadiana, Cumbria o ambos.
- **Imagen**: La ruta de la imagen (ej: `img/mifoto.jpg`). *Recuerda guardar la foto real en esa carpeta antes.*
- **Etiquetas**: Palabras clave separadas por coma (ej: Navidad, Eventos).
- **Video**: (Opcional) Pega el `<iframe>` de YouTube o Drive si quieres video.

Dale al botón **"Generar Código"**.

## Paso 3: Pegar el código
La herramienta te mostrará dos bloques de código.

### A. Pegar el JSON (Obligatorio)
1. Copia el primer bloque (Código JSON).
2. Abre el archivo **`data/posts.js`** con un editor de texto (Bloc de notas o VS Code).
3. Pega el código justo después de `window.POSTS = [` (al principio de la lista).
4. Guarda el archivo.

### B. Crear el archivo de la noticia (Opcional)
*Solo necesario si la noticia es larga y quieres una página dedicada.*
1. Copia el segundo bloque (Código HTML).
2. Crea un nuevo archivo en la carpeta `posts/` con el nombre que te sugiere la herramienta (ej: `cena-navidad-2025.html`).
3. Pega el código dentro y guarda.

## Paso 4: Publicar
1. Sube los cambios a GitHub (Commit & Push) o ejecuta tu script `push_changes.bat`.
2. ¡Listo! La noticia aparecerá automáticamente en la portada y filtros.
