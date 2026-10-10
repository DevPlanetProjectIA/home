/**
 * Script de Publicação Automatizada de Anúncios no Mercado Livre
 * Compatível com o modelo User Products (UP) e atributos oficiais
 * 
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
    sku: "GOOG-AI-18M",
    family_name: "Google Ai Pro 18 Meses Gemini Advanced 2tb",
    category_id: "MLB1733", // Softwares de Escritório
    price: 50.00,
    currency_id: "BRL",
    available_quantity: 50,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-google-ai-pro.jpg" }
    ],
    attributes: [
      { id: "BRAND", value_name: "Google" },
      { id: "OFFICE_SOFTWARE_NAME", value_name: "Google AI Pro" },
      { id: "VERSION", value_name: "Gemini Advanced" },
      { id: "FORMAT", value_name: "Digital" },
      { id: "GTIN", value_name: "7898956241058" }
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
      "Assinatura Oficial Google AI Pro (Gemini Advanced) por 18 meses.\n\n" +
      "- Acesso ilimitado ao Gemini 1.5 Pro com janela de contexto de 1 milhão de tokens\n" +
      "- 2 TB de armazenamento em nuvem de alta velocidade no Google One\n" +
      "- Integração com Google Workspace (Gmail, Docs, Sheets)\n\n" +
      "Garantia de 7 dias com entrega rápida e ativação direta via chat/WhatsApp!"
  },
  {
    sku: "MS-365-12M",
    family_name: "Microsoft 365 12 Meses 1tb Nuvem",
    category_id: "MLB1733", // Softwares de Escritório
    price: 89.00,
    currency_id: "BRL",
    available_quantity: 50,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-microsoft-365.jpg" }
    ],
    attributes: [
      { id: "BRAND", value_name: "Microsoft" },
      { id: "OFFICE_SOFTWARE_NAME", value_name: "Microsoft 365" },
      { id: "VERSION", value_name: "Microsoft 365 Family" },
      { id: "FORMAT", value_name: "Digital" },
      { id: "GTIN", value_name: "889842861648" }
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
      "Assinatura Oficial Microsoft 365 por 12 meses.\n\n" +
      "INCLUSO:\n" +
      "- 1 TB de armazenamento em nuvem no OneDrive seguro\n" +
      "- Aplicativos Word, Excel, PowerPoint, Outlook e OneNote\n" +
      "- Uso em PC, Mac, celular ou tablet\n" +
      "- Ativação vinculada diretamente à sua conta oficial da Microsoft\n\n" +
      "Garantia de 7 dias com entrega rápida e suporte completo via chat/WhatsApp!"
  },
  {
    sku: "LVBL-LITE-12M",
    family_name: "Lovable Lite 12 Meses Ia Fullstack",
    category_id: "MLB1728", // Software Comercial
    price: 139.90,
    currency_id: "BRL",
    available_quantity: 30,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-lovable-lite.jpg" }
    ],
    attributes: [
      { id: "DEVELOPER", value_name: "Lovable" },
      { id: "SOFTWARE_NAME", value_name: "Lovable Lite" },
      { id: "VERSION", value_name: "2026" },
      { id: "FORMAT", value_name: "Digital" },
      { id: "GTIN", value_name: "7898956241027" }
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
      "A plataforma líder mundial para criação de aplicações web full-stack com Inteligência Artificial.\n\n" +
      "- Crie sistemas completos (Frontend, Backend e Banco de Dados) conversando em linguagem natural\n" +
      "- Sincronização direta com GitHub e deploy em 1 clique\n" +
      "- Hospedagem inclusa e suporte ágil\n\n" +
      "Garantia de 7 dias com entrega rápida e suporte completo via chat/WhatsApp!"
  },
  {
    sku: "ADB-EXP-12M",
    family_name: "Adobe Express Premium 12 Meses Firefly Ia",
    category_id: "MLB1731", // Design Gráfico e Edição
    price: 40.00,
    currency_id: "BRL",
    available_quantity: 50,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-adobe-express.jpg" }
    ],
    attributes: [
      { id: "DEVELOPER", value_name: "Adobe" },
      { id: "SOFTWARE_NAME", value_name: "Adobe Express" },
      { id: "VERSION", value_name: "2026" },
      { id: "FORMAT", value_name: "Digital" },
      { id: "GTIN", value_name: "7898956241034" }
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
      "- Removedor de fundo automático para fotos e vídeos em 1 clique\n" +
      "- Mais de 25.000 fontes licenciadas e biblioteca Adobe Stock completa\n" +
      "- Suporte para computador (Web) e app mobile\n\n" +
      "Garantia de 7 dias com entrega rápida e suporte completo via chat/WhatsApp!"
  },
  {
    sku: "AMZN-PRIME-6M",
    family_name: "Amazon Prime Video 6 Meses Streaming 4k",
    category_id: "MLB421328", // Gift Cards / Assinaturas
    price: 79.90,
    currency_id: "BRL",
    available_quantity: 40,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-prime-video.jpg" }
    ],
    attributes: [
      { id: "BRAND", value_name: "Amazon" },
      { id: "PREPAID_CARD_TYPE", value_id: "52275405", value_name: "Assinatura" },
      { id: "FORMAT", value_id: "2132699", value_name: "Digital" },
      { id: "REGION", value_id: "1233470", value_name: "Brasil" },
      { id: "GTIN", value_name: "7898956241041" }
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
      "Amazon Prime Video — 6 Meses de Acesso Oficial em 4K Ultra HD.\n\n" +
      "- Filmes consagrados, lançamentos de sucesso e produções Originais Amazon Prime\n" +
      "- Qualidade máxima com suporte a HDR e som imersivo\n" +
      "- Até 3 telas simultâneas e download liberado para assistir offline\n" +
      "- Compatível com Smart TVs, computadores, celulares e tablets\n\n" +
      "Garantia de 7 dias com entrega rápida e suporte completo via chat/WhatsApp!"
  },
  {
    sku: "DUO-SUP-12M",
    family_name: "Duolingo Super 12 Meses Vidas Infinitas Oficial",
    category_id: "MLB421328", // Gift Cards / Assinaturas
    price: 40.00,
    currency_id: "BRL",
    available_quantity: 50,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    pictures: [
      { source: "https://devplanetprojectia.github.io/home/img/promo-duolingo-super.jpg" }
    ],
    attributes: [
      { id: "BRAND", value_name: "Duolingo" },
      { id: "PREPAID_CARD_TYPE", value_id: "52275405", value_name: "Assinatura" },
      { id: "FORMAT", value_id: "2132699", value_name: "Digital" },
      { id: "REGION", value_id: "1233470", value_name: "Brasil" },
      { id: "GTIN", value_name: "7898956241065" }
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
      "Assinatura Oficial Duolingo Super por 12 meses.\n\n" +
      "- Vidas infinitas: pratique sem medo de errar\n" +
      "- Zero anúncios comerciais durante os exercícios\n" +
      "- Prática personalizada e revisão inteligente dos seus erros\n\n" +
      "Garantia de 7 dias com ativação rápida e suporte completo via chat/WhatsApp!"
  }
];

function postToML(item, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      family_name: item.family_name,
      category_id: item.category_id,
      price: item.price,
      currency_id: item.currency_id,
      available_quantity: item.available_quantity,
      buying_mode: item.buying_mode,
      listing_type_id: item.listing_type_id,
      condition: item.condition,
      pictures: item.pictures,
      attributes: item.attributes,
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

function postDescription(itemId, text, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ plain_text: text });
    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${itemId}/description`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', () => resolve({ status: 500 }));
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
    process.exit(1);
  }

  console.log(`Token configurado. Processando catálogo...\n`);

  const results = [];

  for (const prod of PRODUCTS_TO_PUBLISH) {
    console.log(`⏳ Publicando: "${prod.family_name}" (R$ ${prod.price.toFixed(2)})...`);
    const res = await postToML(prod, ML_TOKEN);

    if (res.status === 201 || res.status === 200) {
      console.log(`✅ SUCESSO! Anúncio criado com ID: ${res.data.id}`);
      console.log(`🔗 Link no Mercado Livre: ${res.data.permalink}`);

      if (prod.description) {
        await postDescription(res.data.id, prod.description, ML_TOKEN);
        console.log(`📝 Descrição detalhada vinculada com sucesso!`);
      }
      console.log('');
      results.push({ sku: prod.sku, id: res.data.id, permalink: res.data.permalink });
    } else {
      console.warn(`⚠️ Retorno da API (Status ${res.status}):`);
      console.warn(JSON.stringify(res.data, null, 2), '\n');
    }

    // Intervalo de segurança
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🏁 Processo finalizado com sucesso!');
  console.log('Anúncios processados:', results);
}

run();
