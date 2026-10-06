import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

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

const db = new DatabaseSync(path.join(DATA_DIR, 'app.db'));
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
`);

const KINDS = new Set(['clients', 'orders', 'stock', 'transactions', 'quotes', 'consigned', 'settings']);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

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
app.use('/api/public', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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
    notes: `Ref ${ref} · Comprador aceitou entrega digital em até 2h após a confirmação do pagamento. Confirmar o PIX antes de entregar.`,
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
app.use('/api', crud);

/* ---------- Front-end estático ---------- */
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));
