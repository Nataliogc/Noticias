@echo off
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo No se ha encontrado Python en PATH. Instala Python o usa: npx http-server -p 5500
  pause
  exit /b 1
)
python -m http.server 5500
