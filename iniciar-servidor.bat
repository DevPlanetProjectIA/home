@echo off
title DevPlanet Store - Servidor Local
echo ========================================================
echo     Iniciando Servidor DevPlanet Store (Porta 3000)
echo ========================================================
echo.
set "PATH=%PATH%;C:\Program Files\nodejs"
cd /d "%~dp0flow\server"
"C:\Program Files\nodejs\node.exe" index.js
pause
