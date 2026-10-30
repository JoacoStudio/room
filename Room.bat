@echo off
cd /d "%~dp0"

:: Intentar abrir con Chrome en modo aplicación (ventana sin bordes de navegador)
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///%~dp0index.html" 2>nul

:: Si no está Chrome, intentar Edge
if errorlevel 1 (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///%~dp0index.html" 2>nul
)

:: Si no hay ninguno, abrir con el navegador predeterminado normal
if errorlevel 1 (
    start "" "index.html"
)
