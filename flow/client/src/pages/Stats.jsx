import React, { useMemo, useState } from 'react';
import { useCollection, useCurrency } from '../lib/ctx.jsx';
import { ACTIVE, DONE, fmtDate, today } from '../lib/util.js';
import { Stat, Empty } from '../components/ui.jsx';

const PERIODS = [['hoje', 'Hoje'], ['7', '7 dias'], ['30', '30 dias'], ['mes', 'Mês'], ['custom', 'Personalizado'], ['all', 'Todo período']];
const shift = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

export function payDate(o) { return o.deliveredAt || o.start || (o.createdAt || '').slice(0, 10); }

function Bars({ data, tone, empty }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  const { fmt } = useCurrency();
  if (!data.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.k} className="flex items-center gap-3 text-xs">
          <span className="w-20 shrink-0 text-muted-foreground">{fmtDate(d.k)}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-muted/50"><div className={`h-full ${tone}`} style={{ width: `${(d.v / max) * 100}%` }} /></div>
          <span className="w-24 text-right">{fmt(d.v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Stats() {
  const { items, loading } = useCollection('orders');
  const [p, setP] = useState('30');
  const [from, setFrom] = useState(shift(30));
  const [to, setTo] = useState(today());
  const { fmt } = useCurrency();

  const [a, b] = useMemo(() => {
    if (p === 'hoje') return [today(), today()];
    if (p === '7') return [shift(7), today()];
    if (p === '30') return [shift(30), today()];
    if (p === 'mes') return [today().slice(0, 8) + '01', today()];
    if (p === 'custom') return [from, to];
    return ['0000-01-01', '9999-12-31'];
  }, [p, from, to]);

  const d = useMemo(() => {
    const live = items.filter((o) => o.status !== 'cancelado');
    const paid = {}; const due = {};
    let rec = 0, recv = 0, fin = 0, prog = 0;
    live.forEach((o) => {
      const pd = payDate(o);
      if (o.paid > 0 && pd >= a && pd <= b) { rec += o.paid; paid[pd] = (paid[pd] || 0) + o.paid; }
      const pend = (o.total || 0) - (o.paid || 0);
      if (pend > 0 && o.due && o.due >= a && o.due <= b) { recv += pend; due[o.due] = (due[o.due] || 0) + pend; }
      if (ACTIVE.includes(o.status)) prog++;
      if (o.status === 'entregue' && pd >= a && pd <= b) fin++;
    });
    const arr = (m) => Object.entries(m).sort().map(([k, v]) => ({ k, v }));
    return { rec, recv, fin, prog, paid: arr(paid), due: arr(due) };
  }, [items, a, b]);

  if (loading) return <Empty>Carregando...</Empty>;
  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-2">
        {PERIODS.map(([k, l]) => <button key={k} onClick={() => setP(k)} className={p === k ? 'btn-primary !py-1.5' : 'btn-ghost !py-1.5'}>{l}</button>)}
        {p === 'custom' && <><input type="date" className="input !w-40" value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" className="input !w-40" value={to} onChange={(e) => setTo(e.target.value)} /></>}
        {p !== 'all' && <span className="ml-auto text-xs text-muted-foreground">{fmtDate(a)} - {fmtDate(b)}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Em andamento" value={d.prog} />
        <Stat label="Finalizados no período" value={d.fin} />
        <Stat label="Recebido" value={fmt(d.rec)} tone="text-success" />
        <Stat label="A receber" value={fmt(d.recv)} tone="text-warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h3 className="mb-3 font-semibold">Recebido por dia</h3><Bars data={d.paid} tone="bg-success" empty="Nenhum pagamento no período" /></div>
        <div className="card"><h3 className="mb-3 font-semibold">A receber por dia</h3><Bars data={d.due} tone="bg-warning" empty="Nada a receber no período 🎉" /></div>
      </div>
    </div>
  );
}
