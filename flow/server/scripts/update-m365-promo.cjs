const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const match = fs.readFileSync(envPath, 'utf8').match(/ML_ACCESS_TOKEN=(.+)/);
const token = match ? match[1].trim() : '';

const ITEM_ID = 'MLB5366400871';

function request(method, urlPath, body = null) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path: urlPath,
      method: method,
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
  console.log('🔄 Atualizando anúncio do Microsoft 365...');

  // 1. Atualizar Preço
  const updateItemRes = await request('PUT', `/items/${ITEM_ID}`, {
    price: 59.00
  });

  console.log('Status atualização Preço R$ 59:', updateItemRes.status);
  if (updateItemRes.status !== 200) {
    console.log('Detalhes item:', JSON.stringify(updateItemRes));
  }

  // 2. Atualizar Descrição Completa Anti-Pirataria + Gatilho de Urgência
  const newDescription = 
`⚡ OFERTA RELÂMPAGO DE LANÇAMENTO: DE R$ 89,00 POR APENAS R$ 59,00!
⏳ PREÇO PROMOCIONAL VÁLIDO SOMENTE PELAS PRÓXIMAS 48 HORAS OU PARA OS PRIMEIROS 10 COMPRADORES!
(Após o término do lote promocional de ativação, o valor retornará ao preço padrão de R$ 89,00).

----------------------------------------------------------------------
🛡️ CUIDADO COM LICENÇAS FALSAS DE R$ 35 A R$ 40 NO MERCADO LIVRE!
----------------------------------------------------------------------
Muitos anúncios baratos utilizam:
❌ Ativadores piratas (KMS): Scripts que desativam seu antivírus, instalam malwares e bloqueiam após algumas semanas.
❌ Contas compartilhadas / escolares: Entregam logins prontos de terceiros onde pessoas estranhas têm acesso aos seus arquivos privados e a conta é banida pela Microsoft sem aviso.

✅ AQUI VOCÊ TEM O PRODUTO 100% ORIGINAL E SEGURO:
• Ativação direta vinculada ao SEU PRÓPRIO E-MAIL PESSOAL Microsoft (@outlook, @hotmail ou sua conta pessoal).
• Você NÃO divide conta com ninguém. Seus arquivos no OneDrive são 100% privados e criptografados.
• Suporte oficial e atualizações automáticas direto da Microsoft.
• Economia de mais de 85% em relação ao site oficial da Microsoft (onde o plano custa R$ 449,00/ano).

----------------------------------------------------------------------
📦 O QUE ESTÁ INCLUSO NO SEU PLANO MICROSOFT 365 PREMIUM (12 MESES):
----------------------------------------------------------------------
• 1 TB (1.000 GB) de Armazenamento em Nuvem no OneDrive com Cofre Pessoal protegido por biometria/2FA.
• Uso simultâneo em até 5 dispositivos (PC Windows, Mac, iPad, iPhone e Android).
• Aplicativos completos e sempre atualizados: Word, Excel, PowerPoint, Outlook e OneNote.
• Assistente de Inteligência Artificial para produtividade, edição e templates exclusivos.
• 12 Meses completos de assinatura sem interrupções.

----------------------------------------------------------------------
⚡ COMO FUNCIONA O ENVIO:
----------------------------------------------------------------------
• Envio 100% DIGITAL e IMEDIATO após a confirmação do pagamento.
• O link oficial de ativação e o passo a passo simplificado são enviados diretamente no CHAT DA SUA COMPRA aqui no Mercado Livre.
• Frete Grátis e suporte imediato.

----------------------------------------------------------------------
🛡️ GARANTIA LEGAL DE 7 DIAS (CDC):
----------------------------------------------------------------------
Compre com tranquilidade! Você tem 7 dias de garantia incondicional conforme o Artigo 49 do Código de Defesa do Consumidor e atendimento prioritário da equipe DevPlanet Store.`;

  const descRes = await request('PUT', `/items/${ITEM_ID}/description`, {
    plain_text: newDescription
  });

  console.log('Status atualização descrição:', descRes.status);
  if (descRes.status !== 200) {
    console.log('Detalhes erro descrição:', JSON.stringify(descRes));
  } else {
    console.log('✅ Descrição atualizada com sucesso!');
  }
}

run();
