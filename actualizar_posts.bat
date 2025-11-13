@echo off
REM Actualiza data\posts.json leyendo los HTML de la carpeta posts

REM Ir a la carpeta donde está este BAT (raíz del proyecto Noticias)
cd /d "%~dp0"

REM Ejecutar el script de PowerShell
powershell -ExecutionPolicy Bypass -File ".\tools\generate_posts.ps1"

echo.
echo -----------------------------------------
echo  Proceso terminado. Revisa data\posts.json
echo -----------------------------------------
echo.
pause
