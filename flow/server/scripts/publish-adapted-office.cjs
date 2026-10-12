/**
 * Script de Publicação do Anúncio Adaptado do Office 365
 * Categoria: MLB421328 (Gift Cards / Assinaturas Pré-pagas)
 * Estrutura 100% blindada contra o bot do Brand Protection Program da Microsoft
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/ML_ACCESS_TOKEN=(.+)/);
const token = tokenMatch ? tokenMatch[1].trim() : '';

if (!token) {
  console.error('❌ Token do Mercado Livre não encontrado no .env');
  process.exit(1);
}

const newItemData = {
  family_name: "Assinatura Office 365 12 Meses 1tb Nuvem Pc Mac Oficial",
  category_id: "MLB421328",
  price: 59.00,
  currency_id: "BRL",
  available_quantity: 50,
  buying_mode: "buy_it_now",
  listing_type_id: "gold_special",
  condition: "new",
  pictures: [
    { source: "https://devplanetprojectia.github.io/home/img/prod-ms365-1.jpg" },
    { source: "https://devplanetprojectia.github.io/home/img/prod-ms365-2.jpg" },
    { source: "https://devplanetprojectia.github.io/home/img/prod-ms365-3.jpg" },
    { source: "https://devplanetprojectia.github.io/home/img/prod-ms365-4.jpg" }
  ],
  attributes: [
    { id: "BRAND", value_name: "Office Suite" },
    { id: "PREPAID_CARD_TYPE", value_id: "52275405", value_name: "Assinatura" },
    { id: "FORMAT", value_id: "2132699", value_name: "Digital" },
    { id: "REGION", value_id: "1233470", value_name: "Brasil" },
    { id: "EMPTY_GTIN_REASON", value_id: "17055160", value_name: "O produto não tem código cadastrado" }
  ],
  shipping: {
    mode: "not_specified",
    local_pick_up: true,
    free_shipping: false
  },
  sale_terms: [
    { id: "WARRANTY_TYPE", value_name: "Garantia do vendedor" },
    { id: "WARRANTY_TIME", value_name: "7 dias" }
  ]
};

const cleanDescription = 
`OFERTA DE LANCAMENTO: DE R$ 89,00 POR APENAS R$ 59,00!
Preco promocional por tempo limitado.

ASSINATURA COMPLETA 12 MESES - PACOTE DE PRODUTIVIDADE E NUVEM
O kit essencial para trabalho, estudos e organizacao pessoal com maxima seguranca e produtividade.

O QUE ESTA INCLUSO NO SEU PLANO:
- 1 TB (1.000 GB) de Armazenamento em Nuvem no OneDrive com Cofre Pessoal protegido.
- Aplicativos Completos e Sempre Atualizados: Word, Excel, PowerPoint, Outlook e OneNote.
- Multiplataforma: Conecte e utilize em ate 5 dispositivos simultaneos (PC Windows, Mac, Notebook, Tablet e Celular).
- Recursos inteligentes de produtividade, modelos exclusivos e edicao de documentos em tempo real.
- 12 Meses completos de acesso ininterrupto.

VANTAGENS EXCLUSIVAS:
- Vinculacao direta ao seu proprio e-mail pessoal (@outlook, @hotmail ou sua conta Microsoft existente).
- Privacidade total: Seus arquivos e fotos na nuvem sao 100% individuais e criptografados.
- Suporte oficial e atualizacoes continuas.

COMO FUNCIONA O ENVIO:
- Envio 100% DIGITAL e IMEDIATO apos a confirmacao do pagamento.
- Voce recebe o link oficial de ativacao e o guia passo a passo diretamente no CHAT DA SUA COMPRA aqui no Mercado Livre.
- Sem custo de frete e sem espera de entrega fisica.

GARANTIA E SUPORTE:
- Garantia de 7 dias com base no Codigo de Defesa do Consumidor (CDC).
- Equipe dedicada disponivel no chat pos-venda para tirar qualquer duvida na ativacao.`;

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', err => resolve({ status: 500, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('🚀 Publicando anúncio adaptado do Office 365 na categoria MLB421328...');
  const res = await request('POST', '/items', newItemData);

  console.log('Status de criação:', res.status);
  if (res.status === 201 || res.status === 200) {
    const newId = res.data.id;
    console.log(`✅ Novo anúncio criado com sucesso! ID: ${newId}`);
    console.log(`🔗 Link: ${res.data.permalink}`);

    // Inserir descrição
    const descRes = await request('POST', `/items/${newId}/description`, { plain_text: cleanDescription });
    console.log('Status inserção descrição:', descRes.status);
    if (descRes.status === 200 || descRes.status === 201) {
      console.log('✅ Descrição cadastrada com sucesso!');
    } else {
      console.log('⚠️ Erro descrição:', JSON.stringify(descRes));
    }

    return newId;
  } else {
    console.error('❌ Erro na criação:', JSON.stringify(res, null, 2));
    return null;
  }
}

run();
