// Serviço de processamento e entrega de licenças
import crypto from 'node:crypto';

// Instruções padrão de ativação por produto
export const PRODUCT_INSTRUCTIONS = {
  'google-ai-pro-18m': {
    name: 'Google AI Pro — 18 meses',
    guide: `1. Acesse o Google Workspace / Gemini com a sua conta Google.\n` +
           `2. Utilize o código de licença / convite fornecido abaixo para ativar seu período de 18 meses com 5 TB de armazenamento.\n` +
           `3. O saldo mensal de 1.000 créditos de IA será disponibilizado automaticamente no seu painel.`
  },
  'duolingo-super-12m': {
    name: 'Duolingo Super — 12 meses',
    guide: `1. Abra o aplicativo do Duolingo ou acesse https://www.duolingo.com.\n` +
           `2. Acesse seu perfil > Configurações > Ativar Código Promocional / Plano Super.\n` +
           `3. Insira o código da sua licença para desbloquear os 12 meses sem anúncios e com vidas infinitas.`
  },
  'canva-pro-12m': {
    name: 'Canva Pro — 12 meses',
    guide: `1. Acesse https://www.canva.com e faça login com seu e-mail.\n` +
           `2. Acesse o link de convite VIP ou insira a chave da equipe enviada para você.\n` +
           `3. Sua conta será promovida para o status PRO com todos os recursos desbloqueados por 12 meses.`
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
