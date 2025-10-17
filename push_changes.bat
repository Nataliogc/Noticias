@echo off
setlocal EnableDelayedExpansion
REM === Configuración ===
set "REPO_DIR=%~dp0" 
REM Si el bat está en la raíz del repo, mantiene REPO_DIR tal cual.
REM Si lo guardas fuera, pon aquí la ruta absoluta del repo.

REM === Ir al repo ===
cd /d "%REPO_DIR%" || (echo No puedo acceder a %REPO_DIR% & pause & exit /b 1)

REM === Comprobar Git ===
git --version >nul 2>&1 || (echo No encuentro Git. Instala Git for Windows desde git-scm.com & pause & exit /b 1)

REM === Inicializar si no existe .git ===
if not exist ".git" (
  echo Inicializando repositorio...
  git init
  git branch -M main
)

REM === Asegurar nombre/email (solo primera vez; ajusta a tu gusto) ===
git config user.name >nul || git config user.name "Natalio"
git config user.email >nul || git config user.email "natalio@example.com"

REM === Añadir cambios ===
git add -A

REM === Mensaje con fecha/hora ===
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do (set FECHA=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ("%time%") do (set HORA=%%a%%b)
set "MSG=auto: publicacion Noticias %FECHA%_%HORA%"

REM === Commit (si hay cambios) ===
git diff --cached --quiet && (echo No hay cambios para publicar. & goto :END)
git commit -m "%MSG%"

REM === Comprobar remoto origin ===
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo No hay remoto "origin".
  echo Ejecuta una vez:   git remote add origin https://github.com/Nataliogc/Noticias.git
  echo o edita set_remote.bat y ejecútalo.
  goto :END
)

REM === Traer y publicar ===
git pull --rebase origin main
git push origin main

echo Publicacion completada.
:END
pause
