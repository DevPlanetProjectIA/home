/**
 * Script para restaurar o preço normal do Google AI Pro após o término da Oferta Relâmpago de 2 horas.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let token = '';
if (fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/ML_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
}

if (!token) {
  console.error('❌ Token não encontrado.');
  process.exit(1);
}

const ITEM_ID = 'MLB5366440323';
const NORMAL_PRICE = 50.00;

const updateData = JSON.stringify({
  price: NORMAL_PRICE
});

const req = https.request({
  hostname: 'api.mercadolibre.com',
  path: `/items/${ITEM_ID}`,
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(updateData)
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log(`Preço restaurado com sucesso para R$ ${NORMAL_PRICE.toFixed(2)}! (Status ${res.statusCode})`);
  });
});

req.on('error', (err) => console.error('Erro:', err.message));
req.write(updateData);
req.end();
