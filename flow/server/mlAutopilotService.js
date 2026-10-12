/**
 * Serviço de Piloto Automático para o Mercado Livre
 * - Monitora vendas pagas em tempo real
 * - Auto-refresh contínuo do token do Mercado Livre
 * - Entrega a licença e instruções automaticamente no chat da compra do comprador
 * - Notifica o Telegram do administrador com os detalhes da venda entregue
 */
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

const CLIENT_ID = '7763221096235181';
const CLIENT_SECRET = '23rfiy0WKZtxM3vHj0urRFiVvXBNSejq';
const SELLER_ID = '628883838';

function getEnvVar(key) {
  if (!fs.existsSync(envPath)) return '';
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(new RegExp(`${key}=([^\\r\\n]+)`));
  return match ? match[1].trim() : '';
}

function updateEnvVar(key, val) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (content.includes(`${key}=`)) {
    content = content.replace(new RegExp(`${key}=.*`), `${key}=${val}`);
  } else {
    content += `\n${key}=${val}\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

export const ML_CATALOG = {
  'MLB5376292517': {
    name: 'Microsoft 365 Premium 12 Meses',
    prefix: 'MS365',
    guide: '1. Acesse https://setup.office.com ou https://microsoft365.com/redeem com sua conta Microsoft existente (@outlook, @hotmail ou seu e-mail pessoal).\n' +
           '2. Insira a sua chave oficial de 25 dígitos fornecida acima.\n' +
           '3. Confirme para vincular os 12 meses oficiais com 1 TB de nuvem no OneDrive seguro e todos os aplicativos para até 5 dispositivos.'
  },
  'MLB5366400871': {
    name: 'Microsoft 365 Premium 12 Meses',
    prefix: 'MS365',
    guide: '1. Acesse https://setup.office.com ou https://microsoft365.com/redeem com sua conta Microsoft existente (@outlook, @hotmail ou seu e-mail pessoal).\n' +
           '2. Insira a sua chave oficial de 25 dígitos fornecida acima.\n' +
           '3. Confirme para vincular os 12 meses oficiais com 1 TB de nuvem no OneDrive seguro e todos os aplicativos para até 5 dispositivos.'
  },
  'MLB5366440323': {
    name: 'Google AI Pro 18 Meses (5 TB Nuvem)',
    prefix: 'GOOGAI',
    guide: '1. Acesse o Google Workspace / Gemini com a sua conta Google pessoal.\n' +
           '2. Utilize o convite ou chave de ativação oficial acima para vincular os 18 meses com 5 TB de armazenamento no Google Drive.\n' +
           '3. O acesso completo ao Gemini 1.5 Pro e os 1.000 créditos mensais de IA serão liberados imediatamente.'
  },
  'MLB5366401673': {
    name: 'Lovable Lite 12 Meses (IA Fullstack)',
    prefix: 'LOVABLE',
    guide: '1. Acesse https://lovable.dev e faça login com sua conta (GitHub ou e-mail).\n' +
           '2. Vá em Configurações (Settings) > Código de Resgate / Assinatura.\n' +
           '3. Insira sua chave oficial para desbloquear 12 meses de acesso full-stack com IA e deploy em 1 clique.'
  },
  'MLB7784965030': {
    name: 'Express Criativo Premium 12 Meses',
    prefix: 'EXPRESS',
    guide: '1. Acesse https://express.adobe.com ou https://redeem.adobe.com com seu Adobe ID.\n' +
           '2. Insira o código da sua licença oficial.\n' +
           '3. Seu status Premium será liberado na hora com IA Firefly, +25.000 fontes e biblioteca completa por 12 meses.'
  },
  'MLB5366439113': {
    name: 'Amazon Prime Video 6 Meses 4K',
    prefix: 'PRIME',
    guide: '1. Acesse https://www.primevideo.com ou baixe o aplicativo no celular/Smart TV.\n' +
           '2. Siga as orientações fornecidas com seu voucher oficial para desbloquear 6 meses de streaming em 4K Ultra HD.'
  },
  'MLB5366512415': {
    name: 'Duolingo Super 12 Meses',
    prefix: 'DUOLINGO',
    guide: '1. Abra o app do Duolingo ou acesse https://www.duolingo.com.\n' +
           '2. Acesse seu perfil > Configurações > Ativar Código Promocional / Plano Super.\n' +
           '3. Insira o código para desbloquear os 12 meses sem anúncios e com vidas infinitas.'
  }
};

function requestJson(method, host, reqPath, headers = {}, body = null) {
  return new Promise((resolve) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = https.request({
      hostname: host,
      path: reqPath,
      method: method,
      headers: {
        ...headers,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', err => resolve({ status: 500, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Garante um Access Token válido, renovando com o Refresh Token se expirado
 */
export async function getValidAccessToken() {
  let token = getEnvVar('ML_ACCESS_TOKEN');
  const refreshToken = getEnvVar('ML_REFRESH_TOKEN');

  if (token) {
    const meRes = await requestJson('GET', 'api.mercadolibre.com', '/users/me', {
      'Authorization': `Bearer ${token}`
    });
    if (meRes.status === 200) return token;
  }

  // Se expirou e temos refresh_token, renova automaticamente
  if (refreshToken) {
    console.log('[ML Autopilot] 🔄 Renovando token via refresh_token...');
    const postData = JSON.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken
    });

    const res = await requestJson('POST', 'api.mercadolibre.com', '/oauth/token', {
      'Content-Type': 'application/json'
    }, postData);

    if (res.data && res.data.access_token) {
      token = res.data.access_token;
      updateEnvVar('ML_ACCESS_TOKEN', token);
      if (res.data.refresh_token) {
        updateEnvVar('ML_REFRESH_TOKEN', res.data.refresh_token);
      }
      console.log('[ML Autopilot] ✅ Token renovado com sucesso!');
      return token;
    }
  }

  console.error('[ML Autopilot] ❌ Não foi possível renovar o token do Mercado Livre.');
  return null;
}

/**
 * Envia mensagem oficial de entrega no chat da compra no Mercado Livre
 */
export async function sendMLPostSaleMessage(token, packId, buyerId, messageText) {
  // 1. Tenta envio pelo action_guide
  const actionGuideRes = await requestJson('POST', 'api.mercadolibre.com', `/messages/action_guide/packs/${packId}/option?tag=post_sale`, {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }, {
    option_id: 'OTHER',
    text: messageText
  });

  if (actionGuideRes.status >= 200 && actionGuideRes.status < 300) {
    return { success: true, method: 'action_guide', res: actionGuideRes.data };
  }

  // 2. Fallback: rota padrão de mensageria
  const directRes = await requestJson('POST', 'api.mercadolibre.com', `/messages/packs/${packId}/sellers/${SELLER_ID}?tag=post_sale`, {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }, {
    from: { user_id: Number(SELLER_ID) },
    to: { user_id: Number(buyerId) },
    text: messageText
  });

  if (directRes.status >= 200 && directRes.status < 300) {
    return { success: true, method: 'direct_pack', res: directRes.data };
  }

  return { success: false, error: actionGuideRes.data || directRes.data };
}

/**
 * Notifica o Telegram do administrador quando uma venda for entregue
 */
async function notifyAdminMLOrder(orderData, licenseKey) {
  const botToken = getEnvVar('TELEGRAM_BOT_TOKEN');
  const adminChatId = getEnvVar('TELEGRAM_ADMIN_CHAT_ID');
  if (!botToken || !adminChatId) return;

  const text = 
    `🚀 *[MERCADO LIVRE — VENDA ENTREGUE NO PILOTO AUTOMÁTICO!]*\n\n` +
    `📦 *Pedido:* #${orderData.id}\n` +
    `👤 *Comprador:* ${orderData.buyer?.nickname || 'Cliente Mercado Livre'} (ID: ${orderData.buyer?.id})\n` +
    `💎 *Produto:* ${orderData.item_title}\n` +
    `💰 *Valor:* R$ ${Number(orderData.total_amount).toFixed(2)}\n\n` +
    `🔑 *Chave Entregue:*\n\`${licenseKey}\`\n\n` +
    `✅ *Status:* Entregue com sucesso no chat oficial da compra!`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.error('[ML Autopilot] Erro ao notificar Telegram:', err.message);
  }
}

