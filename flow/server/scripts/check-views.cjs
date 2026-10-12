/**
 * Script para verificar visualizações e métricas dos anúncios no Mercado Livre
 * Suporta auto-refresh do token se ML_REFRESH_TOKEN estiver no .env
 * 
 * Uso: node check-views.cjs [OPCIONAL_CODIGO_TG_OU_TOKEN]
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '7763221096235181';
const CLIENT_SECRET = '23rfiy0WKZtxM3vHj0urRFiVvXBNSejq';
const REDIRECT_URI = 'https://devplanetprojectia.github.io/home/';

const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

function getEnvVar(key) {
  const match = envContent.match(new RegExp(`${key}=([^\\r\\n]+)`));
  return match ? match[1].trim() : '';
}

function updateEnv(key, val) {
  if (envContent.includes(`${key}=`)) {
    envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${val}`);
  } else {
    envContent += `\n${key}=${val}\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
}

let accessToken = getEnvVar('ML_ACCESS_TOKEN');
let refreshToken = getEnvVar('ML_REFRESH_TOKEN');

function request(options, data = null) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function exchangeAuthCode(code) {
  console.log('🔄 Trocando código de autorização TG pelo token...');
  const postData = JSON.stringify({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: code.trim(),
    redirect_uri: REDIRECT_URI
  });

  const res = await request({
    hostname: 'api.mercadolibre.com',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);

  if (res.data && res.data.access_token) {
    accessToken = res.data.access_token;
    updateEnv('ML_ACCESS_TOKEN', accessToken);
    if (res.data.refresh_token) {
      refreshToken = res.data.refresh_token;
      updateEnv('ML_REFRESH_TOKEN', refreshToken);
    }
    console.log('✅ Token obtido com sucesso!');
    return true;
  }
  console.error('❌ Falha ao trocar código:', res.data);
  return false;
}

async function refreshOAuthToken() {
  if (!refreshToken) return false;
  console.log('🔄 Atualizando Access Token com o Refresh Token...');
  const postData = JSON.stringify({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken
  });

  const res = await request({
    hostname: 'api.mercadolibre.com',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);

  if (res.data && res.data.access_token) {
    accessToken = res.data.access_token;
    updateEnv('ML_ACCESS_TOKEN', accessToken);
    if (res.data.refresh_token) {
      refreshToken = res.data.refresh_token;
      updateEnv('ML_REFRESH_TOKEN', refreshToken);
    }
    console.log('✅ Token atualizado com sucesso via refresh_token!');
    return true;
  }
  return false;
}

async function main() {
  const arg = process.argv[2];
  if (arg && arg.startsWith('TG-')) {
    await exchangeAuthCode(arg);
  } else if (arg && arg.startsWith('APP_USR-')) {
    accessToken = arg;
    updateEnv('ML_ACCESS_TOKEN', accessToken);
  }

  // Testa se o token é válido
  let meRes = await request({
    hostname: 'api.mercadolibre.com',
    path: '/users/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (meRes.status === 401) {
    const refreshed = await refreshOAuthToken();
    if (refreshed) {
      meRes = await request({
        hostname: 'api.mercadolibre.com',
        path: '/users/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }
  }

  if (meRes.status !== 200) {
    console.log(JSON.stringify({
      error: 'TOKEN_EXPIRED',
      message: 'O token do Mercado Livre expirou (validade de 6 horas) e precisa ser renovado.',
      authUrl: `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    }, null, 2));
    process.exit(1);
  }

  const userId = meRes.data.id;
  const nickname = meRes.data.nickname;
  console.log(`\n======================================================`);
  console.log(`👤 Vendedor: ${nickname} (ID: ${userId})`);
  console.log(`======================================================\n`);

  // Itens mapeados conhecidos
  const knownIds = [
    'MLB5376746733',
    'MLB5376292517',
    'MLB5366400871',
    'MLB5366440323',
    'MLB5366401673',
    'MLB7784965030',
    'MLB5366439113',
    'MLB5366512415'
  ];

  // Buscar itens ativos do usuário na API
  const itemsSearch = await request({
    hostname: 'api.mercadolibre.com',
    path: `/users/${userId}/items/search?status=active`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const activeIds = itemsSearch.data?.results || [];
  // Une os conhecidos e os encontrados
  const allIds = Array.from(new Set([...activeIds, ...knownIds]));

  console.log(`Encontrados ${allIds.length} anúncios para consulta.\n`);

  const report = [];

  for (const id of allIds) {
    const itemData = await request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const visits30d = await request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${id}/visits/time_window?last=30&unit=day`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const title = itemData.data?.title || 'Anúncio não encontrado';
    const status = itemData.data?.status || 'desconhecido';
    const price = itemData.data?.price ? `R$ ${itemData.data.price.toFixed(2)}` : 'N/A';
    const sold = itemData.data?.sold_quantity ?? 0;
    const available = itemData.data?.available_quantity ?? 0;
    const visits = visits30d.data?.total_visits ?? 0;
    const permalink = itemData.data?.permalink || '';

    report.push({
      id,
      title,
      status,
      price,
      sold,
      available,
      visits,
      permalink
    });
  }

  console.log('📊 RELATÓRIO DE DESEMPENHO E VISUALIZAÇÕES:\n');
  console.table(report.map(r => ({
    ID: r.id,
    Título: r.title.substring(0, 35) + (r.title.length > 35 ? '...' : ''),
    Preço: r.price,
    Status: r.status,
    Vendas: r.sold,
    'Visitas (30d)': r.visits
  })));

  console.log('\nDetalhes completos (JSON):');
  console.log(JSON.stringify(report, null, 2));
}

main();
