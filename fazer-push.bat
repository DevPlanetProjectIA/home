@echo off
title Git Push - DevPlanet Store
echo ========================================================
echo     Enviando atualizacoes para o GitHub
echo ========================================================
echo.
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
git push origin main
echo.
pause
