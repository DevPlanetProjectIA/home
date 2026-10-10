// Serviço de processamento e entrega de licenças
import crypto from 'node:crypto';

// Instruções padrão de ativação por produto
export const PRODUCT_INSTRUCTIONS = {
  'google-ai-pro-18m': {
    name: 'Google AI Pro — 18 meses (5 TB)',
    guide: `1. Acesse o Google Workspace / Gemini com a sua conta Google.\n` +
           `2. Utilize o convite ou chave de ativação fornecida abaixo para vincular seu período de 18 meses com 5 TB de armazenamento no Google Drive.\n` +
           `3. O saldo mensal de 1.000 créditos de IA será disponibilizado automaticamente no seu painel.`
  },
  'google-ai-pro': {
    name: 'Google AI Pro — 18 meses (5 TB)',
    guide: `1. Acesse o Google Workspace / Gemini com a sua conta Google.\n` +
           `2. Utilize o convite ou chave de ativação fornecida abaixo para vincular seu período de 18 meses com 5 TB de armazenamento no Google Drive.\n` +
           `3. O saldo mensal de 1.000 créditos de IA será disponibilizado automaticamente no seu painel.`
  },
  'lovable-lite-12m': {
    name: 'Lovable Lite — 12 meses',
    guide: `1. Acesse https://lovable.dev e faça login com sua conta (GitHub ou e-mail).\n` +
           `2. Vá em Configurações (Settings) > Assinatura / Código de Resgate.\n` +
           `3. Insira o código da sua licença para ativar 12 meses de acesso Lovable Lite com créditos e deploy full-stack.`
  },
  'lovable-lite': {
    name: 'Lovable Lite — 12 meses',
    guide: `1. Acesse https://lovable.dev e faça login com sua conta (GitHub ou e-mail).\n` +
           `2. Vá em Configurações (Settings) > Assinatura / Código de Resgate.\n` +
           `3. Insira o código da sua licença para ativar 12 meses de acesso Lovable Lite com créditos e deploy full-stack.`
  },
  'microsoft-365-12m': {
    name: 'Microsoft 365 Premium — 12 meses',
    guide: `1. Acesse https://setup.office.com ou https://microsoft365.com/redeem com sua conta Microsoft (Outlook/Hotmail).\n` +
           `2. Insira a sua chave de ativação de 25 dígitos fornecida abaixo.\n` +
           `3. Confirme para vincular os 12 meses de assinatura oficial e 1 TB de armazenamento seguro no OneDrive.`
  },
  'microsoft-365': {
    name: 'Microsoft 365 Premium — 12 meses',
    guide: `1. Acesse https://setup.office.com ou https://microsoft365.com/redeem com sua conta Microsoft (Outlook/Hotmail).\n` +
           `2. Insira a sua chave de ativação de 25 dígitos fornecida abaixo.\n` +
           `3. Confirme para vincular os 12 meses de assinatura oficial e 1 TB de armazenamento seguro no OneDrive.`
  },
  'adobe-express-12m': {
    name: 'Adobe Express — 12 meses',
    guide: `1. Acesse https://express.adobe.com ou https://redeem.adobe.com com seu Adobe ID (ou crie um gratuitamente).\n` +
           `2. Insira o código da sua licença de resgate.\n` +
           `3. Seu status Premium será liberado imediatamente com IA Firefly, +25.000 fontes e acervo Adobe Stock por 12 meses.`
  },
  'adobe-express': {
    name: 'Adobe Express — 12 meses',
    guide: `1. Acesse https://express.adobe.com ou https://redeem.adobe.com com seu Adobe ID (ou crie um gratuitamente).\n` +
           `2. Insira o código da sua licença de resgate.\n` +
           `3. Seu status Premium será liberado imediatamente com IA Firefly, +25.000 fontes e acervo Adobe Stock por 12 meses.`
  },
  'prime-video-6m': {
    name: 'Amazon Prime Video — 6 meses',
    guide: `1. Acesse https://www.primevideo.com ou baixe o app no celular/Smart TV.\n` +
           `2. Siga as orientações de ativação fornecidas abaixo para desbloquear seu acesso de 6 meses em 4K Ultra HD.\n` +
           `3. Aproveite o catálogo completo de filmes, séries e produções Amazon Originals.`
  },
  'prime-video': {
    name: 'Amazon Prime Video — 6 meses',
    guide: `1. Acesse https://www.primevideo.com ou baixe o app no celular/Smart TV.\n` +
           `2. Siga as orientações de ativação fornecidas abaixo para desbloquear seu acesso de 6 meses em 4K Ultra HD.\n` +
           `3. Aproveite o catálogo completo de filmes, séries e produções Amazon Originals.`
  },
  'duolingo-super-12m': {
    name: 'Duolingo Super — 12 meses',
    guide: `1. Abra o aplicativo do Duolingo ou acesse https://www.duolingo.com.\n` +
           `2. Acesse seu perfil > Configurações > Ativar Código Promocional / Plano Super.\n` +
           `3. Insira o código da sua licença para desbloquear os 12 meses sem anúncios e com vidas infinitas.`
  },
  'duolingo-super': {
    name: 'Duolingo Super — 12 meses',
    guide: `1. Abra o aplicativo do Duolingo ou acesse https://www.duolingo.com.\n` +
           `2. Acesse seu perfil > Configurações > Ativar Código Promocional / Plano Super.\n` +
           `3. Insira o código da sua licença para desbloquear os 12 meses sem anúncios e com vidas infinitas.`
  }
};

