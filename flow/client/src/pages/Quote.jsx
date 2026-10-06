import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { useLocation } from 'react-router-dom';
import { FileDown, MessageCircle, Plus, Trash2, Package } from 'lucide-react';
import { Field, Modal } from '../components/ui.jsx';
import { useAuth, useCollection, useCurrency, useSettings, useToast } from '../lib/ctx.jsx';
import { num, waLink, fmtDate, today } from '../lib/util.js';

const item = () => ({ name: '', qty: 1, desc: '', price: '', disc: '' });

export default function Quote() {
  const clients = useCollection('clients');
  const stock = useCollection('stock');
  const quotes = useCollection('quotes');
  const { user } = useAuth();
  const { settings: st } = useSettings();
  const settings = { ...st, name: st.name || user.name };
  const { fmt, code } = useCurrency();
  const toast = useToast();
  const location = useLocation();
  const prefill = location.state?.item;
  const [f, setF] = useState({ logo: '', number: '', validity: 7, seller: '', sellerPhone: '', client: '', ddi: '+55', phone: '', email: '', doc: '', delivery: 'Sem prazo', items: [prefill ? { ...item(), ...prefill } : item()], discType: '%', discount: '', shipping: '', notes: '' });
  const [imp, setImp] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setItem = (i, k, v) => set('items', f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  const lineTotal = (it) => Math.max(0, num(it.qty) * num(it.price) * (1 - num(it.disc) / 100));
  const subtotal = f.items.reduce((s, it) => s + lineTotal(it), 0);
  const disc = f.discType === '%' ? subtotal * (num(f.discount) / 100) : num(f.discount);
  const total = Math.max(0, subtotal - disc + num(f.shipping));

  const pickClient = (id) => { const c = clients.items.find((x) => String(x.id) === id); if (c) setF((x) => ({ ...x, client: c.name, phone: c.phone || '', email: c.email || '', doc: c.doc || '' })); };
  const logo = (file) => { if (!file) return; const r = new FileReader(); r.onload = () => set('logo', r.result); r.readAsDataURL(file); };

  const valid = () => { if (!f.seller.trim() && !settings.name) { toast('Informe o nome da empresa/vendedor', 'err'); return false; } if (!f.client.trim()) { toast('Informe o nome do cliente', 'err'); return false; } if (!f.items.some((i) => i.name.trim())) { toast('Adicione ao menos um item', 'err'); return false; } return true; };

  const pdf = async () => {
    if (!valid()) return;
    const d = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210; let y = 18;
    const seller = f.seller || settings.name;
    if (f.logo) { try { d.addImage(f.logo, 'PNG', 15, 12, 24, 24); } catch {} }
    d.setFont('helvetica', 'bold').setFontSize(18).text('ORÇAMENTO', W - 15, y, { align: 'right' });
    d.setFont('helvetica', 'normal').setFontSize(10).setTextColor(100);
    d.text(`${f.number ? 'Nº ' + f.number + ' · ' : ''}${fmtDate(today())} · Validade: ${f.validity} dias`, W - 15, y + 6, { align: 'right' });
    y = 44; d.setTextColor(0).setFont('helvetica', 'bold').setFontSize(11).text(seller, 15, y);
    d.setFont('helvetica', 'normal').setFontSize(10).text(f.sellerPhone || '', 15, y + 5);
    d.setFont('helvetica', 'bold').text('Cliente', 110, y); d.setFont('helvetica', 'normal');
    [f.client, f.doc, f.email, f.phone && `${f.ddi} ${f.phone}`].filter(Boolean).forEach((t, i) => d.text(String(t), 110, y + 5 + i * 5));
    y += 32; d.setFillColor(30, 41, 59).rect(15, y, W - 30, 8, 'F'); d.setTextColor(255).setFont('helvetica', 'bold').setFontSize(9);
    d.text('Item', 18, y + 5.5); d.text('Qtd', 115, y + 5.5); d.text('Unit.', 138, y + 5.5); d.text('Desc.', 162, y + 5.5); d.text('Total', W - 18, y + 5.5, { align: 'right' });
    y += 8; d.setTextColor(0).setFont('helvetica', 'normal');
    f.items.filter((i) => i.name.trim()).forEach((it) => {
      if (y > 260) { d.addPage(); y = 20; }
      d.setFontSize(10).text(it.name, 18, y + 6); if (it.desc) d.setFontSize(8).setTextColor(110).text(it.desc.slice(0, 70), 18, y + 10.5).setTextColor(0);
      d.setFontSize(10).text(String(it.qty), 115, y + 6); d.text(fmt(num(it.price)), 138, y + 6); d.text(it.disc ? it.disc + '%' : '-', 162, y + 6); d.text(fmt(lineTotal(it)), W - 18, y + 6, { align: 'right' });
      d.setDrawColor(220).line(15, y + 13, W - 15, y + 13); y += 14;
    });
    y += 4; const line = (l, v, b) => { d.setFont('helvetica', b ? 'bold' : 'normal').setFontSize(b ? 12 : 10).text(l, 135, y).text(v, W - 15, y, { align: 'right' }); y += b ? 8 : 6; };
    line('Subtotal', fmt(subtotal)); if (disc) line('Desconto', '- ' + fmt(disc)); if (num(f.shipping)) line('Frete', fmt(num(f.shipping))); line('Total', fmt(total), true);
    y += 4; d.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90);
    if (f.delivery && f.delivery !== 'Sem prazo') d.text(`Prazo de entrega: ${f.delivery}`, 15, y), (y += 5);
    if (settings.pix) d.text(`Chave PIX: ${settings.pix}`, 15, y), (y += 5);
    if (f.notes) d.text(d.splitTextToSize(f.notes, W - 30), 15, y);
    d.save(`orcamento-${(f.number || f.client).replace(/\W+/g, '_')}.pdf`);
    quotes.create({ ...f, total, currency: code, date: today() }).catch(() => {});
    toast('PDF gerado');
  };

  const whats = () => {
    if (!valid()) return;
    const lines = f.items.filter((i) => i.name.trim()).map((i) => `• ${i.qty}x ${i.name} — ${fmt(lineTotal(i))}`).join('\n');
    const msg = `Olá ${f.client}! Segue seu orçamento${f.number ? ' ' + f.number : ''}:\n\n${lines}\n\n*Total: ${fmt(total)}*\nValidade: ${f.validity} dias.` + (settings.pix ? `\nPIX: ${settings.pix}` : '');
    window.open(waLink(f.ddi + f.phone, msg), '_blank');
  };

  return (
    <div className="card mx-auto max-w-4xl space-y-5">
      <div className="grid gap-4 md:grid-cols-[130px_1fr]">
        <Field label="Logo (opcional)">
          <label className="flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-xs text-muted-foreground hover:bg-secondary/40">
            {f.logo ? <img src={f.logo} className="h-full w-full object-contain" alt="" /> : 'Adicionar'}<input type="file" accept="image/*" className="hidden" onChange={(e) => logo(e.target.files[0])} />
          </label>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nº do Orçamento (opcional)"><input className="input" placeholder="Ex: ORC-001" value={f.number} onChange={(e) => set('number', e.target.value)} /></Field>
          <Field label="Validade (dias)"><input type="number" className="input" value={f.validity} onChange={(e) => set('validity', e.target.value)} /></Field>
          <Field label="Nome da empresa / vendedor *"><input className="input" placeholder="Ex.: Estúdio 3D do Bruno" value={f.seller || settings.name || ''} onChange={(e) => set('seller', e.target.value)} /></Field>
          <Field label="Telefone do vendedor (opcional)"><input className="input" placeholder="Ex: (11) 99999-9999" value={f.sellerPhone} onChange={(e) => set('sellerPhone', e.target.value)} /></Field>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
        <p className="mb-2 text-sm font-semibold">Cliente cadastrado <span className="text-xs font-normal text-muted-foreground">(opcional)</span></p>
        <select className="input" defaultValue="" onChange={(e) => pickClient(e.target.value)}><option value="">Buscar cliente...</option>{clients.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do cliente *"><input className="input" placeholder="Ex.: João da Silva" value={f.client} onChange={(e) => set('client', e.target.value)} /></Field>
        <Field label="WhatsApp do cliente"><div className="flex gap-2"><select className="input !w-24" value={f.ddi} onChange={(e) => set('ddi', e.target.value)}>{['+55', '+1', '+351', '+34'].map((x) => <option key={x}>{x}</option>)}</select><input className="input" placeholder="Ex.: (61) 99999-0000" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div></Field>
        <Field label="E-mail do cliente"><input className="input" placeholder="cliente@email.com" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="CPF / CNPJ"><input className="input" placeholder="000.000.000-00" value={f.doc} onChange={(e) => set('doc', e.target.value)} /></Field>
        <Field label="Prazo de entrega"><select className="input" value={f.delivery} onChange={(e) => set('delivery', e.target.value)}>{['Sem prazo', '3 dias', '5 dias', '7 dias', '10 dias', '15 dias', '30 dias'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="label !mb-0">Itens</p>
          <div className="flex gap-2"><button className="btn-ghost !py-1.5 text-xs" onClick={() => setImp(true)}><Package size={14} />Importar do Estoque</button><button className="btn-primary !py-1.5 text-xs" onClick={() => set('items', [...f.items, item()])}><Plus size={14} />Adicionar item</button></div>
        </div>
        <div className="space-y-3">
          {f.items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 rounded-xl border bg-muted/20 p-3">
              <input className="input col-span-12 md:col-span-6" placeholder="Nome do item" value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
              <input className="input col-span-4 md:col-span-2" type="number" min="1" placeholder="Qtd" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} />
              <input className="input col-span-4 md:col-span-2" placeholder="Preço unit." value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} />
              <input className="input col-span-4 md:col-span-2" placeholder="Desc. %" value={it.disc} onChange={(e) => setItem(i, 'disc', e.target.value)} />
              <input className="input col-span-10 md:col-span-10" placeholder="Descrição (opcional)" value={it.desc} onChange={(e) => setItem(i, 'desc', e.target.value)} />
              <div className="col-span-2 flex items-center justify-end gap-2 text-sm"><b>{fmt(lineTotal(it))}</b>{f.items.length > 1 && <button onClick={() => set('items', f.items.filter((_, j) => j !== i))} className="text-destructive"><Trash2 size={15} /></button>}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Desconto"><div className="flex gap-2"><select className="input !w-40" value={f.discType} onChange={(e) => set('discType', e.target.value)}><option value="%">Porcentagem (%)</option><option value="$">Valor fixo</option></select><input className="input" placeholder="0" value={f.discount} onChange={(e) => set('discount', e.target.value)} /></div></Field>
        <Field label="Frete (opcional)"><input className="input" placeholder="0,00" value={f.shipping} onChange={(e) => set('shipping', e.target.value)} /></Field>
      </div>
      <div className="ml-auto max-w-xs space-y-1 rounded-xl border bg-muted/20 p-4 text-sm">
        <p className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span>{fmt(subtotal)}</p>
        {disc > 0 && <p className="flex justify-between"><span className="text-muted-foreground">Desconto:</span>- {fmt(disc)}</p>}
        <p className="flex justify-between text-lg font-bold"><span>Total:</span><span className="text-primary">{fmt(total)}</span></p>
      </div>
      <Field label="Observações"><textarea rows={3} className="input" placeholder="Informações adicionais, formas de pagamento, etc." value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="flex flex-wrap gap-3"><button onClick={pdf} className="btn-primary"><FileDown size={16} />Gerar PDF</button><button onClick={whats} className="btn-ghost !border-success/50 text-success"><MessageCircle size={16} />Enviar WhatsApp</button></div>

      <Modal open={imp} onClose={() => setImp(false)} title="Importar do Estoque">
        {stock.items.filter((s) => s.type === 'produto').length === 0 ? <p className="text-sm text-muted-foreground">Nenhum produto no estoque.</p> :
          stock.items.filter((s) => s.type === 'produto').map((p) => (
            <button key={p.id} className="flex w-full justify-between border-b border-border/30 p-2.5 text-left text-sm hover:bg-secondary/50"
              onClick={() => { set('items', [...f.items.filter((i) => i.name.trim()), { name: p.name, qty: 1, desc: p.notes || '', price: String(p.price), disc: '' }]); setImp(false); }}>
              <span>{p.name}</span><span className="text-muted-foreground">{fmt(p.price)}</span>
            </button>))}
      </Modal>
    </div>
  );
}
