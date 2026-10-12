/**
 * Script definitivo para maximizar o score de qualidade de TODOS os anúncios
 * - Garante a foto 0 como a Caixa 3D Oficial
 * - Insere as fotos 1, 2, 3 com infográficos de recursos, compatibilidade e garantia
 * - Maximiza o preenchimento da Ficha Técnica
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

const BASE_79 = 'https://raw.githubusercontent.com/DevPlanetProjectIA/home/79a11d6/img';
const BASE_5D = 'https://raw.githubusercontent.com/DevPlanetProjectIA/home/5d1149d/img';

const LISTINGS = [
  {
    id: 'MLB5366400871',
    sku: 'ms365',
    title: 'Microsoft 365 12 Meses 1tb Nuvem',
    attributes: [
      { id: 'BRAND', value_name: 'Microsoft' },
      { id: 'MODEL', value_name: 'Microsoft 365' },
      { id: 'OFFICE_SOFTWARE_NAME', value_name: 'Microsoft 365' },
      { id: 'VERSION', value_name: 'Family 2026' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'GTIN', value_name: '889842861648' },
      { id: 'DEVICES_SUPPORTED_NUMBER', value_name: '5' },
      { id: 'IS_OFFICE_SUITE', value_name: 'Sim' },
      { id: 'LANGUAGES', value_name: 'Português' },
      { id: 'SOFTWARE_FUNCTIONS', value_name: 'Produtividade' }
    ]
  },
  {
    id: 'MLB5366440323',
    sku: 'googleai',
    title: 'Google Ai Pro 18 Meses Gemini Advanced 5 Tb',
    attributes: [
      { id: 'BRAND', value_name: 'Google' },
      { id: 'MODEL', value_name: 'Gemini Advanced 5 TB' },
      { id: 'OFFICE_SOFTWARE_NAME', value_name: 'Google AI Pro' },
      { id: 'VERSION', value_name: 'Gemini Advanced 1.5 Pro' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'GTIN', value_name: '7898956241058' },
      { id: 'DEVICES_SUPPORTED_NUMBER', value_name: '5' },
      { id: 'LANGUAGES', value_name: 'Português' },
      { id: 'SOFTWARE_FUNCTIONS', value_name: 'Inteligência Artificial' }
    ]
  },
  {
    id: 'MLB5366401673',
    sku: 'lovable',
    title: 'Lovable Lite 12 Meses Ia Fullstack',
    attributes: [
      { id: 'DEVELOPER', value_name: 'Lovable' },
      { id: 'SOFTWARE_NAME', value_name: 'Lovable Lite' },
      { id: 'VERSION', value_name: '2026' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'GTIN', value_name: '7898956241027' }
    ]
  },
  {
    id: 'MLB7784965030',
    sku: 'express',
    title: 'Express Criativo Premium 12 Meses Design Ia Firefly',
    attributes: [
      { id: 'BRAND', value_name: 'Express' },
      { id: 'MODEL', value_name: 'Express Premium' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241072' }
    ]
  },
  {
    id: 'MLB5366439113',
    sku: 'prime',
    title: 'Amazon Prime Video 6 Meses Streaming 4k',
    attributes: [
      { id: 'BRAND', value_name: 'Amazon' },
      { id: 'MODEL', value_name: 'Prime Video 4K' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241041' }
    ]
  },
  {
    id: 'MLB5366512415',
    sku: 'duolingo',
    title: 'Duolingo Super 12 Meses Vidas Infinitas Oficial',
    attributes: [
      { id: 'BRAND', value_name: 'Duolingo' },
      { id: 'MODEL', value_name: 'Duolingo Super' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241065' }
    ]
  }
];

function update(item) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      pictures: [
        { source: `${BASE_79}/prod-${item.sku}-1.jpg` }, // Caixa 3D Oficial
        { source: `${BASE_5D}/prod-${item.sku}-2.jpg` }, // Recursos
        { source: `${BASE_5D}/prod-${item.sku}-3.jpg` }, // Compatibilidade
        { source: `${BASE_5D}/prod-${item.sku}-4.jpg` }  // Garantia 7 Dias
      ],
      attributes: item.attributes
    });

    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${item.id}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });

    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('🚀 Aplicando Galeria Completa 4 Fotos (Caixa 3D na Capa) + Ficha Técnica...');
  for (const it of LISTINGS) {
    const res = await update(it);
    console.log(`${it.sku} (${it.id}): Status ${res.status}`);
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log('🏁 Concluído!');
}

run();