/**
 * Solicita a licença para o fornecedor no Telegram ou gera chave de teste
 */
export async function fulfillOrderLicense(order, db) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const supplierChatId = process.env.TELEGRAM_SUPPLIER_CHAT_ID;
  const productInfo = PRODUCT_INSTRUCTIONS[order.product_id] || {
    name: order.product_name,
    guide: 'Siga as orientações fornecidas com sua chave de ativação para usufruir do produto.'
  };

  let licenseKey = '';
  let telegramMessageId = null;

  // Se o Telegram estiver configurado, envia a solicitação ao fornecedor
  if (botToken && supplierChatId) {
    try {
      const template = process.env.TELEGRAM_COMMAND_TEMPLATE || '/comprar {product_id}';
      const messageText = template
        .replace('{order_id}', order.id)
        .replace('{product_id}', order.product_id)
        .replace('{product_name}', order.product_name)
        .replace('{customer_email}', order.customer_email)
        .replace('{customer_name}', order.customer_name);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: supplierChatId,
          text: `🚨 [NOVA COMPRA APROVADA]\n\nPedido: ${order.id}\nProduto: ${order.product_name}\nCliente: ${order.customer_name} (${order.customer_email})\n\nComando:\n${messageText}`
        })
      });

      const resData = await response.json();
      if (resData.ok) {
        telegramMessageId = String(resData.result.message_id);
      }
    } catch (err) {
      console.error('[Telegram Error] Falha ao enviar solicitação ao Telegram:', err.message);
    }
  }

  // Se ainda não tivermos a resposta direta ou for simulação/instantâneo:
  if (!licenseKey) {
    const randomCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    licenseKey = `KEY-${order.product_id.slice(0, 4).toUpperCase()}-${randomCode}`;
  }

  const instructions = productInfo.guide;

  // Atualiza pedido no banco com a licença
  db.prepare(`
    UPDATE ecommerce_orders 
    SET status='delivered', license_key=?, license_instructions=?, telegram_message_id=?, updated_at=CURRENT_TIMESTAMP 
    WHERE id=?
  `).run(licenseKey, instructions, telegramMessageId, order.id);

  return {
    licenseKey,
    instructions,
    status: 'delivered'
  };
}
