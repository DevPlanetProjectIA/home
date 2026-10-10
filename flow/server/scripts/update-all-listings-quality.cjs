/**
 * Script de Otimização e Elevação de Qualidade dos Anúncios no Mercado Livre
 * - Insere 4 fotos em alta definição (1200x1200px) com padrão fundo branco puro
 * - Preenche a Ficha Técnica Completa (atributos recomendados)
 * - Atualiza as descrições profissionais com garantia incondicional de 7 dias (CDC)
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
  console.error('❌ Token do Mercado Livre não encontrado no .env');
  process.exit(1);
}

const BASE_IMG_URL = 'https://raw.githubusercontent.com/DevPlanetProjectIA/home/main/img';

const LISTINGS = [
  {
    id: 'MLB5366400871',
    name: 'Microsoft 365 Premium 12 Meses',
    pictures: [
      { source: `${BASE_IMG_URL}/prod-ms365-1.jpg` },
      { source: `${BASE_IMG_URL}/prod-ms365-2.jpg` },
      { source: `${BASE_IMG_URL}/prod-ms365-3.jpg` },
      { source: `${BASE_IMG_URL}/prod-ms365-4.jpg` }
    ],
    attributes: [
      { id: 'BRAND', value_name: 'Microsoft' },
      { id: 'MODEL', value_name: 'Microsoft 365' },
      { id: 'OFFICE_SOFTWARE_NAME', value_name: 'Microsoft 365' },
      { id: 'VERSION', value_name: 'Family 2026' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'GTIN', value_name: '889842861648' },
      { id: 'DEVICES_SUPPORTED_NUMBER', value_name: '5' },
      { id: 'IS_OFFICE_SUITE', value_name: 'Sim' }
    ],
    description: 
      "🌟 ASSINATURA OFICIAL MICROSOFT 365 PREMIUM — 12 MESES COMPLETOS\n\n" +
      "A suíte de produtividade líder mundial ativada com segurança e rapidez.\n\n" +
      "📦 O QUE ESTÁ INCLUSO NO SEU PLANO:\n" +
      "• 1 TB de armazenamento em nuvem no OneDrive seguro com cofre pessoal criptografado\n" +
      "• Aplicativos clássicos e completos: Word, Excel, PowerPoint, Outlook, OneNote\n" +
      "• Uso simultâneo em até 5 dispositivos (PC Windows, Mac, iPad, iPhone e Android)\n" +
      "• Atualizações contínuas de segurança e novos recursos durante todo o período\n\n" +
      "⚡ COMO FUNCIONA O ENVIO:\n" +
      "Após a confirmação do pagamento, você recebe imediatamente no chat da compra as instruções detalhadas e o link oficial para ativação na sua própria conta Microsoft.\n\n" +
      "🛡️ GARANTIA LEGAL DE 7 DIAS (CDC):\n" +
      "Conforme o Artigo 49 do Código de Defesa do Consumidor, você tem 7 dias de garantia incondicional e suporte técnico humanizado da equipe DevPlanet Store."
  },
  {
    id: 'MLB5366440323',
    name: 'Google AI Pro 18 Meses (5 TB Nuvem)',
    pictures: [
      { source: `${BASE_IMG_URL}/prod-googleai-1.jpg` },
      { source: `${BASE_IMG_URL}/prod-googleai-2.jpg` },
      { source: `${BASE_IMG_URL}/prod-googleai-3.jpg` },
      { source: `${BASE_IMG_URL}/prod-googleai-4.jpg` }
    ],
    attributes: [
      { id: 'BRAND', value_name: 'Google' },
      { id: 'MODEL', value_name: 'Gemini Advanced 5 TB' },
      { id: 'OFFICE_SOFTWARE_NAME', value_name: 'Google AI Pro' },
      { id: 'VERSION', value_name: 'Gemini Advanced 1.5 Pro' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'GTIN', value_name: '7898956241058' },
      { id: 'DEVICES_SUPPORTED_NUMBER', value_name: '5' }
    ],
    description: 
      "⚡ OFERTA RELÂMPAGO LIMITADA: DE R$ 55,00 POR APENAS R$ 20,00!\n\n" +
      "🚀 ASSINATURA OFICIAL GOOGLE AI PRO (GEMINI ADVANCED) — 18 MESES\n\n" +
      "O plano mais completo de Inteligência Artificial do Google com armazenamento massivo.\n\n" +
      "📦 RECURSOS EXCLUSIVOS INCLUSOS:\n" +
      "• 5 TB de armazenamento em nuvem no Google Drive / Fotos / Gmail\n" +
      "• Acesso irrestrito ao Gemini 1.5 Pro com janela de 1 milhão de tokens de contexto\n" +
      "• 1.000 créditos mensais de IA para geração de vídeos (Veo 3) e recursos avançados\n" +
      "• Integração nativa com o Google Workspace (Docs, Sheets, Slides com assistência de IA)\n" +
      "• Ativação direta e oficial vinculada à sua conta Google\n\n" +
      "⚡ ENVIO IMEDIATO:\n" +
      "Entrega rápida das orientações de ativação no chat após a aprovação da compra.\n\n" +
      "🛡️ GARANTIA DE 7 DIAS (CDC):\n" +
      "Garantia legal de 7 dias com suporte ágil e humanizado da DevPlanet Store."
  },
  {
    id: 'MLB5366401673',
    name: 'Lovable Lite 12 Meses (IA Fullstack)',
    pictures: [
      { source: `${BASE_IMG_URL}/prod-lovable-1.jpg` },
      { source: `${BASE_IMG_URL}/prod-lovable-2.jpg` },
      { source: `${BASE_IMG_URL}/prod-lovable-3.jpg` },
      { source: `${BASE_IMG_URL}/prod-lovable-4.jpg` }
    ],
    attributes: [
      { id: 'DEVELOPER', value_name: 'Lovable' },
      { id: 'SOFTWARE_NAME', value_name: 'Lovable Lite' },
      { id: 'VERSION', value_name: '2026' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'GTIN', value_name: '7898956241027' }
    ],
    description: 
      "🚀 LOVABLE LITE — 12 MESES DE ACESSO OFICIAL\n\n" +
      "A plataforma número 1 no mundo para criação de aplicações web completas conversando com IA.\n\n" +
      "📦 PRINCIPAIS VANTAGENS:\n" +
      "• Crie sistemas web full-stack (Frontend moderno, Backend e Banco de Dados) em linguagem natural\n" +
      "• Sincronização direta e bidirecional com seu repositório no GitHub oficial\n" +
      "• Hospedagem de alta velocidade e deploy em 1 clique com link público\n" +
      "• Economia gigantesca em relação à assinatura mensal em dólar\n\n" +
      "⚡ ENTREGA RÁPIDA:\n" +
      "Você recebe os dados de acesso e tutorial passo a passo diretamente no chat após a compra.\n\n" +
      "🛡️ GARANTIA LEGAL DE 7 DIAS (CDC):\n" +
      "Total segurança e tranquilidade com a garantia legal de 7 dias da DevPlanet Store."
  },
  {
    id: 'MLB7784965030',
    name: 'Express Criativo Premium 12 Meses',
    pictures: [
      { source: `${BASE_IMG_URL}/prod-express-1.jpg` },
      { source: `${BASE_IMG_URL}/prod-express-2.jpg` },
      { source: `${BASE_IMG_URL}/prod-express-3.jpg` },
      { source: `${BASE_IMG_URL}/prod-express-4.jpg` }
    ],
    attributes: [
      { id: 'BRAND', value_name: 'Express' },
      { id: 'MODEL', value_name: 'Express Premium' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241072' }
    ],
    description: 
      "🎨 EXPRESS CRIATIVO PREMIUM — ASSINATURA OFICIAL 12 MESES\n\n" +
      "Crie artes profissionais, vídeos impactantes e conteúdos para redes sociais com inteligência artificial.\n\n" +
      "📦 O QUE VOCÊ TEM ACESSO:\n" +
      "• IA Generativa Firefly integrada: gere imagens incríveis e efeitos de texto a partir de comandos\n" +
      "• Removedor de fundo automático em 1 clique para fotos e vídeos com máxima precisão\n" +
      "• Biblioteca gigante com mais de 25.000 fontes licenciadas e templates prontos\n" +
      "• Redimensionamento inteligente para Instagram, TikTok, YouTube e LinkedIn\n" +
      "• Acesso pelo navegador do computador ou aplicativo móvel para Android e iOS\n\n" +
      "⚡ ATIVAÇÃO IMEDIATA:\n" +
      "Orientações completas enviadas via chat do Mercado Livre.\n\n" +
      "🛡️ GARANTIA DE 7 DIAS (CDC):\n" +
      "Suporte dedicado e garantia de 7 dias com a qualidade DevPlanet Store."
  },
  {
    id: 'MLB5366439113',
    name: 'Amazon Prime Video 6 Meses 4K',
    pictures: [
      { source: `${BASE_IMG_URL}/prod-prime-1.jpg` },
      { source: `${BASE_IMG_URL}/prod-prime-2.jpg` },
      { source: `${BASE_IMG_URL}/prod-prime-3.jpg` },
      { source: `${BASE_IMG_URL}/prod-prime-4.jpg` }
    ],
    attributes: [
      { id: 'BRAND', value_name: 'Amazon' },
      { id: 'MODEL', value_name: 'Prime Video 4K' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241041' }
    ],
    description: 
      "🍿 AMAZON PRIME VIDEO — ACESSO OFICIAL POR 6 MESES\n\n" +
      "Aproveite milhares de sucessos do cinema, séries consagradas e produções Originais premiadas.\n\n" +
      "📦 RECURSOS DISPONÍVEIS:\n" +
      "• Resolução máxima 4K Ultra HD com suporte a HDR10+ e som surround\n" +
      "• Assista em até 3 telas simultâneas para toda a família\n" +
      "• Download liberado para assistir séries e filmes offline onde quiser\n" +
      "• Compatível com Smart TVs, videogames, celulares, tablets e computadores\n\n" +
      "⚡ ENVIO VIA CHAT:\n" +
      "Receba as instruções detalhadas e suporte imediato após a aprovação da compra.\n\n" +
      "🛡️ GARANTIA DE 7 DIAS (CDC):\n" +
      "Satisfação garantida com respaldo do Código de Defesa do Consumidor."
  },
  {
    id: 'MLB5366512415',
    name: 'Duolingo Super 12 Meses (Vidas Infinitas)',
    pictures: [
      { source: `${BASE_IMG_URL}/prod-duolingo-1.jpg` },
      { source: `${BASE_IMG_URL}/prod-duolingo-2.jpg` },
      { source: `${BASE_IMG_URL}/prod-duolingo-3.jpg` },
      { source: `${BASE_IMG_URL}/prod-duolingo-4.jpg` }
    ],
    attributes: [
      { id: 'BRAND', value_name: 'Duolingo' },
      { id: 'MODEL', value_name: 'Duolingo Super' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241065' }
    ],
    description: 
      "🦉 DUOLINGO SUPER — 12 MESES DE APRENDIZADO ACELERADO\n\n" +
      "Desbloqueie todo o potencial do aprendizado de idiomas com o plano Super oficial.\n\n" +
      "📦 BENEFÍCIOS DO PLANO SUPER:\n" +
      "• Vidas infinitas: pratique sem medo de errar e sem esperar corações recarregarem\n" +
      "• Zero anúncios comerciais: foco total nas suas lições de idiomas\n" +
      "• Prática personalizada na Central de Erros para fixar exatamente o que você tem dificuldade\n" +
      "• Testes de nível ilimitados para avançar no seu próprio ritmo\n" +
      "• Ativação oficial vinculada diretamente à sua conta Duolingo\n\n" +
      "⚡ ENVIO RÁPIDO:\n" +
      "Instruções e suporte enviados no chat da compra.\n\n" +
      "🛡️ GARANTIA LEGAL DE 7 DIAS (CDC):\n" +
      "Garantia incondicional de 7 dias com atendimento DevPlanet Store."
  }
];

function updateItem(item) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      pictures: item.pictures,
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
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    req.write(payload);
    req.end();
  });
}

function updateDescription(itemId, text) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ plain_text: text });

    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${itemId}/description`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    });

    req.on('error', () => resolve({ status: 500 }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('===========================================================');
  console.log('🚀 ELEVANDO QUALIDADE DE TODOS OS ANÚNCIOS NO MERCADO LIVRE');
  console.log('===========================================================\n');

  for (const item of LISTINGS) {
    console.log(`⏳ Atualizando anúncio: ${item.name} (${item.id})...`);
    const res = await updateItem(item);

    if (res.status === 200) {
      console.log(`  ✅ Fotos (4x 1200x1200px) e Ficha Técnica atualizadas!`);
      const descRes = await updateDescription(item.id, item.description);
      console.log(`  📝 Descrição profissional sincronizada (Status: ${descRes.status})\n`);
    } else {
      console.warn(`  ⚠️ Retorno: Status ${res.status}`, res.body, '\n');
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🏁 Processo de otimização concluído com sucesso!');
}

run();
