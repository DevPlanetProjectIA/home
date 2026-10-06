import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

/* ---------- Auth ---------- */
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = carregando
  useEffect(() => { api.get('/api/auth/me').then(setUser).catch(() => setUser(null)); }, []);
  const login = async (email, password) => setUser(await api.post('/api/auth/login', { email, password }));
  const register = async (name, email, password) => setUser(await api.post('/api/auth/register', { name, email, password }));
  const logout = async () => { await api.post('/api/auth/logout'); setUser(null); };
  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

/* ---------- Moeda ---------- */
export const CURRENCIES = {
  BRL: { label: 'Real (R$)', symbol: 'R$', locale: 'pt-BR' },
  USD: { label: 'Dólar (US$)', symbol: 'US$', locale: 'en-US' },
  EUR: { label: 'Euro (€)', symbol: '€', locale: 'de-DE' },
};
const CurCtx = createContext(null);
export const useCurrency = () => useContext(CurCtx);

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(() => localStorage.getItem('currency') || 'BRL');
  useEffect(() => { localStorage.setItem('currency', code); }, [code]);
  const c = CURRENCIES[code];
  const fmt = useCallback((n) => new Intl.NumberFormat(c.locale, { style: 'currency', currency: code }).format(Number(n) || 0), [code]);
  return <CurCtx.Provider value={{ code, setCode, fmt, symbol: c.symbol }}>{children}</CurCtx.Provider>;
}

/* ---------- Coleções (CRUD) ---------- */
export function useCollection(kind) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.get(`/api/${kind}`)); } finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { load(); }, [load]);

  const create = async (d) => { const r = await api.post(`/api/${kind}`, d); setItems((x) => [r, ...x]); return r; };
  const update = async (id, d) => { const r = await api.put(`/api/${kind}/${id}`, d); setItems((x) => x.map((i) => (i.id === id ? r : i))); return r; };
  const remove = async (id) => { await api.del(`/api/${kind}/${id}`); setItems((x) => x.filter((i) => i.id !== id)); };
  return { items, loading, reload: load, create, update, remove };
}

/* ---------- Configurações do usuário (registro único) ---------- */
export function useSettings() {
  const { items, loading, create, update } = useCollection('settings');
  const cur = items[0] || {};
  const save = (d) => (items[0] ? update(items[0].id, d) : create(d));
  return { settings: cur, loading, save };
}

/* ---------- Toast simples ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text, type = 'ok') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 2800); }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className={`fixed bottom-5 right-5 z-[100] rounded-lg border px-4 py-3 text-sm shadow-xl ${msg.type === 'err' ? 'border-destructive/50 bg-destructive/20' : 'border-success/40 bg-success/15'}`}>
          {msg.text}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
