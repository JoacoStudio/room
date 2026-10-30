@echo off
setlocal
cd /d "%~dp0"

:: ---------------------------------------------------------------
:: Tamano y posicion de la ventana
::   WIN_W / WIN_H  -> ancho y alto en pixeles
::   WIN_TOP        -> separacion desde el borde superior
:: La ventana se centra horizontalmente en la pantalla.
:: ---------------------------------------------------------------
set "WIN_W=900"
set "WIN_H=620"
set "WIN_TOP=64"

:: Buscar Chrome y, si no esta, Edge
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not defined BROWSER (
    start "" "index.html"
    exit /b
)

:: Abrir en modo aplicacion y ajustar la ventana
start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Room.ps1" -Browser "%BROWSER%" -Url "file:///%~dp0index.html" -Width %WIN_W% -Height %WIN_H% -Top %WIN_TOP%
