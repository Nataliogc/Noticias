@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ===== Ajustes =====
set "TARGET_BRANCH=main"
set "SITE_DIR=docs"
set "COMMIT_PREFIX=auto: publicacion Noticias"

REM ===== Localizar Git aunque PATH no lo tenga =====
set "GITEXE="
if exist "C:\Program Files\Git\cmd\git.exe" set "GITEXE=C:\Program Files\Git\cmd\git.exe"
if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "GITEXE=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if "%GITEXE%"=="" (
  where git >NUL 2>&1 && for /f "delims=" %%A in ('where git') do set "GITEXE=%%A"
)
if "%GITEXE%"=="" (
  echo [ERROR] No encuentro Git. Instala Git for Windows: https://git-scm.com/download/win
  pause & exit /b 1
)

REM >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
REM CORRECTO: sin barras invertidas; se citan al invocar, no al asignar
set "GITCMD=%GITEXE%"
REM <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

REM ===== Ir a la carpeta del script =====
set "REPO_DIR=%~dp0"
cd /d "%REPO_DIR%" || (echo [ERROR] No puedo acceder a %REPO_DIR% & pause & exit /b 1)

REM ===== Inicializar repo si hace falta =====
echo [INFO] Inicializando repositorio...
"%GITCMD%" rev-parse --is-inside-work-tree >NUL 2>&1
if errorlevel 1 (
  "%GITCMD%" init || (echo [ERROR] git init fallo & pause & exit /b 1)
)

REM ===== Asegurar rama objetivo =====
"%GITCMD%" branch --show-current >NUL 2>&1 || "%GITCMD%" checkout -b %TARGET_BRANCH%
for /f "delims=" %%B in ('"%GITCMD%" branch --show-current') do set "BRANCH=%%B"
if /I not "%BRANCH%"=="%TARGET_BRANCH%" "%GITCMD%" branch -M %TARGET_BRANCH%

REM ===== Identidad local si falta =====
"%GITCMD%" config user.name  >NUL 2>&1 || "%GITCMD%" config user.name  "Natalio"
"%GITCMD%" config user.email >NUL 2>&1 || "%GITCMD%" config user.email "natalio@example.com"

REM ===== Timestamp robusto =====
for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "(Get-Date).ToString('yyyy-MM-dd_HHmmss')"`) do set "TS=%%T"

REM ===== Add desde docs (si existe), si no desde raiz =====
set "CWD_SAVED=%CD%"
if exist "%SITE_DIR%" ( cd /d "%SITE_DIR%" )
echo [INFO] Preparando cambios...
"%GITCMD%" add -A
cd /d "%CWD_SAVED%"

REM ===== Commit solo si hay staged =====
"%GITCMD%" diff --cached --quiet
if not errorlevel 1 (
  echo [INFO] No hay cambios para publicar.
  goto :PUSH
)

set "MSG=%COMMIT_PREFIX% (%TS%)"
"%GITCMD%" commit -m "%MSG%" || (echo [ERROR] No se pudo crear el commit & pause & exit /b 1)

:PUSH
REM ===== Confirmar remoto origin =====
set "HAS_ORIGIN=1"
"%GITCMD%" remote get-url origin >NUL 2>&1 || set "HAS_ORIGIN=0"
if "%HAS_ORIGIN%"=="0" (
  echo [ERROR] Falta remoto "origin".
  echo         Ejecuta set_remote.bat con la URL de tu repo y vuelve a intentar.
  pause & exit /b 1
)

REM ===== Upstream =====
set "HAS_UPSTREAM=1"
"%GITCMD%" rev-parse --abbrev-ref --symbolic-full-name @{u} >NUL 2>&1 || set "HAS_UPSTREAM=0"

if "%HAS_UPSTREAM%"=="1" (
  echo [INFO] Actualizando desde remoto...
  "%GITCMD%" fetch origin >NUL 2>&1
  "%GITCMD%" pull --rebase origin %TARGET_BRANCH%
  echo [INFO] Subiendo a GitHub...
  "%GITCMD%" push origin %TARGET_BRANCH% || (echo [ERROR] Fallo al hacer push & pause & exit /b 1)
) else (
  echo [INFO] Primer push (estableciendo upstream)...
  "%GITCMD%" push -u origin %TARGET_BRANCH% || (echo [ERROR] Fallo al hacer primer push & pause & exit /b 1)
)

echo [OK] Publicacion completada.
pause
endlocal
