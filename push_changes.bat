@echo off
setlocal EnableDelayedExpansion
set "REPO_DIR=%~dp0"
cd /d "%REPO_DIR%" || (echo No puedo acceder a %REPO_DIR% & pause & exit /b 1)
git --version >nul 2>&1 || (echo No encuentro Git. Instala Git for Windows desde git-scm.com & pause & exit /b 1)
if not exist ".git" ( git init & git branch -M main )
git config user.name >nul || git config user.name "Natalio"
git config user.email >nul || git config user.email "natalio@example.com"
git add -A
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do (set FECHA=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ("%time%") do (set HORA=%%a%%b)
set "MSG=auto: publicacion Noticias %FECHA%_%HORA%"
git diff --cached --quiet && (echo No hay cambios para publicar. & goto :END)
git commit -m "%MSG%"
git remote get-url origin >nul 2>&1 || (echo Falta remoto origin. Ejecuta set_remote.bat y vuelve. & goto :END)
git pull --rebase origin main
git push origin main
echo Publicacion completada.
:END
pause
