@echo off
REM Subida rápida de Noticias (carpeta docs) a GitHub
cd /d "%~dp0"
echo === Commit & Push Noticias ===
git add .
set /p MSG="Mensaje de commit (por defecto: 'content: noticias y estilos'): "
if "%MSG%"=="" set MSG=content: noticias y estilos
git commit -m "%MSG%"
git push
pause
