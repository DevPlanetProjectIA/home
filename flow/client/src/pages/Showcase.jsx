import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, MessageCircle, Store } from 'lucide-react';
import { Tabs } from '../components/Crud.jsx';
import { Field } from '../components/ui.jsx';
import { useCollection, useCurrency, useSettings, useToast } from '../lib/ctx.jsx';
import { api } from '../lib/api.js';
import { waLink } from '../lib/util.js';

export const THEMES = {
  meianoite: { label: 'Meia-noite', bg: '#0b1120', fg: '#e2e8f0', card: '#131c31', accent: '#3b82f6' },
  pedra: { label: 'Pedra clara', bg: '#f4f4f5', fg: '#18181b', card: '#ffffff', accent: '#52525b' },
  rose: { label: 'Rosé suave', bg: '#fff1f2', fg: '#4c0519', card: '#ffffff', accent: '#e11d48' },
  floresta: { label: 'Floresta', bg: '#0f1f17', fg: '#dcfce7', card: '#173224', accent: '#22c55e' },
  areia: { label: 'Areia quente', bg: '#fdf6e3', fg: '#3f2e12', card: '#fffaf0', accent: '#d97706' },
};

export default function Showcase() {
  const { settings, save } = useSettings();
  const stock = useCollection('stock');
  const { fmt } = useCurrency();
  const toast = useToast();
  const [tab, setTab] = useState('config');
  const [f, setF] = useState(null);
  useEffect(() => { if (f === null && settings) setF({ theme: 'meianoite', ...settings }); }, [settings, f]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const slug = (f.storeSlug || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const url = `${location.origin}/v/${slug}`;

  const publish = async () => {
    for (const [k, l] of [['storeName', 'Nome da vitrine'], ['storeSlug', 'URL personalizada'], ['ownerName', 'Nome completo'], ['ownerPhone', 'Telefone'], ['ownerEmail', 'E-mail'], ['ownerDoc', 'CPF ou CNPJ']])
      if (!String(f[k] || '').trim()) return toast(`Preencha: ${l}`, 'err');
    try { await save({ ...f, storeSlug: slug }); toast('Vitrine salva'); } catch (e) { toast(e.message, 'err'); }
  };
  const logo = (file) => { if (!file || file.size > 1e6) return; const r = new FileReader(); r.onload = () => set('storeLogo', r.result); r.readAsDataURL(file); };
  const products = stock.items.filter((s) => s.type === 'produto');

  return (
    <div>
      <p className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">Vitrine é uma página pública para divulgar seus produtos. Visitantes entram em contato direto com você — o site não realiza vendas.</p>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'config', label: 'Configuração' }, { id: 'produtos', label: 'Produtos' }]} />
      {tab === 'config' ? (
        <div className="card max-w-3xl space-y-5">
          <div><h3 className="font-semibold">Dados da vitrine</h3><p className="text-sm text-muted-foreground">Informações que aparecem publicamente na sua página.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da vitrine *"><input className="input" value={f.storeName || ''} onChange={(e) => set('storeName', e.target.value)} /></Field>
            <Field label="URL personalizada *" hint={slug && url}><div className="flex items-center gap-1 text-xs text-muted-foreground"><span>/v/</span><input className="input" value={f.storeSlug || ''} onChange={(e) => set('storeSlug', e.target.value)} /></div></Field>
            <Field label="WhatsApp para contato"><input className="input" placeholder="5561999990000" value={f.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
            <Field label="Logo da vitrine (opcional)"><input type="file" accept="image/*" className="text-sm" onChange={(e) => logo(e.target.files[0])} />{f.storeLogo && <img src={f.storeLogo} className="mt-2 h-14 rounded" alt="" />}</Field>
          </div>
          <Field label="Descrição curta (opcional)"><textarea rows={2} className="input" value={f.storeDescription || ''} onChange={(e) => set('storeDescription', e.target.value)} /></Field>
          <div>
            <p className="label">Tema de cores</p><p className="mb-2 text-xs text-muted-foreground">Escolha a paleta que combina com sua marca.</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(THEMES).map(([k, t]) => (
                <button key={k} onClick={() => set('theme', k)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${f.theme === k ? 'border-primary bg-primary/10' : ''}`}>
                  <i className="h-4 w-4 rounded-full border" style={{ background: t.bg }} /><i className="-ml-3 h-4 w-4 rounded-full border" style={{ background: t.accent }} />{t.label}
                </button>))}
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold">Dados internos do responsável</h3><p className="mb-3 text-sm text-muted-foreground">Estes dados não aparecem publicamente.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {[['ownerName', 'Nome completo *'], ['ownerPhone', 'Telefone *'], ['ownerEmail', 'E-mail *'], ['ownerDoc', 'CPF ou CNPJ *']].map(([k, l]) => <Field key={k} label={l}><input className="input" value={f[k] || ''} onChange={(e) => set(k, e.target.value)} /></Field>)}
            </div>
          </div>
          <div className="flex gap-3"><button className="btn-primary" onClick={publish}><Store size={16} />Salvar e publicar</button>{settings.storeSlug && <a className="btn-ghost" href={`/v/${settings.storeSlug}`} target="_blank" rel="noreferrer"><ExternalLink size={16} />Abrir vitrine</a>}</div>
        </div>
      ) : (
        <div className="card">
          <h3 className="mb-3 font-semibold">Produtos exibidos na vitrine</h3>
          {products.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Cadastre produtos no Estoque para exibi-los aqui.</p> :
            products.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-border/30 py-2.5">
                <input type="checkbox" checked={!!p.showcase} onChange={(e) => stock.update(p.id, { showcase: e.target.checked })} />
                {p.photo && <img src={p.photo} className="h-10 w-10 rounded object-cover" alt="" />}
                <span className="flex-1">{p.name}</span><span className="text-sm text-muted-foreground">{fmt(p.price)}</span>
              </label>))}
        </div>
      )}
    </div>
  );
}

export function PublicStore() {
  const { slug } = useParams();
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { api.get(`/api/public/store/${slug}`).then(setD).catch((e) => setErr(e.message)); }, [slug]);
  if (err) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Vitrine não encontrada.</div>;
  if (!d) return null;
  const t = THEMES[d.store.theme] || THEMES.meianoite;
  const money = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
  return (
    <div className="min-h-screen px-5 py-10" style={{ background: t.bg, color: t.fg }}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          {d.store.logo && <img src={d.store.logo} alt="" className="mx-auto mb-3 h-16" />}
          <h1 className="text-3xl font-extrabold">{d.store.name}</h1>
          {d.store.description && <p className="mt-2 opacity-80">{d.store.description}</p>}
        </header>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {d.items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl shadow" style={{ background: t.card }}>
              {p.photo ? <img src={p.photo} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full opacity-10" style={{ background: t.accent }} />}
              <div className="p-3">
                <p className="font-semibold">{p.name}</p>
                <p className="mb-2 font-bold" style={{ color: t.accent }}>{money(p.price)}</p>
                {d.store.whatsapp && <a className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: t.accent }} target="_blank" rel="noreferrer"
                  href={waLink(d.store.whatsapp, `Olá! Tenho interesse em: ${p.name}`)}><MessageCircle size={14} />Tenho interesse</a>}
              </div>
            </div>))}
        </div>
        {d.items.length === 0 && <p className="text-center opacity-60">Nenhum produto disponível.</p>}
      </div>
    </div>
  );
}
