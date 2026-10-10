@echo off
title DevPlanet Store - Servidor Local
echo ========================================================
echo     Iniciando Servidor DevPlanet Store (Porta 3000)
echo ========================================================
echo.
cd /d "%~dp0flow\server"
node index.js
pause
