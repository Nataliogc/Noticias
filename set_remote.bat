@echo off
REM === Edita SOLO esta linea si tu repo cambia de URL ===
set "REMOTE_URL=https://github.com/Nataliogc/Noticias.git"

git remote remove origin >nul 2>&1
git remote add origin "%REMOTE_URL%"
echo Remoto origin configurado: %REMOTE_URL%
pause
