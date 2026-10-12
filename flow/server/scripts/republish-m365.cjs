/**
 * Script para republicar o anúncio do Microsoft 365 em total conformidade
 * com as políticas do Mercado Livre (sem termos restritos e com formato digital correto).
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
  family_name: "Microsoft 365 12 Meses 1tb Nuvem Original",
  category_id: "MLB1733",
  price: 59.00,
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
    { id: "FORMAT", value_id: "2132699", value_name: "Digital" },
    { id: "GTIN", value_name: "889842861648" },
    { id: "LICENSE_TIME", value_id: "3640656", value_name: "1 anos" },
    { id: "LANGUAGES", value_name: "Português" },
    { id: "SOFTWARE_FUNCTIONS", value_name: "Produtividade" },
    { id: "DEVICES_SUPPORTED_NUMBER", value_name: "5" },
    { id: "IS_OFFICE_SUITE", value_name: "Sim" },
    { id: "WITH_UNLIMITED_LICENSE", value_name: "Não" },
    { id: "REGION", value_id: "1233470", value_name: "Brasil" }
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
`OFERTA ESPECIAL DE LANCAMENTO: APENAS R$ 59,00!
Aproveite as condicoes promocionais por tempo limitado.

ASSINATURA MICROSOFT 365 ORIGINAL (12 MESES)
Tenha em maos o pacote completo de produtividade e nuvem com total seguranca e suporte oficial.

O QUE ESTA INCLUSO NO SEU PLANO:
- 1 TB (1.000 GB) de Armazenamento em Nuvem no OneDrive com Cofre Pessoal.
- Aplicativos Oficiais Completos: Word, Excel, PowerPoint, Outlook e OneNote.
- Multiplataforma: Conecte ate 5 dispositivos simultaneos (PC Windows, Mac, Notebook, Tablet e Celular).
- Recursos inteligentes de produtividade e modelos exclusivos.
- 12 Meses completos de assinatura oficial ativa.

VANTAGENS EXCLUSIVAS:
- Vinculacao direta a sua conta pessoal Microsoft (@outlook, @hotmail ou seu e-mail cadastrado).
- Total privacidade: Seus arquivos e documentos no OneDrive sao 100% pessoais e criptografados.
- Atualizacoes oficiais e suporte automatico pela Microsoft.

COMO FUNCIONA O ENVIO:
- Envio 100% DIGITAL e IMEDIATO apos a confirmacao do pagamento.
- Voce recebe o link oficial de ativacao e o passo a passo simplificado diretamente no CHAT DA SUA COMPRA aqui no Mercado Livre.
- Nao ha frete nem espera de entrega fisica.

GARANTIA E SUPORTE:
- Garantia incondicional de 7 dias conforme o Artigo 49 do Codigo de Defesa do Consumidor (CDC).
- Atendimento prioritario e suporte dedicado para auxiliar em todas as etapas da ativacao.`;

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
  console.log('🚀 Publicando novo anúncio limpo do Microsoft 365...');
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
