import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fulfillOrderLicense } from './licenseService.js';
import { startTelegramPolling, notifyAdminNewOrder } from './telegramService.js';
import { startWhatsAppService, getWhatsAppStatus, sendAutoWhatsAppMessage, fetchWhatsAppGroups, broadcastToWhatsAppGroups, searchPublicWhatsAppGroups, joinAndBroadcastPublicGroups } from './whatsappService.js';

import { initDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// JWT secret: env var or persisted random secret
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  const f = path.join(DATA_DIR, '.secret');
  if (fs.existsSync(f)) SECRET = fs.readFileSync(f, 'utf8');
  else { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(f, SECRET); }
}

const db = await initDatabase(path.join(DATA_DIR, 'app.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_records_user_kind ON records(user_id, kind);

  CREATE TABLE IF NOT EXISTS ecommerce_orders (
    id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount REAL NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    payment_method TEXT DEFAULT 'pix',
    payment_provider TEXT DEFAULT 'mercadopago',
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    qr_code TEXT,
    qr_code_base64 TEXT,
    ticket_url TEXT,
    license_key TEXT,
    license_instructions TEXT,
    telegram_message_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_eco_payment ON ecommerce_orders(payment_id);
  CREATE INDEX IF NOT EXISTS idx_eco_token ON ecommerce_orders(access_token);
  CREATE INDEX IF NOT EXISTS idx_eco_email ON ecommerce_orders(customer_email);
`);

const KINDS = new Set(['clients', 'orders', 'stock', 'transactions', 'quotes', 'consigned', 'settings']);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Healthcheck para Render / Monitoramento Uptime
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const sign = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '30d' });
const setCookie = (res, token) =>
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 864e5, secure: process.env.COOKIE_SECURE === '1' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email });

function auth(req, res, next) {
  try {
    const p = jwt.verify(req.cookies.token, SECRET);
    const u = db.prepare('SELECT id,name,email FROM users WHERE id=?').get(p.id);
    if (!u) throw new Error();
    req.user = u;
    next();
  } catch {
    res.status(401).json({ error: 'Não autenticado' });
  }
}

/* ---------- Auth ---------- */
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Preencha nome, e-mail e senha (mín. 6 caracteres).' });
  const mail = String(email).trim().toLowerCase();
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(mail))
    return res.status(409).json({ error: 'E-mail já cadastrado.' });
  const r = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)')
    .run(String(name).trim(), mail, bcrypt.hashSync(password, 10));
  const u = { id: Number(r.lastInsertRowid), name, email: mail };
  setCookie(res, sign(u));
  res.json(pub(u));
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').trim().toLowerCase());
  if (!u || !bcrypt.compareSync(password || '', u.password_hash))
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  setCookie(res, sign(u));
  res.json(pub(u));
});

app.post('/api/auth/logout', (_req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/auth/me', auth, (req, res) => res.json(req.user));
app.post('/api/auth/password', auth, (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 6) return res.status(400).json({ error: 'Senha muito curta (mín. 6).' });
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), req.user.id);
  res.json({ ok: true });
});

/* ---------- Loja pública (Vitrine) ---------- */
app.get('/api/public/store/:slug', (req, res) => {
  const rows = db.prepare(`SELECT user_id, data FROM records WHERE kind='settings'`).all();
  const hit = rows.find((r) => JSON.parse(r.data).storeSlug === req.params.slug);
  if (!hit) return res.status(404).json({ error: 'Loja não encontrada' });
  const s = JSON.parse(hit.data);
  const items = db.prepare(`SELECT id, data FROM records WHERE user_id=? AND kind='stock'`).all(hit.user_id)
    .map((r) => ({ id: r.id, ...JSON.parse(r.data) }))
    .filter((p) => p.type === 'produto' && p.showcase)
    .map(({ id, name, price, photo, notes, unit }) => ({ id, name, price, photo, notes, unit })); // nunca expor custo
  res.json({
    store: {
      name: s.storeName || 'Loja', description: s.storeDescription || '', whatsapp: s.whatsapp || '',
      theme: s.theme || 'meianoite', logo: s.storeLogo || '',
    },
    items,
  });
});

/* ---------- Checkout da loja online (site estático -> Flow) ---------- */
// CORS: defina ALLOWED_ORIGIN (ex.: https://devplanetprojectia.github.io) para restringir quem pode enviar pedidos.
app.use('/api', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const hits = new Map(); // limite simples: 10 pedidos/hora por IP
const limited = (ip) => {
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 36e5);
  h.push(now); hits.set(ip, h);
  return h.length > 10;
};
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const todayISO = () => new Date().toISOString().slice(0, 10);

// Total de vendas concluídas (pedidos da loja online marcados como "entregue" no Flow).
app.get('/api/public/store/:slug/stats', (req, res) => {
  const rows = db.prepare(`SELECT user_id, data FROM records WHERE kind='settings'`).all();
  const hit = rows.find((r) => JSON.parse(r.data).storeSlug === req.params.slug);
  if (!hit) return res.status(404).json({ error: 'Loja não encontrada' });
  const sales = db.prepare(`SELECT data FROM records WHERE user_id=? AND kind='orders'`).all(hit.user_id)
    .map((r) => JSON.parse(r.data)).filter((o) => o.origin === 'Loja online' && o.status === 'entregue').length;
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ sales });
});

app.post('/api/public/store/:slug/checkout', (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: 'Muitas tentativas. Tente mais tarde.' });
  const rows = db.prepare(`SELECT user_id, data FROM records WHERE kind='settings'`).all();
  const hit = rows.find((r) => JSON.parse(r.data).storeSlug === req.params.slug);
  if (!hit) return res.status(404).json({ error: 'Loja não encontrada' });

  const b = req.body || {};
  const name = clip(b.name, 120), email = clip(b.email, 120).toLowerCase(), phone = clip(b.phone, 20).replace(/\D/g, '');
  const product = clip(b.product, 120), ref = clip(b.ref, 40), total = Number(b.total);
  if (name.split(/\s+/).length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || phone.length < 10 || phone.length > 11 || !product || !(total >= 0) || b.consent !== true)
    return res.status(400).json({ error: 'Dados inválidos.' });

  const uid = hit.user_id;
  const ins = (kind, data) => db.prepare('INSERT INTO records(user_id,kind,data) VALUES(?,?,?)').run(uid, kind, JSON.stringify(data));
  let client = db.prepare(`SELECT id FROM records WHERE user_id=? AND kind='clients'`).all(uid)
    .find((r) => { const d = JSON.parse(db.prepare('SELECT data FROM records WHERE id=?').get(r.id).data); return (d.email || '').toLowerCase() === email || (d.phone || '').replace(/\D/g, '') === phone; });
  const clientId = client ? client.id : Number(ins('clients', { name, phone, email, country: 'Brasil', notes: 'Cadastrado pela loja online' }).lastInsertRowid);

  const due = todayISO();
  ins('orders', {
    client: name, clientId: String(clientId), ddi: '+55', phone, email, total, cost: 0, payment: 'pendente', paid: 0,
    origin: 'Loja online', owner: '', start: due, due, title: product,
    notes: `Ref ${ref} · Comprador aceitou entrega digital em até 24h após a confirmação do pagamento. Confirmar o PIX antes de entregar.`,
    photo: '', status: 'aguardando',
  });
  res.json({ ok: true });
});

/* ---------- CRUD genérico por usuário ---------- */
const crud = express.Router();
crud.use(auth);
crud.use('/:kind', (req, res, next) => (KINDS.has(req.params.kind) ? next() : res.status(404).json({ error: 'Recurso inexistente' })));

const row = (r) => ({ id: r.id, createdAt: r.created_at, updatedAt: r.updated_at, ...JSON.parse(r.data) });

crud.get('/:kind', (req, res) => {
  const rows = db.prepare('SELECT * FROM records WHERE user_id=? AND kind=? ORDER BY id DESC').all(req.user.id, req.params.kind);
  res.json(rows.map(row));
});
crud.post('/:kind', (req, res) => {
  const { id, createdAt, updatedAt, ...data } = req.body || {};
  const r = db.prepare('INSERT INTO records(user_id,kind,data) VALUES(?,?,?)').run(req.user.id, req.params.kind, JSON.stringify(data));
  res.json(row(db.prepare('SELECT * FROM records WHERE id=?').get(r.lastInsertRowid)));
});
crud.put('/:kind/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM records WHERE id=? AND user_id=? AND kind=?').get(req.params.id, req.user.id, req.params.kind);
  if (!cur) return res.status(404).json({ error: 'Não encontrado' });
  const { id, createdAt, updatedAt, ...data } = req.body || {};
  db.prepare(`UPDATE records SET data=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(JSON.stringify({ ...JSON.parse(cur.data), ...data }), cur.id);
  res.json(row(db.prepare('SELECT * FROM records WHERE id=?').get(cur.id)));
});
crud.delete('/:kind/:id', (req, res) => {
  db.prepare('DELETE FROM records WHERE id=? AND user_id=? AND kind=?').run(req.params.id, req.user.id, req.params.kind);
  res.json({ ok: true });
});

/* ---------- E-commerce, Mercado Pago & Área do Cliente ---------- */
const eco = express.Router();

// 1. Criar Checkout / Pagamento PIX Mercado Pago
eco.post('/checkout', async (req, res) => {
  try {
    const { name, email, phone, productId, productName, amount, paymentMethod } = req.body || {};
    if (!name || !email || !productId || !amount) {
      return res.status(400).json({ error: 'Dados incompletos para o checkout.' });
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const accessToken = crypto.randomBytes(16).toString('hex');
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    let paymentId = null;
    let qrCode = '';
    let qrCodeBase64 = '';
    let ticketUrl = '';
    let paymentStatus = 'pending';

    // Integração com Mercado Pago (se Access Token estiver configurado)
    let checkoutUrl = '';
    if (mpAccessToken && mpAccessToken.trim().length > 10) {
      try {
        const publicUrl = process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get('host')}`;

        // 1. Cria a Preferência do Mercado Pago (Permite Cartão de Crédito, PIX, Boleto)
        try {
          const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mpAccessToken.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{
                id: productId,
                title: productName || 'Assinatura Digital',
                quantity: 1,
                unit_price: Number(amount),
                currency_id: 'BRL'
              }],
              payer: {
                name: name.trim().split(' ')[0],
                surname: name.trim().split(' ').slice(1).join(' ') || 'Cliente',
                email: email.trim().toLowerCase()
              },
              statement_descriptor: 'DEVPLANET',
              external_reference: orderId,
              ...(publicUrl && publicUrl.startsWith('https://') ? {
                back_urls: {
                  success: `${publicUrl}/pedido.html?id=${orderId}&token=${accessToken}`,
                  failure: `${publicUrl}/pedido.html?id=${orderId}&token=${accessToken}`,
                  pending: `${publicUrl}/pedido.html?id=${orderId}&token=${accessToken}`
                },
                auto_return: 'approved',
                notification_url: `${publicUrl.replace(/\/$/, '')}/api/ecommerce/webhooks/mercadopago`
              } : {})
            })
          });

          const prefData = await prefRes.json();
          if (prefRes.ok && prefData.init_point) {
            checkoutUrl = prefData.init_point;
            ticketUrl = prefData.init_point;
          } else {
            console.warn('[MercadoPago Preference Info]:', prefData);
          }
        } catch (prefErr) {
          console.warn('[MercadoPago Preference Warning]:', prefErr.message);
        }

        // 2. Tenta gerar PIX Transparente direto (se chave PIX estiver ativada na conta)
        const mpPayload = {
          transaction_amount: Number(amount),
          description: productName || 'Assinatura Digital',
          payment_method_id: 'pix',
          statement_descriptor: 'DEVPLANET',
          payer: {
            email: email.trim().toLowerCase(),
            first_name: name.trim().split(' ')[0],
            last_name: name.trim().split(' ').slice(1).join(' ') || 'Cliente'
          },
          external_reference: orderId,
          ...(publicUrl && publicUrl.startsWith('https://') ? { notification_url: `${publicUrl.replace(/\/$/, '')}/api/ecommerce/webhooks/mercadopago` } : {})
        };

        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpAccessToken.trim()}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': orderId
          },
          body: JSON.stringify(mpPayload)
        });

        const mpData = await mpRes.json();
        if (mpRes.ok && mpData.id) {
          paymentId = String(mpData.id);
          paymentStatus = mpData.status || 'pending';
          const txData = mpData.point_of_interaction?.transaction_data;
          qrCode = txData?.qr_code || '';
          qrCodeBase64 = txData?.qr_code_base64 || '';
          ticketUrl = txData?.ticket_url || ticketUrl;
        } else {
          console.warn('[MercadoPago Info] PIX direto não habilitado na conta, usando Checkout Pro oficial:', mpData.message);
        }
      } catch (mpErr) {
        console.error('[MercadoPago Error]:', mpErr.message);
      }
    }

    // Se ainda não gerou QR Code (ambiente de testes/sem token):
    if (!qrCode) {
      qrCode = `00020126580014BR.GOV.BCB.PIX0136${orderId}520400005303986540${Number(amount).toFixed(2)}5802BR5913DEVPLLANET6009SAOPAULO62070503***6304SIMU`;
    }

    // Salva o pedido no banco de dados
    db.prepare(`
      INSERT INTO ecommerce_orders (
        id, access_token, product_id, product_name, amount,
        customer_name, customer_email, customer_phone,
        payment_method, payment_id, status, qr_code, qr_code_base64, ticket_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, accessToken, productId, productName || productId, Number(amount),
      name.trim(), email.trim().toLowerCase(), phone ? phone.replace(/\D/g, '') : '',
      paymentMethod || 'pix', paymentId, paymentStatus, qrCode, qrCodeBase64, ticketUrl
    );

    res.json({
      success: true,
      orderId,
      accessToken,
      status: paymentStatus,
      qrCode,
      qrCodeBase64,
      ticketUrl: ticketUrl || checkoutUrl,
      checkoutUrl,
      isSandbox: !paymentId && !checkoutUrl
    });
  } catch (err) {
    console.error('[Checkout Error]:', err);
    res.status(500).json({ error: 'Erro ao processar o checkout.' });
  }
});

// 2. Consultar Pedido (Área do Cliente com Token Seguro)
eco.get('/orders/:id', (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  const order = db.prepare('SELECT * FROM ecommerce_orders WHERE id=?').get(id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  if (token && order.access_token !== token) {
    return res.status(403).json({ error: 'Acesso não autorizado para este pedido.' });
  }

  res.json({
    id: order.id,
    productId: order.product_id,
    productName: order.product_name,
    amount: order.amount,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    paymentMethod: order.payment_method,
    status: order.status,
    qrCode: order.qr_code,
    qrCodeBase64: order.qr_code_base64,
    ticketUrl: order.ticket_url,
    licenseKey: order.status === 'delivered' ? order.license_key : null,
    licenseInstructions: order.status === 'delivered' ? order.license_instructions : null,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  });
});

// 3. Consultar Pedidos por E-mail (Para o cliente recuperar suas licenças)
eco.get('/customer-orders', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Informe o e-mail.' });

  const rows = db.prepare('SELECT id, product_name, amount, status, access_token, created_at FROM ecommerce_orders WHERE customer_email=? ORDER BY id DESC').all(email.trim().toLowerCase());
  res.json({ orders: rows });
});

// 4. Webhook do Mercado Pago (Recebe notificação de pagamento aprovado)
eco.post('/webhooks/mercadopago', async (req, res) => {
  try {
    const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id;
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (paymentId && mpAccessToken) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken.trim()}` }
      });
      const paymentData = await mpRes.json();

      if (paymentData.status === 'approved') {
        const order = db.prepare('SELECT * FROM ecommerce_orders WHERE payment_id=? OR id=?').get(String(paymentId), paymentData.external_reference);
        if (order && order.status !== 'delivered') {
          db.prepare("UPDATE ecommerce_orders SET status='approved', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(order.id);
          const updatedOrder = db.prepare('SELECT * FROM ecommerce_orders WHERE id=?').get(order.id);
          await notifyAdminNewOrder(updatedOrder);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook Error]:', err);
    res.status(200).json({ received: true });
  }
});

// 5. Simular Pagamento (Para testes no painel)
eco.post('/orders/:id/simulate-payment', async (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM ecommerce_orders WHERE id=?').get(id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  db.prepare("UPDATE ecommerce_orders SET status='approved', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(order.id);
  const updatedOrder = db.prepare('SELECT * FROM ecommerce_orders WHERE id=?').get(order.id);
  await notifyAdminNewOrder(updatedOrder);
  res.json({ success: true, message: 'Pagamento aprovado e alerta enviado ao Telegram do administrador!' });
});

// 6. Entregar Licença (Web, API ou Painel)
eco.post('/orders/:id/deliver', async (req, res) => {
  const { id } = req.params;
  const { licenseKey } = req.body || {};
  if (!licenseKey) return res.status(400).json({ error: 'Informe a chave da licença.' });

  const order = db.prepare('SELECT * FROM ecommerce_orders WHERE id=?').get(id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  const prodInfo = PRODUCT_INSTRUCTIONS[order.product_id] || { guide: 'Siga as instruções com sua chave para ativar.' };
  db.prepare("UPDATE ecommerce_orders SET status='delivered', license_key=?, license_instructions=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(licenseKey.trim(), prodInfo.guide, order.id);

  // Disparo automático pelo WhatsApp
  const waText = 
    `Olá, ${order.customer_name}! 🚀\n` +
    `Aqui está a sua licença adquirida na DevPlanet Store:\n\n` +
    `📦 *Produto:* ${order.product_name}\n` +
    `🔑 *Chave de Ativação:*\n${licenseKey.trim()}\n\n` +
    `📖 *Instruções de Ativação:*\n${prodInfo.guide}\n\n` +
    `Qualquer dúvida ou suporte, estou à disposição aqui na conversa!`;
  const waResult = await sendAutoWhatsAppMessage(order.customer_phone, waText);

  res.json({ success: true, status: 'delivered', whatsappSent: waResult.success });
});

// 7. Status do WhatsApp Web (para pareamento via QR Code)
app.get('/api/whatsapp/status', (_req, res) => {
  res.json(getWhatsAppStatus());
});

// 8. Buscar Grupos do WhatsApp do usuário
app.get('/api/whatsapp/groups', async (_req, res) => {
  const result = await fetchWhatsAppGroups();
  res.json(result);
});

// 9. Disparo Seguro em Grupos de WhatsApp (Marketing Automatizado com Anti-Ban)
app.post('/api/whatsapp/broadcast', async (req, res) => {
  const { groupJids, text, delaySeconds } = req.body || {};
  if (!Array.isArray(groupJids) || groupJids.length === 0 || !text) {
    return res.status(400).json({ error: 'Informe os grupos (groupJids) e o texto da mensagem.' });
  }
  const result = await broadcastToWhatsAppGroups(groupJids, text, delaySeconds || 20);
  res.json(result);
});

// 10. Buscar Grupos Públicos da Internet por Nicho (Prospecção de Novos Grupos)
app.get('/api/whatsapp/public-groups', async (req, res) => {
  const { niche } = req.query;
  const result = await searchPublicWhatsAppGroups(niche || 'all');
  res.json(result);
});

// 11. Entrar em Novos Grupos Públicos e Disparar Mensagem com Anti-Ban
app.post('/api/whatsapp/join-and-broadcast', async (req, res) => {
  const { inviteCodes, text, delaySeconds } = req.body || {};
  if (!Array.isArray(inviteCodes) || inviteCodes.length === 0 || !text) {
    return res.status(400).json({ error: 'Informe os links/códigos dos grupos e o texto da mensagem.' });
  }
  const result = await joinAndBroadcastPublicGroups(inviteCodes, text, delaySeconds || 25);
  res.json(result);
});

app.use('/api/ecommerce', eco);
app.use('/api', crud);

/* ---------- Front-end estático ---------- */
const rootDir = path.join(__dirname, '..', '..');
const dist = path.join(__dirname, '..', 'client', 'dist');

// Serve a loja raiz (index.html, pedido.html, whatsapp.html, style.css, etc.)
app.use(express.static(rootDir));

if (fs.existsSync(dist)) {
  app.use('/flow', express.static(dist));
}

app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
  startTelegramPolling(db);
  startWhatsAppService();

  // Keep-alive automático para evitar que o Render entre em modo de espera (sleep após 15 min)
  const keepAliveUrl = process.env.PUBLIC_BACKEND_URL;
  if (keepAliveUrl && keepAliveUrl.startsWith('https://')) {
    const PING_MS = 9 * 60 * 1000; // 9 minutos
    console.log(`[KeepAlive] Ativado a cada 9 minutos para: ${keepAliveUrl}`);
    setInterval(async () => {
      try {
        const pingRes = await fetch(`${keepAliveUrl.replace(/\/$/, '')}/api/health`);
        if (pingRes.ok) {
          console.log(`[KeepAlive] Ping executado com sucesso: ${new Date().toISOString()}`);
        }
      } catch (err) {
        console.warn(`[KeepAlive Aviso]:`, err.message);
      }
    }, PING_MS);
  }
});
