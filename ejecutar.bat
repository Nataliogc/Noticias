@echo off
setlocal
set DOCS=%~dp0docs
if not exist "%DOCS%\index.html" (
  echo No encuentro docs\index.html en %DOCS%
  pause
  exit /b 1
)
echo Abriendo el visual de noticias (modo local) ...
start "" "%DOCS%\index.html"
echo.
echo Si ves noticias en blanco al abrir localmente, es normal: el visual usa datos embebidos.
echo Para publicar en GitHub Pages, sube la carpeta docs/ al repo y activa Pages (folder /docs).
echo.
pause
