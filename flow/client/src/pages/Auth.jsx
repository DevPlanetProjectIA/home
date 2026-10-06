import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/ctx.jsx';
import { Logo } from '../components/Layout.jsx';
import { BRAND } from '../lib/nav.js';

export default function Auth() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'login') await login(f.email, f.password); else await register(f.name, f.email, f.password);
      nav('/');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'radial-gradient(60% 50% at 50% 0%, hsl(217 91% 60% / .18), transparent)' }}>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 bg-popover p-7">
        <div className="flex flex-col items-center gap-1 pb-2"><Logo size={48} /><p className="text-sm text-muted-foreground">{BRAND.tagline}</p></div>
        {mode === 'register' && <div><label className="label">Nome</label><input className="input" value={f.name} onChange={set('name')} required /></div>}
        <div><label className="label">E-mail</label><input type="email" className="input" value={f.email} onChange={set('email')} required /></div>
        <div><label className="label">Senha</label><input type="password" className="input" value={f.password} onChange={set('password')} minLength={6} required /></div>
        {err && <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </div>
  );
}
