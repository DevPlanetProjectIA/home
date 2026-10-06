import React, { useEffect, useState } from 'react';
import { Field } from '../components/ui.jsx';
import { useAuth, useCurrency, useSettings, useToast, CURRENCIES } from '../lib/ctx.jsx';
import { api } from '../lib/api.js';

export default function Settings() {
  const { user } = useAuth();
  const { settings, save, loading } = useSettings();
  const { code, setCode } = useCurrency();
  const toast = useToast();
  const [f, setF] = useState({ name: '', contactEmail: '', pix: '', alertDays: 3, showAlerts: true });
  const [pw, setPw] = useState({ next: '', confirm: '' });
  useEffect(() => { if (!loading) setF((x) => ({ ...x, name: user.name, contactEmail: user.email, ...settings })); }, [loading, settings, user]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const changePw = async () => {
    if (pw.next.length < 6) return toast('Mínimo 6 caracteres', 'err');
    if (pw.next !== pw.confirm) return toast('As senhas não conferem', 'err');
    try { await api.post('/api/auth/password', { password: pw.next }); setPw({ next: '', confirm: '' }); toast('Senha alterada'); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="card space-y-4">
        <div><h3 className="font-semibold">Configurações Gerais</h3><p className="text-sm text-muted-foreground">Ajuste nome, aviso de prazo, chave PIX e senha.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Seu nome ou nome do estúdio"><input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Email de contato"><input className="input" value={f.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
          <Field label="Chave PIX para pagamentos" hint="Esta chave será usada nas mensagens do WhatsApp para clientes."><input className="input" value={f.pix || ''} onChange={(e) => set('pix', e.target.value)} /></Field>
          <Field label="Dias de aviso de prazo" hint="Quantos dias antes do prazo devemos te alertar?"><input type="number" min="0" className="input" value={f.alertDays} onChange={(e) => set('alertDays', Number(e.target.value))} /></Field>
        </div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={f.showAlerts !== false} onChange={(e) => set('showAlerts', e.target.checked)} />Alertas de prazo no painel — mostrar avisos para prazos próximos</label>
        <button className="btn-primary" onClick={() => save(f).then(() => toast('Configurações salvas')).catch((e) => toast(e.message, 'err'))}>Salvar</button>
      </div>
      <div className="card space-y-3">
        <h3 className="font-semibold">Idioma e Moeda</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Idioma preferido"><select className="input" disabled><option>🇧🇷 PT-BR</option></select></Field>
          <Field label="Moeda preferida"><select className="input" value={code} onChange={(e) => setCode(e.target.value)}>{Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
        </div>
      </div>
      <div className="card space-y-3">
        <h3 className="font-semibold">Alterar Senha</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nova senha"><input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Confirmar senha"><input type="password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </div>
        <button className="btn-ghost" onClick={changePw}>Alterar Senha</button>
      </div>
    </div>
  );
}
