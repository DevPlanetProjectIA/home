export const num = (v) => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
export const fmtDate = (d) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('pt-BR') : '—');
export const today = () => new Date().toISOString().slice(0, 10);
export const monthKey = (d) => (d || '').slice(0, 7);
export const waLink = (phone, text) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text || '')}`;
export const STATUS = {
  aguardando: { label: 'Aguardando', cls: 'bg-warning/15 text-warning' },
  producao: { label: 'Em produção', cls: 'bg-primary/15 text-primary' },
  pronto: { label: 'Pronto', cls: 'bg-accent/15 text-accent' },
  entregue: { label: 'Entregue', cls: 'bg-success/15 text-success' },
  cancelado: { label: 'Cancelado', cls: 'bg-destructive/15 text-destructive' },
};
export const ACTIVE = ['aguardando', 'producao', 'pronto'];
export const DONE = ['entregue', 'cancelado'];
