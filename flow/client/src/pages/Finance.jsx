import React, { useMemo, useState } from 'react';
import { Download, TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';
import Crud, { Tabs } from '../components/Crud.jsx';
import { useCollection, useCurrency, useSettings, useToast } from '../lib/ctx.jsx';
import { fmtDate, today, monthKey } from '../lib/util.js';
import { payDate } from './Stats.jsx';

const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DEFAULT_CATS = ['Filamento', 'Energia', 'Embalagem', 'Frete', 'Manutenção', 'Marketing', 'Outros'];

function Chart({ series, line }) {
  const W = 640, H = 200, P = 28;
  const all = series.flatMap((s) => s.v.map((x) => x));
  const max = Math.max(1, ...all), min = line ? Math.min(0, ...all) : 0;
  const n = series[0].v.length; const bw = (W - P * 2) / n;
  const y = (v) => H - P - ((v - min) / (max - min)) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={P} x2={W - P} y1={H - P - t * (H - P * 2)} y2={H - P - t * (H - P * 2)} stroke="hsl(215 28% 25% / .5)" />)}
      {line
        ? <polyline fill="none" stroke="hsl(217 91% 60%)" strokeWidth="2.5" points={series[0].v.map((v, i) => `${P + bw * i + bw / 2},${y(v)}`).join(' ')} />
        : series.map((s, si) => s.v.map((v, i) => <rect key={si + '-' + i} x={P + bw * i + bw * (0.15 + si * 0.35)} y={y(v)} width={bw * 0.33} height={Math.max(0, H - P - y(v))} rx="2" fill={s.color} />))}
      {series[0].labels.map((l, i) => <text key={i} x={P + bw * i + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="hsl(215 16% 60%)">{l}</text>)}
    </svg>
  );
}

