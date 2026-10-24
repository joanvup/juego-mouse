@echo off
rem Inicia el servidor local de Mouse Aventura y abre el navegador.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Tambien puedes abrir index.html con doble clic.
  pause
  exit /b 1
)
node tools\serve.cjs 8123 127.0.0.1 --open
pause
