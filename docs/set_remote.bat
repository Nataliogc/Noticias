@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ===== Ajustes =====
set "DEFAULT_REMOTE=https://github.com/TU-USUARIO/Noticias.git"
set "TARGET_BRANCH=main"

REM ===== Ruta repo =====
set "REPO_DIR=%~dp0"
cd /d "%REPO_DIR%" || (echo [ERROR] No puedo acceder a %REPO_DIR% & pause & exit /b 1)

REM ===== Debe ser repo =====
git rev-parse --is-inside-work-tree >NUL 2>&1 || (
  echo [ERROR] Esta carpeta no es un repositorio Git.
  echo        Ejecuta primero: git init
  pause & exit /b 1
)

REM ===== URL por parametro o por defecto =====
set "REMOTE_URL=%~1"
if "%REMOTE_URL%"=="" set "REMOTE_URL=%DEFAULT_REMOTE%"
@echo off
setlocal

set "DEFAULT_REMOTE=https://github.com/TU-USUARIO/Noticias.git"
set "TARGET_BRANCH=main"

set "REPO_DIR=%~dp0"
cd /d "%REPO_DIR%" || (echo [ERROR] No puedo acceder a %REPO_DIR% & pause & exit /b 1)

git rev-parse --is-inside-work-tree >NUL 2>&1 || (
  echo [ERROR] Esta carpeta no es un repositorio Git.
  echo        Ejecuta primero: git init
  pause & exit /b 1
)

set "REMOTE_URL=%~1"
if "%REMOTE_URL%"=="" set "REMOTE_URL=%DEFAULT_REMOTE%"

git remote remove origin >NUL 2>&1
git remote add origin "%REMOTE_URL%" || (echo [ERROR] No pude anadir el remoto & pause & exit /b 1)

echo [OK] Remoto origin configurado:
git remote -v

echo.
echo Primer push (si aun no lo hiciste):
echo   git push -u origin %TARGET_BRANCH%
pause
endlocal

REM ===== Configurar origin =====
git remote remove origin >NUL 2>&1
git remote add origin "%REMOTE_URL%" || (echo [ERROR] No pude anadir el remoto & pause & exit /b 1)

echo [OK] Remoto origin configurado:
git remote -v

echo.
echo Primer push (si aun no lo hiciste):
echo   git push -u origin %TARGET_BRANCH%
pause
endlocal
