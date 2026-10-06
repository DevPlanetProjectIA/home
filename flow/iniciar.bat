@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Flow

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale a versao 22 LTS: https://nodejs.org
  pause & exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a==22&&b>=13)?0:1)"
if errorlevel 1 (
  echo Node muito antigo. Instale o Node 22.13 ou superior: https://nodejs.org
  pause & exit /b 1
)

if not exist server\node_modules (
  echo Instalando dependencias do servidor...
  pushd server & call npm install --omit=dev & popd
)
if not exist client\dist (
  echo Gerando o front-end...
  pushd client & call npm install & call npm run build & popd
)

if "%PORT%"=="" set PORT=3000
echo.
echo Flow rodando em http://localhost:%PORT%  (feche esta janela para parar)
start "" http://localhost:%PORT%
node --disable-warning=ExperimentalWarning server\index.js
pause
