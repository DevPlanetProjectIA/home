/**
 * Troca o código de autorização (TG-...) pelo Access Token oficial do Mercado Livre
 * e dispara a publicação dos anúncios automaticamente.
 * 
 * Uso: node exchange-ml-token.cjs TG-xxxxxxxx
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const code = process.argv[2];

if (!code) {
  console.error('❌ ERRO: Informe o código de autorização.');
  console.log('Exemplo: node exchange-ml-token.cjs TG-68e12345...');
  process.exit(1);
}

const CLIENT_ID = '8087191916005638';
const CLIENT_SECRET = 'ib9djM9jOQ8wDLpA6v7YXICgJ6fSPiYp';
const REDIRECT_URI = 'https://devplanetprojectia.github.io/home/';

const postData = JSON.stringify({
  grant_type: 'authorization_code',
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  code: code.trim(),
  redirect_uri: REDIRECT_URI
});

const options = {
  hostname: 'api.mercadolibre.com',
  path: '/oauth/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔄 Trocando código de autorização pelo token oficial do Mercado Livre...');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data.access_token) {
        console.log('✅ TOKEN GERADO COM SUCESSO!');
        console.log(`Access Token: ${data.access_token.substring(0, 20)}...`);
        console.log(`User ID: ${data.user_id}`);
        console.log(`Expira em: ${data.expires_in} segundos`);

        // Salva o token no .env
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        if (envContent.includes('ML_ACCESS_TOKEN=')) {
          envContent = envContent.replace(/ML_ACCESS_TOKEN=.*/, `ML_ACCESS_TOKEN=${data.access_token}`);
        } else {
          envContent += `\nML_ACCESS_TOKEN=${data.access_token}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('💾 Token salvo no arquivo .env!\n');

        // Executa automaticamente a publicação dos anúncios
        console.log('🚀 Publicando os anúncios agora...');
        const publisherScript = path.join(__dirname, 'publish-mercadolivre.cjs');
        execSync(`node "${publisherScript}" "${data.access_token}"`, { stdio: 'inherit' });
      } else {
        console.error('❌ Falha ao obter token:', data);
      }
    } catch (err) {
      console.error('❌ Erro de processamento:', err.message, body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro de conexão:', e.message);
});

req.write(postData);
req.end();