export default function Finance() {
  const tx = useCollection('transactions');
  const orders = useCollection('orders');
  const { settings, save } = useSettings();
  const { fmt } = useCurrency();
  const toast = useToast();
  const [tab, setTab] = useState('geral');
  const [month, setMonth] = useState(today().slice(0, 7));
  const cats = settings.expenseCategories || DEFAULT_CATS;

  // Todas as entradas: pedidos pagos + lançamentos manuais
  const entries = useMemo(() => [
    ...orders.items.filter((o) => o.status !== 'cancelado' && o.paid > 0).map((o) => ({ id: 'o' + o.id, desc: `Pedido — ${o.client}`, amount: o.paid, date: payDate(o), auto: true })),
    ...tx.items.filter((t) => t.type === 'entrada'),
  ], [orders.items, tx.items]);
  const exits = tx.items.filter((t) => t.type === 'saida');

  const sum = (arr, m) => arr.filter((x) => monthKey(x.date) === m).reduce((s, x) => s + (x.amount || 0), 0);
  const recv = orders.items.filter((o) => o.status !== 'cancelado' && monthKey(o.due) === month).reduce((s, o) => s + Math.max(0, (o.total || 0) - (o.paid || 0)), 0);
  const inM = sum(entries, month), outM = sum(exits, month);

  const months = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    return Array.from({ length: 12 }, (_, i) => { const d = new Date(y, m - 1 - (11 - i), 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  }, [month]);
  const labels = months.map((k) => MON[Number(k.slice(5)) - 1]);
  const ins = months.map((k) => sum(entries, k)); const outs = months.map((k) => sum(exits, k));
  let acc = 0; const bal = ins.map((v, i) => (acc += v - outs[i]));

  const csv = () => {
    const rows = [['Tipo', 'Data', 'Descrição', 'Categoria', 'Valor'], ...entries.map((e) => ['Entrada', e.date, e.desc, e.category || '', e.amount]), ...exits.map((e) => ['Saída', e.date, e.desc, e.category || '', e.amount])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `financeiro-${month}.csv`; a.click();
  };

  const mkFields = (isOut) => [
    { key: 'desc', label: 'Descrição', required: true },
    { key: 'amount', label: 'Valor', type: 'money', half: true, required: true }, { key: 'date', label: 'Data', type: 'date', half: true, required: true },
    ...(isOut ? [{ key: 'category', label: 'Categoria', type: 'select', options: cats }] : []),
  ];
  const cols = (isOut) => [
    { label: 'Data', render: (r) => fmtDate(r.date) }, { label: 'Descrição', render: (r) => <>{r.desc}{r.auto && <span className="badge ml-2 bg-primary/15 text-primary">automático</span>}</> },
    ...(isOut ? [{ label: 'Categoria', key: 'category' }] : []), { label: 'Valor', render: (r) => fmt(r.amount) },
  ];
  const saveTx = (type) => (d, id) => (id ? tx.update(id, { ...d, type }) : tx.create({ ...d, type }));

  return (
    <div>
      <div className="card mb-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
          <div className="flex items-center gap-2"><input type="month" className="input !w-44" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['Recebido', inM, TrendingUp, 'text-success'], ['A Receber', recv, Clock, 'text-warning'], ['Despesas', outM, TrendingDown, 'text-destructive'], ['Saldo', inM - outM, Wallet, inM - outM < 0 ? 'text-destructive' : 'text-primary']].map(([l, v, I, c]) => (
            <div key={l} className="rounded-xl border bg-muted/20 p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><I size={13} />{l}</p><p className={`mt-1 text-xl font-bold ${c}`}>{fmt(v)}</p></div>
          ))}
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'geral', label: 'Visão Geral' }, { id: 'entradas', label: 'Entradas' }, { id: 'saidas', label: 'Saídas' }, { id: 'config', label: 'Config' }]} />

      {tab === 'geral' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Fluxo de Caixa</h3><button onClick={csv} className="btn-ghost !py-1.5 text-xs"><Download size={14} />Exportar CSV</button></div>
            <Chart series={[{ v: ins, color: 'hsl(142 71% 45%)', labels }, { v: outs, color: 'hsl(0 84% 60%)', labels }]} />
            <div className="mt-1 flex justify-center gap-4 text-xs"><span className="text-success">■ Entradas</span><span className="text-destructive">■ Saídas</span></div>
          </div>
          <div className="card"><h3 className="mb-2 font-semibold">Evolução do Saldo</h3><Chart line series={[{ v: bal, labels }]} /></div>
        </div>
      )}
      {tab === 'entradas' && (
        <Crud title="Entradas" addLabel="Nova entrada" modalTitle="entrada" fields={mkFields(false)} columns={cols(false)} items={entries.sort((a, b) => b.date.localeCompare(a.date))}
          loading={tx.loading} defaults={{ date: today() }} searchKeys={['desc']} onSave={saveTx('entrada')} empty="Nenhuma entrada"
          onDelete={(id) => (String(id).startsWith('o') ? toast('Entradas automáticas vêm dos pedidos', 'err') : tx.remove(id))} />
      )}
      {tab === 'saidas' && (
        <Crud title="Saídas" addLabel="Nova saída" modalTitle="saída" fields={mkFields(true)} columns={cols(true)} items={exits.sort((a, b) => b.date.localeCompare(a.date))}
          loading={tx.loading} defaults={{ date: today(), category: cats[0] }} searchKeys={['desc', 'category']} onSave={saveTx('saida')} onDelete={tx.remove} empty="Nenhuma saída" />
      )}
      {tab === 'config' && <CatConfig cats={cats} onSave={(c) => save({ expenseCategories: c }).then(() => toast('Categorias salvas'))} />}
    </div>
  );
}

function CatConfig({ cats, onSave }) {
  const [list, setList] = useState(cats); const [v, setV] = useState('');
  return (
    <div className="card max-w-xl">
      <h3 className="mb-1 font-semibold">Categorias de despesas</h3>
      <p className="mb-3 text-sm text-muted-foreground">Usadas ao lançar saídas.</p>
      <div className="mb-3 flex flex-wrap gap-2">{list.map((c) => <span key={c} className="badge gap-2 bg-secondary py-1">{c}<button onClick={() => setList(list.filter((x) => x !== c))}>×</button></span>)}</div>
      <div className="flex gap-2"><input className="input" placeholder="Nova categoria" value={v} onChange={(e) => setV(e.target.value)} /><button className="btn-ghost" onClick={() => { if (v.trim()) { setList([...list, v.trim()]); setV(''); } }}>Adicionar</button></div>
      <button className="btn-primary mt-4" onClick={() => onSave(list)}>Salvar</button>
    </div>
  );
}
