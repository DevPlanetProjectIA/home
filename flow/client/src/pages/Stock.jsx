import React, { useState } from 'react';
import { Package, Layers, Printer } from 'lucide-react';
import Crud, { Tabs } from '../components/Crud.jsx';
import { useCollection, useCurrency } from '../lib/ctx.jsx';

const PALETTE = [['Branco', '#ffffff'], ['Preto', '#1f2937'], ['Vermelho', '#dc2626'], ['Azul', '#2563eb'], ['Verde', '#16a34a'], ['Amarelo', '#eab308'], ['Laranja', '#f97316'], ['Rosa', '#ec4899'], ['Roxo', '#9333ea'], ['Cinza', '#6b7280'], ['Marrom', '#92400e'], ['Prata', '#e5e7eb']];
const FIL_TYPES = ['PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'ASA', 'PC', 'HIPS', 'Outro'];

const CFG = {
  produto: {
    title: 'Produtos em Estoque', modal: 'Produto', empty: 'Nenhum produto cadastrado', ph: 'Buscar produto...',
    sorts: [['name', 'Nome'], ['qty', 'Quantidade'], ['price', 'Preço']],
    defaults: { qty: 1, unit: 'un', cost: 0, price: 0, weight: 0, printH: 0, paintH: 0 },
    fields: [
      { key: 'photo', label: 'Foto', type: 'image' },
      { key: 'name', label: 'Nome do Produto', required: true, placeholder: 'Ex: Chaveiro personalizado' },
      { key: 'qty', label: 'Quantidade', type: 'number', half: true }, { key: 'unit', label: 'Unidade', half: true },
      { key: 'cost', label: 'Custo de Produção', type: 'money', half: true }, { key: 'price', label: 'Preço de Venda', type: 'money', half: true },
      { key: 'weight', label: 'Peso (g)', type: 'number', half: true, hint: 'Dados de impressão 3D (opcional)' },
      { key: 'printH', label: 'Impressão (h)', type: 'number', half: true }, { key: 'paintH', label: 'Pintura (h)', type: 'number', half: true },
      { key: 'notes', label: 'Observações', placeholder: 'Opcional' },
    ],
  },
  insumo: {
    title: 'Insumos em Estoque', modal: 'Insumo', empty: 'Nenhum insumo cadastrado', ph: 'Buscar insumo...',
    sorts: [['name', 'Nome'], ['qty', 'Quantidade']],
    defaults: { qty: 1, unit: 'un', unitPrice: 0 },
    fields: [
      { key: 'name', label: 'Nome do Insumo', required: true, placeholder: 'Ex: Parafuso M3' },
      { key: 'qty', label: 'Quantidade', type: 'number', half: true }, { key: 'unit', label: 'Unidade', half: true },
      { key: 'unitPrice', label: 'Preço Unitário', type: 'money' },
      { key: 'notes', label: 'Observações', placeholder: 'Opcional' },
    ],
  },
  filamento: {
    title: 'Filamentos em Estoque', modal: 'Filamento', empty: 'Nenhum filamento cadastrado', ph: 'Buscar por cor, tipo, marca...',
    sorts: [['name', 'Nome da cor'], ['qty', 'Rolos']],
    defaults: { color: { hex: '#ffffff', name: '' }, ftype: 'PLA', qty: 1, rollWeight: 1000, rollPrice: 0 },
    fields: [
      { key: 'color', label: 'Cor do Filamento', type: 'colors', palette: PALETTE },
      { key: 'ftype', label: 'Tipo do Filamento', type: 'select', options: FIL_TYPES },
      { key: 'brand', label: 'Marca (opcional)', placeholder: 'Ex: 3D Fila, Voolt...' },
      { key: 'qty', label: 'Quantidade (rolos)', type: 'number', half: true }, { key: 'rollWeight', label: 'Peso por rolo (g)', type: 'number', half: true },
      { key: 'rollPrice', label: 'Valor Pago por Rolo - Opcional', type: 'money' },
      { key: 'nickname', label: 'Nome/Apelido (opcional)', placeholder: 'Ex: PLA Preto para miniaturas' },
      { key: 'notes', label: 'Observações', placeholder: 'Opcional' },
    ],
  },
};

function Section({ kind, all, coll }) {
  const cfg = CFG[kind]; const { fmt } = useCurrency();
  const items = all.filter((i) => i.type === kind);
  const inStock = items.filter((i) => i.qty > 0).length;
  const columns = {
    produto: [
      { label: '', render: (r) => r.photo ? <img src={r.photo} className="h-9 w-9 rounded object-cover" alt="" /> : null },
      { label: 'Produto', key: 'name' }, { label: 'Qtd', render: (r) => `${r.qty} ${r.unit || ''}` },
      { label: 'Custo', render: (r) => fmt(r.cost) }, { label: 'Preço', render: (r) => fmt(r.price) },
      { label: 'Margem', render: (r) => (r.price ? Math.round(((r.price - r.cost) / r.price) * 100) + '%' : '—') },
    ],
    insumo: [{ label: 'Insumo', key: 'name' }, { label: 'Qtd', render: (r) => `${r.qty} ${r.unit || ''}` }, { label: 'Preço unit.', render: (r) => fmt(r.unitPrice) }, { label: 'Total', render: (r) => fmt(r.qty * r.unitPrice) }],
    filamento: [
      { label: 'Cor', render: (r) => <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full border" style={{ background: r.color?.hex }} />{r.color?.name}</span> },
      { label: 'Tipo', key: 'ftype' }, { label: 'Marca', key: 'brand' }, { label: 'Rolos', key: 'qty' },
      { label: 'Peso rolo', render: (r) => `${r.rollWeight} g` }, { label: 'R$/kg', render: (r) => (r.rollWeight ? fmt((r.rollPrice / r.rollWeight) * 1000) : '—') },
    ],
  }[kind];
  const save = (d, id) => {
    const data = { ...d, type: kind };
    if (kind === 'filamento') data.name = data.nickname || `${data.color?.name || ''} ${data.ftype}`.trim();
    return id ? coll.update(id, data) : coll.create(data);
  };
  return (
    <Crud title={cfg.title} modalTitle={cfg.modal} fields={cfg.fields} columns={columns} items={items} loading={coll.loading}
      defaults={cfg.defaults} onSave={save} onDelete={coll.remove} sorts={cfg.sorts} searchKeys={['name', 'brand', 'ftype', 'notes']}
      searchPlaceholder={cfg.ph} empty={cfg.empty}
      footerBadges={<div className="mb-3 flex gap-2 text-xs"><span className="badge bg-secondary">Em estoque: {inStock}</span><span className="badge bg-destructive/80 text-white">Esgotado: {items.length - inStock}</span></div>} />
  );
}

export default function Stock() {
  const coll = useCollection('stock');
  const [tab, setTab] = useState('produto');
  const n = (t) => coll.items.filter((i) => i.type === t).length;
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'produto', label: 'Produtos', icon: Package, count: n('produto') },
        { id: 'insumo', label: 'Insumos', icon: Layers, count: n('insumo') },
        { id: 'filamento', label: 'Filamentos', icon: Printer, count: n('filamento') },
      ]} />
      <Section key={tab} kind={tab} all={coll.items} coll={coll} />
    </>
  );
}
