import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageCircle, Pencil, Trash2, ArrowRight, CalendarClock } from 'lucide-react';
import { useCollection, useCurrency, useSettings, useToast } from '../lib/ctx.jsx';
import { ACTIVE, DONE, STATUS, fmtDate, waLink, today } from '../lib/util.js';
import { Badge, Empty } from '../components/ui.jsx';
import NewOrderSheet, { PAY } from '../components/NewOrderSheet.jsx';

const NEXT = { aguardando: 'producao', producao: 'pronto', pronto: 'entregue' };
const NEXT_LABEL = { aguardando: 'Iniciar produção', producao: 'Marcar como pronto', pronto: 'Marcar entregue' };

export default function Orders({ done }) {
  const { reloadOrders } = useOutletContext();
  const orders = useCollection('orders');
  const { settings } = useSettings();
  const { fmt } = useCurrency();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const list = orders.items.filter((o) => (done ? DONE : ACTIVE).includes(o.status));
  const sync = () => reloadOrders();

  const setStatus = async (o, status) => {
    const patch = { status };
    if (status === 'entregue') { patch.paid = o.total; patch.payment = 'vista'; patch.deliveredAt = today(); }
    await orders.update(o.id, patch); sync();
  };
  const remove = async (o) => { if (confirm('Excluir pedido?')) { await orders.remove(o.id); sync(); toast('Pedido excluído'); } };
  const cobrar = (o) => {
    const pend = (o.total || 0) - (o.paid || 0);
    const msg = `Olá ${o.client}! Seu pedido "${o.title || ''}" está em andamento. Valor pendente: ${fmt(pend)}.` + (settings.pix ? ` Chave PIX: ${settings.pix}` : '');
    window.open(waLink((o.ddi || '+55') + o.phone, msg), '_blank');
  };

  if (orders.loading) return <Empty>Carregando...</Empty>;
  if (!list.length) return <Empty>{done ? 'Nenhum pedido finalizado ainda.' : 'Nenhum pedido em andamento. Use "Novo pedido" para cadastrar.'}</Empty>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((o) => {
        const late = !done && o.due && o.due < today();
        return (
          <div key={o.id} className="card flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{o.client}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{o.title || 'Sem descrição'}</p>
              </div>
              <Badge cls={STATUS[o.status]?.cls}>{STATUS[o.status]?.label}</Badge>
            </div>
            {o.photo && <img src={o.photo} alt="" className="h-32 w-full rounded-lg object-cover" />}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">{fmt(o.total)}</p></div>
              <div><p className="text-xs text-muted-foreground">Pagamento</p><p>{PAY[o.payment] || '—'}</p></div>
              <div className={late ? 'text-destructive' : ''}><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock size={12} />Entrega</p><p>{fmtDate(o.due)}{late && ' (atrasado)'}</p></div>
              <div><p className="text-xs text-muted-foreground">Lucro est.</p><p>{o.cost ? fmt(o.total - o.cost) : '—'}</p></div>
            </div>
            {o.notes && <p className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">{o.notes}</p>}
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
              {NEXT[o.status] && <button onClick={() => setStatus(o, NEXT[o.status])} className="btn-primary !px-3 !py-1.5 text-xs">{NEXT_LABEL[o.status]}<ArrowRight size={13} /></button>}
              {done && <button onClick={() => setStatus(o, 'aguardando')} className="btn-ghost !px-3 !py-1.5 text-xs">Reabrir</button>}
              {!done && o.status !== 'cancelado' && <button onClick={() => setStatus(o, 'cancelado')} className="btn-ghost !px-3 !py-1.5 text-xs">Cancelar</button>}
              <div className="ml-auto flex">
                {o.phone && <button onClick={() => cobrar(o)} title="WhatsApp" className="rounded p-1.5 hover:bg-secondary"><MessageCircle size={16} /></button>}
                <button onClick={() => setEdit(o)} className="rounded p-1.5 hover:bg-secondary"><Pencil size={16} /></button>
                <button onClick={() => remove(o)} className="rounded p-1.5 text-destructive hover:bg-destructive/15"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        );
      })}
      <NewOrderSheet open={!!edit} editing={edit} onClose={() => setEdit(null)} onCreated={() => { orders.reload(); sync(); }} />
    </div>
  );
}
