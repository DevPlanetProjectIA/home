# Flow — gestão para impressão 3D

## Rodar localmente (sem Docker)

Requisito: Node.js 22.13 ou superior (https://nodejs.org).

- Windows: dê dois cliques em `iniciar.bat`
- Mac/Linux: `./iniciar.sh`

Abre em http://localhost:3000 — crie uma conta na primeira vez.
Os dados ficam em `server/data/app.db` (SQLite). Para backup, copie essa pasta.

## Rodar com Docker

    docker compose up -d --build

Dados no volume `flow_data`.

## Desenvolvimento

    cd server && npm install && npm start
    cd client && npm install && npm run dev
