import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Modal, Field, Empty } from './ui.jsx';
import { useToast } from '../lib/ctx.jsx';
import { num } from '../lib/util.js';

const NUMERIC = new Set(['number', 'money']);

export function FieldInput({ f, value, onChange }) {
  const common = { className: 'input', placeholder: f.placeholder, value: value ?? '' };
  if (f.type === 'select')
    return <select {...common} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}</select>;
  if (f.type === 'textarea') return <textarea rows={3} {...common} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === 'date') return <input type="date" {...common} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === 'checkbox')
    return <label className="flex items-center gap-2 pt-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{f.checkLabel || 'Sim'}</label>;
  if (f.type === 'colors')
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {f.palette.map(([n, hex]) => (
            <button type="button" key={hex} title={n} onClick={() => onChange({ hex, name: n })}
              className={`h-7 w-7 rounded-full border-2 ${value?.hex === hex ? 'border-primary' : 'border-transparent'}`} style={{ background: hex }} />
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input className="input" placeholder="Nome da cor" value={value?.name || ''} onChange={(e) => onChange({ ...(value || { hex: '#ffffff' }), name: e.target.value })} />
          <input type="color" className="h-10 w-14 cursor-pointer rounded border bg-transparent" value={value?.hex || '#ffffff'} onChange={(e) => onChange({ ...(value || {}), hex: e.target.value })} />
        </div>
      </div>
    );
  if (f.type === 'image')
    return (
      <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-xs text-muted-foreground hover:bg-secondary/40">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : 'Foto'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files[0]; if (!file || file.size > 2e6) return;
          const r = new FileReader(); r.onload = () => onChange(r.result); r.readAsDataURL(file);
        }} />
      </label>
    );
  return <input type={NUMERIC.has(f.type) ? 'text' : f.type || 'text'} inputMode={NUMERIC.has(f.type) ? 'decimal' : undefined} {...common} onChange={(e) => onChange(e.target.value)} />;
}

export default function Crud({
  title, addLabel = 'Adicionar', modalTitle, fields, columns, items, loading, onSave, onDelete,
  defaults = {}, searchKeys = ['name'], searchPlaceholder = 'Buscar...', sorts, headerExtra, empty = 'Nada cadastrado', footerBadges, toolbar,
}) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(sorts?.[0]?.[0]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});

  const openNew = () => { setEdit(null); setForm({ ...defaults }); setOpen(true); };
  const openEdit = (r) => { setEdit(r); setForm({ ...r }); setOpen(true); };

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = items.filter((i) => !t || searchKeys.some((k) => String(i[k] ?? '').toLowerCase().includes(t)));
    if (sort) r = [...r].sort((a, b) => (typeof a[sort] === 'number' ? b[sort] - a[sort] : String(a[sort] ?? '').localeCompare(String(b[sort] ?? ''))));
    return r;
  }, [items, q, sort, searchKeys]);

  const submit = async (e) => {
    e.preventDefault();
    for (const f of fields) if (f.required && !String(form[f.key] ?? '').trim()) return toast(`Preencha: ${f.label}`, 'err');
    const data = { ...form };
    for (const f of fields) if (NUMERIC.has(f.type) && data[f.key] !== undefined) data[f.key] = num(data[f.key]);
    try { await onSave(data, edit?.id); setOpen(false); toast(edit ? 'Alterações salvas' : 'Cadastrado com sucesso'); }
    catch (err) { toast(err.message, 'err'); }
  };

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {headerExtra}
          <button onClick={openNew} className="btn-primary"><Plus size={16} />{addLabel}</button>
        </div>
      </div>
      {toolbar}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
          <input className="input !pl-9" placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {sorts && (
          <select className="input !w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
            {sorts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        )}
      </div>
      {footerBadges}
      {loading ? <Empty>Carregando...</Empty> : list.length === 0 ? <Empty>{empty}</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                {columns.map((c) => <th key={c.label} className="px-2 py-2 font-medium">{c.label}</th>)}
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/30">
                  {columns.map((c) => <td key={c.label} className="px-2 py-2.5">{c.render ? c.render(r) : r[c.key]}</td>)}
                  <td className="px-2 text-right">
                    <button onClick={() => openEdit(r)} className="rounded p-1.5 hover:bg-secondary"><Pencil size={15} /></button>
                    <button onClick={() => confirm('Excluir este registro?') && onDelete(r.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/15"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={(edit ? 'Editar ' : '') + (modalTitle || title)}>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {fields.filter((f) => !f.showIf || f.showIf(form)).map((f) => (
            <Field key={f.key} label={f.label + (f.required ? ' *' : '')} className={f.half ? '' : 'col-span-2'} hint={f.hint}>
              <FieldInput f={f} value={form[f.key]} onChange={(v) => setForm((x) => ({ ...x, [f.key]: v }))} />
            </Field>
          ))}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
            <button className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-4 flex gap-1 rounded-xl border bg-card/60 p-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${value === t.id ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}>
          {t.icon && <t.icon size={15} />}{t.label}
          {t.count !== undefined && <span className="rounded-full bg-secondary px-2 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
