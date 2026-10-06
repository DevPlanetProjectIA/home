import React, { useState } from 'react';
import { LayoutGrid, Store as StoreIcon, Plus, Trash2 } from 'lucide-react';
import Crud, { Tabs } from '../components/Crud.jsx';
import { Modal } from '../components/ui.jsx';
import { useCollection, useCurrency, useToast } from '../lib/ctx.jsx';
import { num } from '../lib/util.js';

const STORE_FIELDS = [
  { key: 'name', label: 'Nome da loja', required: true },
  { key: 'phone', label: 'WhatsApp / telefone', half: true }, { key: 'owner', label: 'Responsável', half: true },
  { key: 'margin', label: 'Margem sugerida à loja (%)', type: 'number', half: true, hint: 'É só uma sugestão sua. A loja decide o preço final.' },
  { key: 'checkDays', label: 'Conferir a cada', type: 'select', half: true, options: [['7', '7 dias'], ['15', '15 dias'], ['30', '30 dias']] },
  { key: 'lossPolicy', label: 'Peças perdidas', type: 'checkbox', checkLabel: 'A loja paga peças perdidas' },
  { key: 'notes', label: 'Mais dados', type: 'textarea' },
];

export default function Consigned() {
  const coll = useCollection('consigned');
  const { fmt } = useCurrency();
  const toast = useToast();
  const [tab, setTab] = useState('painel');
  const [store, setStore] = useState(null);
  const [p, setP] = useState({ name: '', qty: 1, price: '' });

  const stores = coll.items.filter((i) => i.type === 'store');
  const pieces = (s) => coll.items.filter((i) => i.type === 'piece' && i.storeId === s.id);
  const totals = (s) => pieces(s).reduce((a, x) => ({ sent: a.sent + x.qty, sold: a.sold + x.sold, due: a.due + x.sold * x.price, stock: a.stock + (x.qty - x.sold) * x.price }), { sent: 0, sold: 0, due: 0, stock: 0 });
  const all = stores.reduce((a, s) => { const t = totals(s); return { sent: a.sent + t.sent, sold: a.sold + t.sold, due: a.due + t.due, stock: a.stock + t.stock }; }, { sent: 0, sold: 0, due: 0, stock: 0 });

  const addPiece = async () => {
    if (!p.name.trim()) return toast('Informe o nome da peça', 'err');
    await coll.create({ type: 'piece', storeId: store.id, name: p.name, qty: num(p.qty) || 1, price: num(p.price), sold: 0 }); setP({ name: '', qty: 1, price: '' });
  };
  const sell = (x, d) => coll.update(x.id, { sold: Math.min(x.qty, Math.max(0, x.sold + d)) });

  return (
    <div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'painel', label: 'Painel', icon: LayoutGrid }, { id: 'lojas', label: 'Lojas', icon: StoreIcon }]} />
      {tab === 'lojas' ? (
        <Crud title="Lojas parceiras" addLabel="Cadastrar loja" modalTitle="loja" fields={STORE_FIELDS} items={stores} loading={coll.loading}
          defaults={{ margin: 40, checkDays: '15' }} onSave={(d, id) => (id ? coll.update(id, d) : coll.create({ ...d, type: 'store' }))} onDelete={coll.remove}
          searchKeys={['name', 'owner']} empty="Cadastre sua primeira loja"
          columns={[{ label: 'Loja', key: 'name' }, { label: 'Responsável', key: 'owner' }, { label: 'Margem', render: (r) => r.margin + '%' }, { label: 'Conferência', render: (r) => r.checkDays + ' dias' }]} />
      ) : stores.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16"><StoreIcon size={28} className="text-success" /><p className="font-medium">Cadastre sua primeira loja</p><button className="btn-primary" onClick={() => setTab('lojas')}>+ Cadastrar loja</button></div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[['Peças enviadas', all.sent], ['Peças vendidas', all.sold], ['A receber das lojas', fmt(all.due)], ['Em estoque nas lojas', fmt(all.stock)]].map(([l, v]) => <div key={l} className="card"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-bold">{v}</p></div>)}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stores.map((s) => { const t = totals(s); return (
              <div key={s.id} className="card"><div className="mb-2 flex justify-between"><h3 className="font-semibold">{s.name}</h3><span className="text-xs text-muted-foreground">confere a cada {s.checkDays}d</span></div>
                <p className="text-sm text-muted-foreground">{t.sent} enviadas · {t.sold} vendidas</p><p className="mt-1 text-lg font-bold text-success">{fmt(t.due)} a receber</p>
                <button className="btn-ghost mt-3 w-full" onClick={() => setStore(s)}>Gerenciar peças</button></div>); })}
          </div>
        </>
      )}
      <Modal open={!!store} onClose={() => setStore(null)} title={`Peças — ${store?.name}`} wide>
        {store && <>
          <div className="mb-4 grid grid-cols-12 gap-2">
            <input className="input col-span-6" placeholder="Peça" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            <input className="input col-span-2" placeholder="Qtd" value={p.qty} onChange={(e) => setP({ ...p, qty: e.target.value })} />
            <input className="input col-span-3" placeholder="Seu preço" value={p.price} onChange={(e) => setP({ ...p, price: e.target.value })} />
            <button className="btn-primary col-span-1 !px-0" onClick={addPiece}><Plus size={16} /></button>
          </div>
          {pieces(store).map((x) => (
            <div key={x.id} className="flex items-center gap-3 border-b border-border/30 py-2 text-sm">
              <span className="flex-1">{x.name}<span className="block text-xs text-muted-foreground">{fmt(x.price)} · sugerido {fmt(x.price * (1 + (store.margin || 0) / 100))}</span></span>
              <button className="btn-ghost !px-2 !py-1" onClick={() => sell(x, -1)}>−</button><span>{x.sold}/{x.qty} vendidas</span><button className="btn-ghost !px-2 !py-1" onClick={() => sell(x, 1)}>+</button>
              <button className="text-destructive" onClick={() => coll.remove(x.id)}><Trash2 size={15} /></button>
            </div>))}
          {pieces(store).length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma peça enviada.</p>}
        </>}
      </Modal>
    </div>
  );
}
