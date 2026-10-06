import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useCollection } from '../lib/ctx.jsx';
import { ACTIVE, fmtDate } from '../lib/util.js';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

export default function Calendar() {
  const { items } = useCollection('orders');
  const [cur, setCur] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const todayIso = iso(new Date());

  const byDay = useMemo(() => {
    const m = {};
    items.filter((o) => o.due && o.status !== 'cancelado').forEach((o) => (m[o.due] = [...(m[o.due] || []), o]));
    return m;
  }, [items]);

  const cells = useMemo(() => {
    const first = new Date(cur); const start = new Date(first); start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; }).filter((d, i, a) => i < 35 || a[35].getMonth() === cur.getMonth());
  }, [cur]);

  const week = useMemo(() => {
    const d = new Date(); const s = new Date(d); s.setDate(d.getDate() - d.getDay()); const e = new Date(s); e.setDate(s.getDate() + 6);
    return items.filter((o) => o.due >= iso(s) && o.due <= iso(e) && ACTIVE.includes(o.status)).sort((a, b) => a.due.localeCompare(b.due));
  }, [items]);

  const move = (n) => setCur((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Calendário de entregas</h2><p className="text-sm text-muted-foreground">Veja as datas de entrega de cada pedido</p></div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{MONTHS[cur.getMonth()]} {cur.getFullYear()}</h3>
        <div className="flex gap-2">
          <button className="btn-ghost !p-2" onClick={() => move(-1)}><ChevronLeft size={16} /></button>
          <button className="btn-ghost !p-2" onClick={() => move(1)}><ChevronRight size={16} /></button>
          <button className="btn-ghost" onClick={() => { const d = new Date(); d.setDate(1); setCur(d); }}><CalendarDays size={15} />Semana atual</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d) => {
          const k = iso(d); const os = byDay[k] || []; const out = d.getMonth() !== cur.getMonth();
          return (
            <div key={k} className={`min-h-[84px] rounded-lg border p-1.5 text-xs ${out ? 'opacity-40' : 'bg-muted/20'} ${k === todayIso ? 'border-primary' : ''}`}>
              <p className={`mb-1 font-semibold ${k === todayIso ? 'text-primary' : ''}`}>{d.getDate()}</p>
              {os.slice(0, 3).map((o) => (
                <p key={o.id} title={o.title} className={`mb-0.5 truncate rounded px-1 ${ACTIVE.includes(o.status) ? (k < todayIso ? 'bg-destructive/25' : 'bg-primary/25') : 'bg-success/25'}`}>{o.client}</p>
              ))}
              {os.length > 3 && <p className="text-muted-foreground">+{os.length - 3}</p>}
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl border bg-muted/20 p-4">
        <h3 className="mb-2 font-semibold">Entregas desta semana</h3>
        {week.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma entrega nesta semana.</p> :
          week.map((o) => <p key={o.id} className="flex justify-between border-b border-border/30 py-1.5 text-sm"><span>{o.client} — {o.title}</span><span className="text-muted-foreground">{fmtDate(o.due)}</span></p>)}
      </div>
    </div>
  );
}
