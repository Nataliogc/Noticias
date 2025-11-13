@echo off
REM Configura el remoto origin si fuera necesario
REM Uso: set_remote.bat https://github.com/USUARIO/REPO.git
if "%~1"=="" (
  echo Proporcione la URL del repositorio. Ejemplo:
  echo   set_remote.bat https://github.com/nataliogc/Noticias.git
  goto :eof
)
git remote remove origin 2>nul
git remote add origin %1
git branch -M main
git push -u origin main
