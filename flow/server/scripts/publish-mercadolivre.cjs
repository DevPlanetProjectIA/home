/**
 * Script de Publicação Automatizada de Anúncios no Mercado Livre
 * Uso: node publish-mercadolivre.cjs [SEU_TOKEN_DO_MERCADO_LIVRE]
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Carrega o token informado no argumento de linha de comando ou no .env
const tokenArg = process.argv[2];
const envPath = path.join(__dirname, '..', '.env');
let tokenEnv = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/ML_ACCESS_TOKEN=(.+)/);
  if (match) tokenEnv = match[1].trim();
}

const ML_TOKEN = tokenArg || tokenEnv || process.env.ML_ACCESS_TOKEN;

const PRODUCTS_TO_PUBLISH = [
  {
    title: "Assinatura Microsoft 365 Premium 12 Meses 1TB Nuvem Oficial",
    category_id: "MLB1144", // Softwares
    price: 89.00,
    currency_id: "BRL",
    available_quantity: 50,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-microsoft-365.jpg" }
    ],
    shipping: {
      mode: "not_specified",
      local_pick_up: true,
      free_shipping: false
    },
    sale_terms: [
      { id: "WARRANTY_TYPE", value_name: "Garantia do vendedor" },
      { id: "WARRANTY_TIME", value_name: "7 dias" }
    ],
    description: 
      "Assinatura Oficial Microsoft 365 Premium por 12 meses.\n\n" +
      "INCLUSO:\n" +
      "- 1 TB de armazenamento em nuvem no OneDrive seguro\n" +
      "- Aplicativos Word, Excel, PowerPoint, Outlook e OneNote\n" +
      "- Uso em PC, Mac, celular ou tablet\n" +
      "- Ativação vinculada diretamente à sua conta oficial da Microsoft\n\n" +
      "ENTREGA RÁPIDA VIA CHAT / WHATSAPP APÓS A COMPRA COM TUTORIAL COMPLETO!"
  },
  {
    title: "Licenca Lovable Lite 12 Meses Criador Software IA Fullstack",
    category_id: "MLB1144",
    price: 139.90,
    currency_id: "BRL",
    available_quantity: 30,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-lovable-lite.jpg" }
    ],
    shipping: {
      mode: "not_specified",
      local_pick_up: true,
      free_shipping: false
    },
    sale_terms: [
      { id: "WARRANTY_TYPE", value_name: "Garantia do vendedor" },
      { id: "WARRANTY_TIME", value_name: "7 dias" }
    ],
    description: 
      "Lovable Lite — 12 Meses de Acesso Oficial.\n\n" +
      "A plataforma líder mundial para criação de softwares web com Inteligência Artificial.\n\n" +
      "- Crie aplicações completas (Frontend, Backend e Banco de Dados) conversando em linguagem natural\n" +
      "- Sincronização direta com seu GitHub\n" +
      "- Hospedagem e deploy instantâneo inclusos\n\n" +
      "Economize na mensalidade em dólar. Entrega imediata após a compra!"
  },
  {
    title: "Adobe Express Premium 12 Meses Firefly IA 25k Fontes Stock",
    category_id: "MLB1144",
    price: 40.00,
    currency_id: "BRL",
    available_quantity: 50,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-adobe-express.jpg" }
    ],
    shipping: {
      mode: "not_specified",
      local_pick_up: true,
      free_shipping: false
    },
    sale_terms: [
      { id: "WARRANTY_TYPE", value_name: "Garantia do vendedor" },
      { id: "WARRANTY_TIME", value_name: "7 dias" }
    ],
    description: 
      "Assinatura Oficial Adobe Express Premium por 12 meses.\n\n" +
      "- IA Generativa Adobe Firefly integrada\n" +
      "- Removedor de fundo em 1 clique para fotos e vídeos\n" +
      "- Mais de 25.000 fontes licenciadas e biblioteca Adobe Stock\n\n" +
      "Entrega e suporte rápido no chat após a aprovação da compra!"
  },
  {
    title: "Amazon Prime Video Assinatura 6 Meses 4K Ultra HD Filmes",
    category_id: "MLB1144",
    price: 79.90,
    currency_id: "BRL",
    available_quantity: 40,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-prime-video.jpg" }
    ],
    shipping: {
      mode: "not_specified",
      local_pick_up: true,
      free_shipping: false
    },
    sale_terms: [
      { id: "WARRANTY_TYPE", value_name: "Garantia do vendedor" },
      { id: "WARRANTY_TIME", value_name: "7 dias" }
    ],
    description: 
      "6 Meses de Acesso ao Amazon Prime Video em 4K Ultra HD.\n\n" +
      "- Filmes, séries consagradas e produções Amazon Originals\n" +
      "- Qualidade máxima com HDR e som surround\n" +
      "- Até 3 telas simultâneas e download offline\n\n" +
      "Entrega rápida das orientações de acesso direto no chat!"
  }
];

function postToML(item, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      title: item.title,
      category_id: item.category_id,
      price: item.price,
      currency_id: item.currency_id,
      available_quantity: item.available_quantity,
      buying_mode: item.buying_mode,
      listing_type_id: item.listing_type_id,
      condition: item.condition,
      pictures: item.pictures,
      shipping: item.shipping,
      sale_terms: item.sale_terms
    });

    const options = {
      hostname: 'api.mercadolibre.com',
      path: '/items',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('🚀 PUBLICADOR AUTOMÁTICO DE ANÚNCIOS NO MERCADO LIVRE');
  console.log('====================================================\n');

  if (!ML_TOKEN || ML_TOKEN.length < 10) {
    console.error('❌ ERRO: Token do Mercado Livre não informado.');
    console.log('Como usar:');
    console.log('  node publish-mercadolivre.cjs SEU_TOKEN_AQUI\n');
    console.log('Ou adicione no flow/server/.env:');
    console.log('  ML_ACCESS_TOKEN=seu_token_aqui\n');
    process.exit(1);
  }

  console.log(`Token configurado. Publicando ${PRODUCTS_TO_PUBLISH.length} anúncios...\n`);

  for (const prod of PRODUCTS_TO_PUBLISH) {
    console.log(`⏳ Publicando: "${prod.title}" (R$ ${prod.price.toFixed(2)})...`);
    const res = await postToML(prod, ML_TOKEN);

    if (res.status === 201 || res.status === 200) {
      console.log(`✅ SUCESSO! Anúncio criado com ID: ${res.data.id}`);
      console.log(`🔗 Link no Mercado Livre: ${res.data.permalink}\n`);
    } else {
      console.warn(`⚠️ Retorno da API (Status ${res.status}):`);
      console.warn(JSON.stringify(res.data, null, 2), '\n');
    }

    // Intervalo de segurança
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🏁 Processo finalizado!');
}

run();
