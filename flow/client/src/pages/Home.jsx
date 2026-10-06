import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { GROUPS, TONES, ICON_BG } from '../lib/nav.js';
import { useSettings } from '../lib/ctx.jsx';
import { ACTIVE, fmtDate, today } from '../lib/util.js';

export default function Home() {
  const { openNewOrder, orders } = useOutletContext();
  const { settings } = useSettings();
  const warn = Number(settings.alertDays ?? 3);
  const soon = orders.filter((o) => ACTIVE.includes(o.status) && o.due && (new Date(o.due) - new Date(today())) / 864e5 <= warn);

  return (
    <div className="space-y-4">
      {settings.showAlerts !== false && soon.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="mb-1 font-semibold text-warning">Prazos próximos ({soon.length})</p>
          {soon.slice(0, 5).map((o) => <p key={o.id}>{o.client} — entrega {fmtDate(o.due)}</p>)}
        </div>
      )}
      {GROUPS.map((g, gi) => (
        <section key={g.id} className={`rounded-2xl border p-4 ${TONES[g.tone]}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">{g.title}</h2>
            {g.id === 'pedidos' && <button onClick={openNewOrder} className="btn-primary !px-3 !py-1.5 text-xs"><Plus size={14} />Novo Pedido</button>}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {g.items.map((i, k) => (
              <Link key={i.to} to={i.to} className="relative flex flex-col items-center gap-2 rounded-xl border bg-card/80 p-4 text-center text-foreground transition hover:-translate-y-0.5 hover:border-primary/50">
                {i.isNew && <span className="absolute left-2 top-2 rounded bg-amber-500 px-1 text-[9px] font-bold text-black">NOVO</span>}
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${ICON_BG[(gi + k) % ICON_BG.length]}`}><i.icon size={18} /></span>
                <span className="text-sm font-semibold">{i.short || i.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{i.desc}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
