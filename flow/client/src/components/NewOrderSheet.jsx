import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Field } from './ui.jsx';
import { useCollection, useCurrency, useToast } from '../lib/ctx.jsx';
import { num, today } from '../lib/util.js';

export const PAY = { vista: 'Pago à vista', metade: 'Pagou metade', pendente: 'Ainda vai pagar' };
export const ORIGINS = ['WhatsApp', 'Instagram', 'Shopee', 'Mercado Livre', 'Indicação', 'Outro'];
const DEADLINES = [['0', 'Hoje'], ['5', '5 dias'], ['10', '10 dias'], ['15', '15 dias'], ['30', '30 dias'], ['40', '40 dias']];
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

const blank = () => ({
  client: '', clientId: '', ddi: '+55', phone: '', email: '', total: '', cost: '', payment: 'vista', origin: '', owner: '',
  startMode: 'hoje', startDate: today(), deadlineMode: '5', deadlineDate: '', title: '', notes: '', photo: '',
});

export default function NewOrderSheet({ open, onClose, onCreated, editing }) {
  const orders = useCollection('orders');
  const clients = useCollection('clients');
  const { symbol } = useCurrency();
  const toast = useToast();
  const [f, setF] = useState(blank());
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => { if (open) setF(editing ? { ...blank(), ...editing } : blank()); }, [open, editing]);
  if (!open) return null;

  const pickClient = (id) => {
    const c = clients.items.find((x) => String(x.id) === id);
    if (!c) return set('clientId', '');
    setF((x) => ({ ...x, clientId: id, client: c.name, phone: c.phone || '', email: c.email || '' }));
  };

  const photo = (file) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return toast('Foto acima de 4MB', 'err');
    const r = new FileReader(); r.onload = () => set('photo', r.result); r.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.client.trim()) return toast('Informe o nome do cliente', 'err');
    const start = f.startMode === 'hoje' ? today() : f.startDate || today();
    const due = f.deadlineMode === 'data' ? f.deadlineDate : addDays(start, Number(f.deadlineMode));
    const total = num(f.total);
    const paid = f.payment === 'vista' ? total : f.payment === 'metade' ? total / 2 : 0;
    const data = { ...f, total, cost: num(f.cost), start, due, paid, status: editing?.status || 'aguardando' };
    try {
      if (editing) await orders.update(editing.id, data); else await orders.create(data);
      toast(editing ? 'Pedido atualizado' : 'Pedido cadastrado');
      onCreated?.();
      onClose();
    } catch (err) { toast(err.message, 'err'); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 top-16 mx-auto flex flex-col rounded-t-2xl border bg-popover px-6 pt-4 md:px-[26%]">
        <div className="mx-auto mb-3 h-1 w-24 rounded-full bg-secondary" />
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{editing ? 'Editar pedido' : 'Novo pedido'}</h2>
            <p className="text-sm text-muted-foreground">Preencha a ficha para salvar a tarefa com prazo e valor.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-secondary"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4 pr-2">
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
            <p className="text-sm font-semibold">Cliente cadastrado <span className="text-xs font-normal text-muted-foreground">(opcional)</span></p>
            <p className="mb-2 text-xs text-muted-foreground">Selecione um cliente cadastrado para preencher os dados automaticamente.</p>
            <select className="input" value={f.clientId} onChange={(e) => pickClient(e.target.value)}>
              <option value="">Buscar cliente...</option>
              {clients.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do cliente *"><input className="input" placeholder="Ex.: João da Silva" value={f.client} onChange={(e) => set('client', e.target.value)} /></Field>
            <Field label="WhatsApp do cliente">
              <div className="flex gap-2">
                <select className="input !w-24" value={f.ddi} onChange={(e) => set('ddi', e.target.value)}>
                  {['+55', '+1', '+351', '+34', '+54'].map((d) => <option key={d}>{d}</option>)}
                </select>
                <input className="input" placeholder="Ex.: (61) 99999-0000" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </Field>
            <Field label="Email do cliente"><input type="email" className="input" placeholder="Ex.: cliente@email.com" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label={`Valor total (${symbol})`}><input className="input" inputMode="decimal" placeholder="Ex.: 200" value={f.total} onChange={(e) => set('total', e.target.value)} /></Field>
            <Field label="Custo total estimado (opcional)" hint="Informe o custo de produção total para calcular o lucro do pedido.">
              <input className="input" inputMode="decimal" placeholder="0,00" value={f.cost} onChange={(e) => set('cost', e.target.value)} />
            </Field>
            <Field label="Status do pagamento">
              <select className="input" value={f.payment} onChange={(e) => set('payment', e.target.value)}>
                {Object.entries(PAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Origem do pedido">
              <select className="input" value={f.origin} onChange={(e) => set('origin', e.target.value)}>
                <option value="">Selecione...</option>{ORIGINS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Responsável"><input className="input" placeholder="Ex.: Bruno" value={f.owner} onChange={(e) => set('owner', e.target.value)} /></Field>
          </div>

          <div>
            <p className="label">Quando começou o pedido?</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={f.startMode === 'hoje'} onChange={() => set('startMode', 'hoje')} />Hoje</label>
              <label className="flex items-center gap-2"><input type="radio" checked={f.startMode === 'data'} onChange={() => set('startMode', 'data')} />Data específica:
                <input type="date" className="input !w-40" value={f.startDate} onChange={(e) => { set('startDate', e.target.value); set('startMode', 'data'); }} /></label>
            </div>
          </div>

          <div>
            <p className="label">Prazo de entrega</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {DEADLINES.map(([v, l]) => (
                <label key={v} className="flex items-center gap-2"><input type="radio" checked={f.deadlineMode === v} onChange={() => set('deadlineMode', v)} />{l}</label>
              ))}
              <label className="flex items-center gap-2"><input type="radio" checked={f.deadlineMode === 'data'} onChange={() => set('deadlineMode', 'data')} />Data específica:
                <input type="date" className="input !w-40" value={f.deadlineDate} onChange={(e) => { set('deadlineDate', e.target.value); set('deadlineMode', 'data'); }} /></label>
            </div>
          </div>

          <Field label="Do que se trata o pedido?"><textarea rows={3} className="input" placeholder="Ex.: Boneco 3D personalizado da família, com base e acessórios." value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Observações extras"><textarea rows={2} className="input" placeholder="Tamanhos, cores, referências de foto, detalhes importantes..." value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          <Field label="Anexar foto (máx. 1 foto, até 4MB)">
            <label className="flex h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
              {f.photo ? <img src={f.photo} alt="" className="h-full rounded object-contain" /> : 'Anexar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => photo(e.target.files[0])} />
            </label>
          </Field>
        </div>

        <div className="flex items-center justify-between border-t py-3">
          <span className="text-xs text-muted-foreground">* Campos obrigatórios</span>
          <button className="btn-primary">{editing ? 'Salvar alterações' : '+ Cadastrar pedido'}</button>
        </div>
      </form>
    </div>
  );
}