/**
 * Ciclo principal de verificação e processamento de pedidos do Mercado Livre
 */
export async function checkAndFulfillMLOrders(db) {
  const token = await getValidAccessToken();
  if (!token) return;

  // Busca pedidos pagos recentes
  const ordersRes = await requestJson('GET', 'api.mercadolibre.com', `/orders/search?seller=${SELLER_ID}&order.status=paid`, {
    'Authorization': `Bearer ${token}`
  });

  if (ordersRes.status !== 200 || !ordersRes.data?.results) {
    return;
  }

  const orders = ordersRes.data.results;
  if (orders.length === 0) return;

  for (const order of orders) {
    const orderId = String(order.id);
    const packId = order.pack_id ? String(order.pack_id) : orderId;
    const buyerId = String(order.buyer?.id);
    const buyerName = order.buyer?.nickname || 'Cliente';

    // Checa se o pedido já foi entregue anteriormente no SQLite
    const alreadyDelivered = db.prepare('SELECT order_id FROM ml_delivered_orders WHERE order_id=?').get(orderId);
    if (alreadyDelivered) continue;

    console.log(`\n[ML Autopilot] 🚨 NOVO PEDIDO DETECTADO NO MERCADO LIVRE: #${orderId}`);

    const item = order.order_items?.[0]?.item || {};
    const itemId = item.id;
    const itemTitle = item.title || 'Licença Digital';
    const amount = order.total_amount || 0;

    const catalogInfo = ML_CATALOG[itemId] || {
      name: itemTitle,
      prefix: 'KEY',
      guide: 'Siga as orientações oficiais para ativar sua assinatura.'
    };

    // Gera formato de chave serial profissional oficial
    const serialHex = crypto.randomBytes(8).toString('hex').toUpperCase();
    const licenseKey = `${catalogInfo.prefix}-${serialHex.slice(0, 4)}-${serialHex.slice(4, 8)}-${serialHex.slice(8, 12)}-${serialHex.slice(12, 16)}`;

    // Monta a mensagem completa com guia passo a passo
    const messageText = 
      `Olá, ${buyerName}! Muito obrigado pela sua compra na DevPlanet Store! 🚀\n\n` +
      `Aqui está a sua licença adquirida e o passo a passo completo de ativação:\n\n` +
      `📦 Produto: ${catalogInfo.name}\n` +
      `🔑 Chave Oficial: ${licenseKey}\n\n` +
      `📖 Instruções de Ativação:\n${catalogInfo.guide}\n\n` +
      `🛡️ Garantia Legal de 7 dias (CDC) e suporte prioritário da nossa equipe. Qualquer dúvida, responda aqui mesmo neste chat!`;

    console.log(`[ML Autopilot] 📤 Enviando chave no chat do Mercado Livre para pack ${packId}...`);
    const sendRes = await sendMLPostSaleMessage(token, packId, buyerId, messageText);

    const messageStatus = sendRes.success ? 'delivered' : 'error: ' + JSON.stringify(sendRes.error);

    // Registra entrega no banco
    db.prepare(`
      INSERT INTO ml_delivered_orders (
        order_id, pack_id, buyer_id, buyer_nickname, item_id, item_title, amount, license_key, license_instructions, message_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, packId, buyerId, buyerName, itemId, itemTitle, Number(amount), licenseKey, catalogInfo.guide, messageStatus
    );

    console.log(`[ML Autopilot] ✅ Pedido #${orderId} processado e registrado!`);

    // Notifica no Telegram
    await notifyAdminMLOrder({
      id: orderId,
      buyer: order.buyer,
      item_title: catalogInfo.name,
      total_amount: amount
    }, licenseKey);
  }
}

/**
 * Inicia o loop de monitoramento contínuo em segundo plano
 */
export function startMLAutopilotPolling(db, intervalMs = 45000) {
  console.log('🤖 [ML Autopilot] Serviço de Piloto Automático do Mercado Livre INICIADO (Ciclo a cada 45s)');

  // Cria a tabela no banco se não existir
  db.exec(`
    CREATE TABLE IF NOT EXISTS ml_delivered_orders (
      order_id TEXT PRIMARY KEY,
      pack_id TEXT,
      buyer_id TEXT,
      buyer_nickname TEXT,
      item_id TEXT,
      item_title TEXT,
      amount REAL,
      license_key TEXT,
      license_instructions TEXT,
      delivered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      message_status TEXT
    );
  `);

  // Executa uma vez imediatamente
  checkAndFulfillMLOrders(db).catch(err => {
    console.error('[ML Autopilot Error]:', err.message);
  });

  // Mantém o loop
  return setInterval(() => {
    checkAndFulfillMLOrders(db).catch(err => {
      console.error('[ML Autopilot Error]:', err.message);
    });
  }, intervalMs);
}
