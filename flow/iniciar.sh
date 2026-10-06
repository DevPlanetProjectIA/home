#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "Node.js não encontrado. Instale a versão 22 LTS: https://nodejs.org"; exit 1; }
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a==22&&b>=13)?0:1)" \
  || { echo "Node muito antigo ($(node -v)). Instale o Node 22.13 ou superior."; exit 1; }

[ -d server/node_modules ] || (echo "Instalando dependências do servidor..." && cd server && npm install --omit=dev)
[ -d client/dist ] || (echo "Gerando o front-end..." && cd client && npm install && npm run build)

export PORT="${PORT:-3000}"
echo "Flow rodando em http://localhost:$PORT  (Ctrl+C para parar)"
(command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT" >/dev/null 2>&1 || command -v open >/dev/null && open "http://localhost:$PORT") &
exec node --disable-warning=ExperimentalWarning server/index.js
