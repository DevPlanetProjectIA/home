import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Home, LogOut, Plus, Menu } from 'lucide-react';
import { GROUPS, TONES, TITLES, BRAND } from '../lib/nav.js';
import { useAuth, useCollection, useCurrency, CURRENCIES } from '../lib/ctx.jsx';
import { ACTIVE, DONE } from '../lib/util.js';
import NewOrderSheet from './NewOrderSheet.jsx';

export function Logo({ size = 40 }) {
  return <img src="/logo.png" alt={BRAND.name} style={{ height: size * 2, width: 'auto', maxWidth: '100%' }} className="rounded-xl object-contain" />;
}

function CurrencyPicker() {
  const { code, setCode } = useCurrency();
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{CURRENCIES[code].symbol}</span>
      <select value={code} onChange={(e) => setCode(e.target.value)} className="cursor-pointer rounded bg-transparent text-xs outline-none">
        {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k} className="bg-popover">{v.label}</option>)}
      </select>
    </label>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { items: orders, reload } = useCollection('orders');
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState(() => Object.fromEntries(GROUPS.map((g) => [g.id, ['pedidos', 'gestao'].includes(g.id)])));

  const counts = useMemo(() => ({
    active: orders.filter((o) => ACTIVE.includes(o.status)).length,
    done: orders.filter((o) => DONE.includes(o.status)).length,
  }), [orders]);

  const head = TITLES[loc.pathname] || { title: BRAND.name, sub: '' };

  const sidebar = (
    <aside className={`flex h-full flex-col border-r bg-sidebar ${collapsed ? 'w-[72px]' : 'w-[224px]'} transition-all`}>
      <div className="flex justify-center px-3 py-5"><Logo size={collapsed ? 16 : 40} /></div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 pb-3">
        <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>
          <Home size={16} />{!collapsed && 'Início'}
        </NavLink>
        {GROUPS.map((g) => (
          <div key={g.id} className={`rounded-xl border p-1.5 ${TONES[g.tone]}`}>
            <button onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))} className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              <g.icon size={14} />
              {!collapsed && <><span className="flex-1 text-left">{g.title}</span><ChevronDown size={14} className={open[g.id] ? '' : '-rotate-90'} /></>}
            </button>
            {open[g.id] && (
              <div className="mt-1 space-y-0.5">
                {g.id === 'pedidos' && (
                  <button onClick={() => { setSheet(true); setMobile(false); }} className="btn-primary mb-1.5 w-full !py-2">
                    <Plus size={16} />{!collapsed && 'Novo pedido'}
                  </button>
                )}
                {g.items.map((i) => (
                  <NavLink key={i.to} to={i.to} onClick={() => setMobile(false)} title={i.label}
                    className={({ isActive }) => `flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] text-foreground/90 ${isActive ? 'bg-primary/15 text-primary' : 'hover:bg-secondary/70'}`}>
                    <i.icon size={15} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{i.label}</span>
                        {i.badge && <span className="rounded-full border px-1.5 text-[10px]">{counts[i.badge]}</span>}
                        {i.isNew && <span className="rounded bg-amber-500 px-1 text-[9px] font-bold text-black">NOVO</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t p-3 text-xs text-muted-foreground">
        {!collapsed && <p className="truncate">{user.email}</p>}
        <button onClick={async () => { await logout(); nav('/login'); }} className="flex items-center gap-2 hover:text-foreground">
          <LogOut size={14} />{!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">{sidebar}</div>
      {mobile && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
          <div className="flex items-start gap-3">
            <button onClick={() => (window.innerWidth < 768 ? setMobile(true) : setCollapsed((c) => !c))} className="mt-1 rounded-full border bg-card p-1.5 hover:bg-secondary">
              {window.innerWidth < 768 ? <Menu size={16} /> : collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{head.title}</h1>
              <p className="text-sm text-muted-foreground">{head.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2"><span className="text-xs text-muted-foreground">🇧🇷 PT-BR</span><CurrencyPicker /></div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-3">
          <Outlet context={{ openNewOrder: () => setSheet(true), reloadOrders: reload, orders }} />
        </main>
      </div>
      <NewOrderSheet open={sheet} onClose={() => setSheet(false)} onCreated={() => { reload(); nav('/pedidos/andamento'); }} />
    </div>
  );
}
