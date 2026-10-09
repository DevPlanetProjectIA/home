// Serviço de Notificação e Integração com Telegram Bot
import { PRODUCT_INSTRUCTIONS } from './licenseService.js';

let lastUpdateId = 0;
let isPolling = false;

/**
 * Inicia o polling contínuo para ouvir mensagens do Administrador no Telegram
 */
export function startTelegramPolling(db) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || isPolling) return;
  isPolling = true;

  console.log('[Telegram Bot] Iniciando serviço de escuta de mensagens...');

  const poll = async () => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            await handleTelegramUpdate(update, db, token);
          }
        }
      }
    } catch (err) {
      // Ignora pequenos timeouts normais de polling
    } finally {
      setTimeout(poll, 1500);
    }
  };

  poll();
}

/**
 * Processa mensagens recebidas pelo Bot
 */
async function handleTelegramUpdate(update, db, token) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Comando /start: registra ou confirma o admin
  if (text.startsWith('/start')) {
    process.env.TELEGRAM_ADMIN_CHAT_ID = String(chatId);
    await sendTelegramMessage(token, chatId, 
      `👋 *Olá Bruno!*\n\n` +
      `Seu Telegram foi conectado com sucesso à *DevPlanet Store*!\n` +
      `🆔 Seu Chat ID: \`${chatId}\`\n\n` +
      `Sempre que uma venda for aprovada pelo Mercado Pago, enviarei a notificação aqui.\n` +
      `Basta você responder a notificação com a chave da licença comprada no GGSoma 2 para liberar para o cliente!`
    );
    return;
  }

  // Verificar se é comando /entregar <id> <chave>
  const deliverMatch = text.match(/^\/entregar\s+([A-Za-z0-9\-_]+)\s+(.+)$/i);
  let orderId = deliverMatch ? deliverMatch[1] : null;
  let licenseKey = deliverMatch ? deliverMatch[2].trim() : null;

  // Se não foi comando direto, verificar se é RESPOSTA a uma notificação de pedido
  if (!orderId && msg.reply_to_message && msg.reply_to_message.text) {
    const replyText = msg.reply_to_message.text;
    const match = replyText.match(/Pedido:\s*([A-Za-z0-9\-_]+)/i);
    if (match) {
      orderId = match[1];
      licenseKey = text; // O texto da resposta é a própria chave da licença
    }
  }

  // Se identificou um pedido para entregar
  if (orderId && licenseKey) {
    const order = db.prepare('SELECT * FROM ecommerce_orders WHERE id=?').get(orderId);
    if (!order) {
      await sendTelegramMessage(token, chatId, `❌ Pedido \`${orderId}\` não encontrado.`);
      return;
    }

    const prodInfo = PRODUCT_INSTRUCTIONS[order.product_id] || { guide: 'Siga as instruções com sua chave para ativar.' };

    db.prepare(`
      UPDATE ecommerce_orders 
      SET status='delivered', license_key=?, license_instructions=?, updated_at=CURRENT_TIMESTAMP 
      WHERE id=?
    `).run(licenseKey, prodInfo.guide, order.id);

    // Formatar telefone do cliente para o WhatsApp
    let cleanPhone = (order.customer_phone || '').replace(/\D/g, '');
    if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const waText = 
      `Olá, ${order.customer_name}! 🚀\n` +
      `Aqui está a sua licença adquirida na DevPlanet Store:\n\n` +
      `📦 *Produto:* ${order.product_name}\n` +
      `🔑 *Chave de Ativação:*\n${licenseKey}\n\n` +
      `📖 *Instruções de Ativação:*\n${prodInfo.guide}\n\n` +
      `Qualquer dúvida ou suporte, estou à disposição aqui na conversa!`;

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    const replyMarkup = cleanPhone ? {
      inline_keyboard: [
        [
          { text: '📲 Enviar no WhatsApp do Cliente (1 Toque)', url: waLink }
        ]
      ]
    } : null;

    await sendTelegramMessage(token, chatId,
      `✅ *Licença Gravada com Sucesso!*\n\n` +
      `📦 *Pedido:* \`${order.id}\`\n` +
      `🏷 *Produto:* ${order.product_name}\n` +
      `👤 *Cliente:* ${order.customer_name}\n` +
      `📱 *WhatsApp:* +${cleanPhone || 'Não informado'}\n` +
      `🔑 *Chave:* \`${licenseKey}\`\n\n` +
      `👇 Clique no botão abaixo para abrir a conversa no seu WhatsApp com a mensagem completa já pronta para enviar:`,
      replyMarkup
    );
    return;
  }

  // Ajuda / comandos gerais
  if (text.startsWith('/pedidos')) {
    const pending = db.prepare("SELECT id, product_name, customer_name, amount FROM ecommerce_orders WHERE status IN ('pending', 'approved') ORDER BY id DESC LIMIT 5").all();
    if (pending.length === 0) {
      await sendTelegramMessage(token, chatId, 'Nenhum pedido pendente de entrega no momento.');
    } else {
      let msgTxt = '📋 *Pedidos Pendentes:*\n\n';
      for (const p of pending) {
        msgTxt += `• \`${p.id}\` — ${p.product_name} (${p.customer_name}) - R$ ${p.amount}\n`;
      }
      msgTxt += '\nPara entregar uma licença, envie:\n`/entregar ID_DO_PEDIDO SUA_CHAVE`';
      await sendTelegramMessage(token, chatId, msgTxt);
    }
  }
}

/**
 * Envia notificação ao Administrador quando o pedido é pago
 */
export async function notifyAdminNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !adminChatId) {
    console.log('[Telegram Bot] Aviso: Bot Token ou Admin Chat ID não configurados para alerta.');
    return;
  }

  const text = 
    `🚨 *NOVA VENDA APROVADA!*\n\n` +
    `📦 *Pedido:* \`${order.id}\`\n` +
    `🏷 *Produto:* ${order.product_name}\n` +
    `💰 *Valor:* R$ ${Number(order.amount).toFixed(2)}\n` +
    `👤 *Cliente:* ${order.customer_name}\n` +
    `📧 *E-mail:* ${order.customer_email}\n` +
    `📱 *Telefone:* ${order.customer_phone || 'Não informado'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛒 *Para entregar a licença:*\n` +
    `1. Compre a licença no *GGSoma 2 bot*.\n` +
    `2. *Responda esta mensagem* com o código da licença recebido!\n` +
    `*(Ou digite: \`/entregar ${order.id} CODIGO_DA_LICENCA\`)*`;

  await sendTelegramMessage(token, adminChatId, text);
}

/**
 * Helper para envio de mensagem formatada
 */
async function sendTelegramMessage(token, chatId, text, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('[Telegram Error] Falha ao enviar mensagem:', err.message);
  }
}
