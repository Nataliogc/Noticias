@echo off
set "REMOTE_URL=https://github.com/Nataliogc/Noticias.git"
git remote remove origin >nul 2>&1
git remote add origin "%REMOTE_URL%"
echo Remoto origin configurado: %REMOTE_URL%
pause
