import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator as CalcIcon, Trash2, Zap, Cog, Clock, TrendingUp, Tag, ShoppingCart, Plus, X, Save, FileText, Download } from 'lucide-react';
import { Tabs } from '../components/Crud.jsx';
import { Field } from '../components/ui.jsx';
import { useCollection, useCurrency, useToast } from '../lib/ctx.jsx';
import { num } from '../lib/util.js';

const Badge = ({ tone = 'blue', children }) => {
  const cls = { blue: 'border-primary/50 text-primary', green: 'border-success/50 text-success' }[tone];
  return <span className={`badge border ${cls}`}>{children}</span>;
};
const Box = ({ label, value, badge, tone, hint, big }) => (
  <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
    <div><p className="text-sm text-muted-foreground">{label}</p><p className={big ? 'text-2xl font-bold' : 'text-lg font-bold'}>{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>
    {badge && <Badge tone={tone}>{badge}</Badge>}
  </div>
);
const SectionTitle = ({ icon: Icon, color, children }) => (
  <h3 className="flex items-center gap-2 font-semibold" style={{ color }}><Icon size={17} />{children}</h3>
);
const Switch = ({ on, onChange }) => (
  <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-secondary'}`}>
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);
const NumField = ({ label, value, onChange, suffix, placeholder, hintLinks, half }) => (
  <div className={half ? '' : 'col-span-2 md:col-span-1'}>
    <label className="label">{label}</label>
    <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <input className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/50" inputMode="decimal" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
    </div>
    {hintLinks && <p className="mt-1 text-xs text-muted-foreground">{hintLinks.label}: {hintLinks.opts.map((o, i) => (
      <React.Fragment key={o[0]}>{i > 0 && ' | '}<button type="button" className="text-primary hover:underline" onClick={() => onChange(o[1])}>{o[0]}</button></React.Fragment>
    ))}</p>}
  </div>
);

const PRESETS = [
  ['Venda Direta / Pix (Sem Taxa)', 0, 0],
  ['Shopee Padrão (14% + R$3)', 14, 3],
  ['Shopee Frete Grátis (20% + R$3)', 20, 3],
  ['Mercado Livre Clássico (~13% + R$6)', 13, 6],
  ['Mercado Livre Premium (~18% + R$6)', 18, 6],
];
const DONUT = [
  ['Material', '#3b82f6'], ['Energia', '#06b6d4'], ['Máquina', '#a855f7'], ['Consumíveis/Risco', '#94a3b8'],
  ['Lucro', '#22c55e'], ['Mão de obra', '#8b5cf6'], ['Arte/Pintura', '#ec4899'],
];

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p[1]), 0);
  if (total <= 0) return <div className="mx-auto h-40 w-40 rounded-full border-8 border-muted/40" />;
  let acc = 0;
  const stops = parts.filter((p) => p[1] > 0).map(([, v, color]) => {
    const from = (acc / total) * 360; acc += v; const to = (acc / total) * 360;
    return `${color} ${from}deg ${to}deg`;
  });
  return <div className="mx-auto h-40 w-40 rounded-full" style={{ background: `conic-gradient(${stops.join(',')})`, WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 26px))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 26px))' }} />;
}

export function Calculator() {
  const { fmt } = useCurrency();
  const [tab, setTab] = useState('simples');

  // ---------- Simples ----------
  const [s, setS] = useState({ kg: '', g: '', paint: false });
  const base = (num(s.kg) / 1000) * num(s.g);
  const clearSimples = () => setS({ kg: '', g: '', paint: false });

  // ---------- Avançada ----------
  const stock = useCollection('stock');
  const toast = useToast();
  const nav = useNavigate();
  const [a, setA] = useState({
    name: '', kg: '', g: '', h: '', min: '', kwh: '', watts: '',
    depOn: false, printerValue: '', life: '',
    failOn: false, failRate: '',
    consOn: false, consumables: [],
    laborOn: false, postMin: '', laborRate: '',
    markup: '100',
    paintOn: false, paintH: '', paintMin: '', paintRate: '',
    preset: 0, commission: '', fixedFee: '',
  });
  const set = (k) => (v) => setA((x) => ({ ...x, [k]: v }));
  const setEv = (k) => (e) => set(k)(e.target.value);

  const addConsumable = () => setA((x) => ({ ...x, consumables: [...x.consumables, { name: '', value: '' }] }));
  const setConsumable = (i, k, v) => setA((x) => ({ ...x, consumables: x.consumables.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));
  const removeConsumable = (i) => setA((x) => ({ ...x, consumables: x.consumables.filter((_, j) => j !== i) }));

  const calc = useMemo(() => {
    const hours = num(a.h) + num(a.min) / 60;
    const material = (num(a.kg) / 1000) * num(a.g);
    const energia = (num(a.watts) / 1000) * hours * num(a.kwh);
    const maquina = a.depOn && num(a.life) > 0 ? (num(a.printerValue) / num(a.life)) * hours : 0;
    const consumiveisLista = a.consOn ? a.consumables.reduce((s2, c) => s2 + num(c.value), 0) : 0;
    const risco = a.failOn ? (material + energia + maquina) * (num(a.failRate) / 100) : 0;
    const consumiveisRisco = consumiveisLista + risco;
    const custoProducao = material + energia + maquina + consumiveisRisco;
    const lucroMarkup = custoProducao * (num(a.markup) / 100);
    const maoDeObra = a.laborOn ? (num(a.postMin) / 60) * num(a.laborRate) : 0;
    const artePintura = a.paintOn ? (num(a.paintH) + num(a.paintMin) / 60) * num(a.paintRate) : 0;
    const liquido = custoProducao + lucroMarkup + maoDeObra + artePintura;
    const comissao = num(a.commission), fixa = num(a.fixedFee);
    const bruto = comissao > 0 || fixa > 0 ? (liquido + fixa) / (1 - Math.min(comissao, 95) / 100) : liquido;
    const taxaMarketplace = bruto - liquido;
    const lucroLiquido = lucroMarkup + maoDeObra + artePintura;
    return { material, energia, maquina, consumiveisRisco, custoProducao, lucroMarkup, maoDeObra, artePintura, bruto, taxaMarketplace, lucroLiquido, hasTax: comissao > 0 || fixa > 0 };
  }, [a]);

  const applyPreset = (i) => { const [, c, f] = PRESETS[i]; setA((x) => ({ ...x, preset: i, commission: c || '', fixedFee: f || '' })); };

  const salvarEstoque = async () => {
    if (!a.name.trim()) return toast('Informe o nome do produto', 'err');
    try {
      await stock.create({ type: 'produto', name: a.name, qty: 1, unit: 'un', cost: calc.custoProducao + calc.maoDeObra + calc.artePintura, price: calc.bruto, weight: num(a.g), printH: num(a.h) + num(a.min) / 60 });
      toast('Produto salvo no estoque');
    } catch (e) { toast(e.message, 'err'); }
  };
  const gerarOrcamento = () => nav('/orcamento', { state: { item: { name: a.name || 'Peça personalizada', qty: 1, price: String(calc.bruto.toFixed(2)) } } });
  const exportarPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const d = new jsPDF({ unit: 'mm', format: 'a4' }); let y = 20;
    d.setFont('helvetica', 'bold').setFontSize(16).text(a.name || 'Cálculo de preço', 15, y); y += 10;
    d.setFont('helvetica', 'normal').setFontSize(11);
    const line = (l, v) => { d.text(l, 15, y); d.text(v, 195, y, { align: 'right' }); y += 7; };
    line('Material', fmt(calc.material)); line('Energia', fmt(calc.energia)); line('Máquina', fmt(calc.maquina)); line('Consumíveis/Risco', fmt(calc.consumiveisRisco));
    d.setFont('helvetica', 'bold'); line('Custo de Produção', fmt(calc.custoProducao)); d.setFont('helvetica', 'normal');
    line('Lucro (Markup)', fmt(calc.lucroMarkup)); line('+ Mão de Obra', fmt(calc.maoDeObra)); line('+ Arte/Pintura', fmt(calc.artePintura));
    if (calc.hasTax) line('Taxa Marketplace (repassada)', fmt(calc.taxaMarketplace));
    y += 3; d.setFont('helvetica', 'bold').setFontSize(14); line('Preço Final de Venda', fmt(calc.bruto));
    d.setFontSize(11).setFont('helvetica', 'normal'); line('Lucro Líquido', fmt(calc.lucroLiquido));
    d.save(`calculo-${(a.name || 'peca').replace(/\W+/g, '_')}.pdf`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'simples', label: 'Simples' }, { id: 'avancada', label: 'Avançada' }]} />

      {tab === 'simples' ? (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="card space-y-4">
            <SectionTitle icon={CalcIcon} color="#60a5fa">1) Insumos</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <NumField label="Preço do filamento (R$/kg)" suffix="R$/kg" placeholder="Ex.: 99,90" value={s.kg} onChange={(v) => setS({ ...s, kg: v })} />
              <NumField label="Peso da peça (em gramas)" suffix="g" placeholder="Ex.: 125" value={s.g} onChange={(v) => setS({ ...s, g: v })} />
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Quanto você pagou no quilo do filamento.</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary" onClick={() => {}}><CalcIcon size={15} />Calcular</button>
              <button className="btn-ghost" onClick={clearSimples}><Trash2 size={15} />Limpar</button>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold">2) Valores básicos</h3>
            <Box label="Custo de produção" value={fmt(base)} badge="base" tone="blue" />
            <div className="grid gap-3 md:grid-cols-2">
              <Box label="Varejo (×3)" value={fmt(base * 3)} badge="x3" tone="green" />
              <Box label="Consumidor (×5)" value={fmt(base * 5)} badge="x5" tone="green" />
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold">3) Peça personalizada</h3>
            <Box label="Preço mínimo" value={fmt(base * (s.paint ? 20 : 10))} badge="mínimo" tone="green" hint="Use como mínimo. Aumente conforme tempo e exclusividade." />
            <button type="button" onClick={() => setS({ ...s, paint: !s.paint })}
              className={`btn-ghost !justify-start ${s.paint ? '!border-primary/60 !text-primary' : ''}`}>
              <Tag size={15} />Pintada à mão? ({s.paint ? 'Sim' : 'Não'})
            </button>
          </div>

          <p className="text-xs text-muted-foreground">* Fórmula: custo = (preço/kg ÷ 1000) × gramas.</p>
          <p className="text-xs text-muted-foreground">* Varejo (×3), Consumidor (×5), Personalizada (×10).</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="card">
              <h3 className="mb-2 font-semibold">Nome do Produto</h3>
              <label className="label">Identificação do produto (para salvar no estoque)</label>
              <input className="input" placeholder="Ex: Chaveiro personalizado, Vaso decorativo..." value={a.name} onChange={setEv('name')} />
            </div>

            <div className="card space-y-4">
              <SectionTitle icon={Zap} color="#60a5fa">1. Material e Impressão</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <NumField label="Preço do Filamento (1kg)" suffix="R$" placeholder="65" value={a.kg} onChange={set('kg')} hintLinks={{ label: 'Médias', opts: [['PLA R$110', '110'], ['ABS R$80', '80'], ['Flex R$180', '180']] }} />
                <NumField label="Peso da Peça" suffix="g" placeholder="50" value={a.g} onChange={set('g')} hintLinks={{ label: 'Exemplos', opts: [['30g', '30'], ['100g', '100']] }} />
                <div>
                  <label className="label">Tempo de Impressão</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-input bg-muted/40 px-3"><input className="w-full bg-transparent py-2 text-sm outline-none" inputMode="decimal" placeholder="5" value={a.h} onChange={setEv('h')} /><span className="text-xs text-muted-foreground">h</span></div>
                    <span>:</span>
                    <div className="flex items-center gap-1 rounded-lg border border-input bg-muted/40 px-3"><input className="w-full bg-transparent py-2 text-sm outline-none" inputMode="decimal" placeholder="30" value={a.min} onChange={setEv('min')} /><span className="text-xs text-muted-foreground">min</span></div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Exemplos: <button className="text-primary hover:underline" onClick={() => setA((x) => ({ ...x, h: '1', min: '30' }))}>1h30</button> | <button className="text-primary hover:underline" onClick={() => setA((x) => ({ ...x, h: '3', min: '45' }))}>3h45</button> | <button className="text-primary hover:underline" onClick={() => setA((x) => ({ ...x, h: '8', min: '0' }))}>8h</button></p>
                </div>
                <NumField label="Custo Energia (kWh)" suffix="R$" placeholder="0,92" value={a.kwh} onChange={set('kwh')} hintLinks={{ label: 'Média', opts: [['R$0,92', '0.92'], ['R$1,10', '1.10']] }} />
                <NumField label="Potência Máquina" suffix="W" placeholder="150" value={a.watts} onChange={set('watts')} hintLinks={{ label: 'Média', opts: [['150W', '150'], ['300W', '300']] }} />
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between"><SectionTitle icon={Cog} color="#a855f7">2. Custos da Máquina</SectionTitle><label className="flex items-center gap-2 text-sm">Depreciação? <Switch on={a.depOn} onChange={set('depOn')} /></label></div>
              {a.depOn && <p className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-warning">Atenção: Esta opção aumenta consideravelmente o valor da peça ao incluir o custo de depreciação do equipamento.</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <NumField label="Valor da Impressora" suffix="R$" placeholder="2500" value={a.printerValue} onChange={set('printerValue')} hintLinks={{ label: 'Média', opts: [['R$3.500', '3500']] }} />
                <NumField label="Vida Útil" suffix="Horas" placeholder="3000" value={a.life} onChange={set('life')} hintLinks={{ label: 'Padrão', opts: [['3000h', '3000']] }} />
              </div>
              <div className="flex items-center justify-between border-t pt-3"><span className="text-sm">Risco de Falha?</span><Switch on={a.failOn} onChange={set('failOn')} /></div>
              <NumField label="Taxa de Falha (Risco)" suffix="%" placeholder="15" value={a.failRate} onChange={set('failRate')} hintLinks={{ label: 'Média', opts: [['10%', '10'], ['15%', '15']] }} />
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between"><SectionTitle icon={ShoppingCart} color="#f59e0b">Consumíveis</SectionTitle><label className="flex items-center gap-2 text-sm">Incluir? <Switch on={a.consOn} onChange={set('consOn')} /></label></div>
              <div className="flex items-center justify-between"><p className="text-sm font-medium">Lista de Consumíveis</p><button type="button" onClick={addConsumable} className="flex items-center gap-1 text-sm text-primary hover:underline"><Plus size={14} />Adicionar</button></div>
              {a.consumables.length === 0 ? <p className="text-sm italic text-muted-foreground">Nenhum consumível adicionado. Clique em + para adicionar.</p> : (
                <div className="space-y-2">
                  {a.consumables.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="input flex-1" placeholder="Nome do consumível" value={c.name} onChange={(e) => setConsumable(i, 'name', e.target.value)} />
                      <input className="input !w-28" placeholder="0,00" inputMode="decimal" value={c.value} onChange={(e) => setConsumable(i, 'value', e.target.value)} />
                      <button onClick={() => removeConsumable(i)} className="text-destructive"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <p className="flex justify-between border-t pt-2 text-sm font-semibold"><span>Total</span>{fmt(a.consumables.reduce((s2, c) => s2 + num(c.value), 0))}</p>
                </div>
              )}
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between"><SectionTitle icon={Clock} color="#8b5cf6">3. Mão de Obra Básica</SectionTitle><label className="flex items-center gap-2 text-sm">Incluir? <Switch on={a.laborOn} onChange={set('laborOn')} /></label></div>
              <div className="grid gap-4 md:grid-cols-2">
                <NumField label="Pós-Processamento" suffix="Min" placeholder="20" value={a.postMin} onChange={set('postMin')} hintLinks={{ label: 'Sugestão', opts: [['15min', '15'], ['30min', '30']] }} />
                <NumField label="Seu Valor Hora" suffix="R$/h" placeholder="20" value={a.laborRate} onChange={set('laborRate')} hintLinks={{ label: 'Sugestão', opts: [['R$20', '20'], ['R$30', '30']] }} />
              </div>
            </div>

            <div className="card space-y-3">
              <SectionTitle icon={TrendingUp} color="#60a5fa">4. Lucro Desejado (Markup)</SectionTitle>
              <p className="text-xs text-muted-foreground">Aplica-se aos custos de produção. A pintura é somada depois.</p>
              <NumField label="Markup (Margem de Lucro)" suffix="%" placeholder="100" value={a.markup} onChange={set('markup')} hintLinks={{ label: 'Sugestão', opts: [['50%', '50'], ['100%', '100'], ['150%', '150']] }} />
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between"><SectionTitle icon={Tag} color="#ec4899">5. Pintura e Personalização</SectionTitle><label className="flex items-center gap-2 text-sm">Incluir? <Switch on={a.paintOn} onChange={set('paintOn')} /></label></div>
              <p className="text-xs text-muted-foreground">O valor abaixo é somado ao preço final (não multiplica pelo Markup).</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Tempo de Pintura</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-input bg-muted/40 px-3"><input className="w-full bg-transparent py-2 text-sm outline-none" inputMode="decimal" placeholder="2" value={a.paintH} onChange={setEv('paintH')} /><span className="text-xs text-muted-foreground">h</span></div>
                    <span>:</span>
                    <div className="flex items-center gap-1 rounded-lg border border-input bg-muted/40 px-3"><input className="w-full bg-transparent py-2 text-sm outline-none" inputMode="decimal" placeholder="30" value={a.paintMin} onChange={setEv('paintMin')} /><span className="text-xs text-muted-foreground">min</span></div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Sugestão: <button className="text-primary hover:underline" onClick={() => setA((x) => ({ ...x, paintH: '1', paintMin: '30' }))}>1h30</button> | <button className="text-primary hover:underline" onClick={() => setA((x) => ({ ...x, paintH: '2', paintMin: '0' }))}>2h</button> | <button className="text-primary hover:underline" onClick={() => setA((x) => ({ ...x, paintH: '4', paintMin: '0' }))}>4h</button></p>
                </div>
                <NumField label="Valor Hora Artística" suffix="R$/h" placeholder="20,00" value={a.paintRate} onChange={set('paintRate')} hintLinks={{ label: 'Sugestão', opts: [['R$20', '20'], ['R$35', '35']] }} />
              </div>
            </div>

            <div className="card space-y-3">
              <SectionTitle icon={ShoppingCart} color="#f97316">6. Taxas de Venda</SectionTitle>
              <label className="label">Predefinições</label>
              <select className="input" value={a.preset} onChange={(e) => applyPreset(Number(e.target.value))}>
                {PRESETS.map((p, i) => <option key={p[0]} value={i}>{p[0]}</option>)}
              </select>
              <div className="grid gap-4 md:grid-cols-2">
                <NumField label="Comissão" suffix="%" placeholder="0" value={a.commission} onChange={set('commission')} />
                <NumField label="Taxa Fixa" suffix="R$" placeholder="0,00" value={a.fixedFee} onChange={set('fixedFee')} />
              </div>
              <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                O sistema calcula um preço "Bruto" para que, após o desconto do marketplace, você receba o valor exato calculado.<br />
                <b>Aviso:</b> Atenção: Os valores predefinidos são apenas uma base de referência. Essas taxas costumam ser alteradas com frequência pelos marketplaces, verifique sempre os valores atualizados.
              </p>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-3 lg:self-start">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-center text-white shadow-lg">
              <p className="text-sm opacity-90">Preço Final de Venda</p>
              <p className="text-3xl font-extrabold">{fmt(calc.bruto)}</p>
              <p className="mt-2 text-sm font-semibold text-success-foreground" style={{ color: '#bbf7d0' }}>Lucro Líquido: {fmt(calc.lucroLiquido)}</p>
              {calc.bruto > 0 && <p className="text-xs opacity-80">Equivale a {((calc.lucroLiquido / calc.bruto) * 100).toFixed(1)}% do valor final</p>}
            </div>

            <div className="card space-y-2">
              <h3 className="mb-1 font-semibold">Detalhamento</h3>
              {[['Material', calc.material], ['Energia', calc.energia], ['Máquina', calc.maquina], ['Consumíveis/Risco', calc.consumiveisRisco]].map(([l, v]) => (
                <p key={l} className="flex justify-between text-sm text-muted-foreground"><span>{l}</span><span className="text-foreground">{fmt(v)}</span></p>
              ))}
              <p className="flex justify-between border-t pt-2 text-sm font-bold"><span>Custo Produção</span>{fmt(calc.custoProducao)}</p>
              <p className="flex justify-between text-sm font-bold text-success"><span>Lucro (Markup)</span>{fmt(calc.lucroMarkup)}</p>
              <p className="flex justify-between text-sm font-semibold" style={{ color: '#a78bfa' }}><span>+ Mão de Obra</span>{fmt(calc.maoDeObra)}</p>
              <p className="flex justify-between text-sm font-semibold text-pink-400"><span>+ Arte/Pintura</span>{fmt(calc.artePintura)}</p>
              {calc.hasTax && (
                <div className="border-t pt-2">
                  <p className="flex justify-between text-sm font-semibold text-warning"><span>Taxa Marketplace</span>{fmt(calc.taxaMarketplace)}</p>
                  <p className="text-xs text-muted-foreground">Repassada ao cliente</p>
                </div>
              )}
              <p className="pt-2 text-center text-sm font-medium text-muted-foreground">Distribuição do Preço</p>
              <Donut parts={[[DONUT[0][0], calc.material, DONUT[0][1]], [DONUT[1][0], calc.energia, DONUT[1][1]], [DONUT[2][0], calc.maquina, DONUT[2][1]], [DONUT[3][0], calc.consumiveisRisco, DONUT[3][1]], [DONUT[4][0], calc.lucroMarkup, DONUT[4][1]], [DONUT[5][0], calc.maoDeObra, DONUT[5][1]], [DONUT[6][0], calc.artePintura, DONUT[6][1]]]} />
            </div>

            <button onClick={salvarEstoque} className="btn-primary w-full"><Save size={16} />Salvar no Estoque</button>
            <button onClick={gerarOrcamento} className="btn-ghost w-full"><FileText size={16} />Gerar Orçamento</button>
            <button onClick={exportarPdf} className="btn-ghost w-full"><Download size={16} />Exportar PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}

const TO_MM = { mm: 1, cm: 10, m: 1000 };
export function Scale() {
  const [o, setO] = useState({ v: '', u: 'mm' }); const [d, setD] = useState({ v: '', u: 'mm' });
  const pct = num(o.v) && num(d.v) ? ((num(d.v) * TO_MM[d.u]) / (num(o.v) * TO_MM[o.u])) * 100 : null;
  const Box = ({ title, st, set }) => (
    <Field label={title}><div className="flex gap-2"><input className="input" inputMode="decimal" value={st.v} onChange={(e) => set({ ...st, v: e.target.value })} />
      <div className="flex overflow-hidden rounded-lg border">{Object.keys(TO_MM).map((u) => <button key={u} onClick={() => set({ ...st, u })} className={`px-3 text-sm ${st.u === u ? 'bg-primary text-white' : ''}`}>{u}</button>)}</div></div></Field>
  );
  return (
    <div className="card mx-auto max-w-xl space-y-5">
      <div><h3 className="font-semibold">Calculadora de Escala</h3><p className="text-sm text-muted-foreground">Descubra a escala correta para ampliar ou reduzir sua peça no fatiador</p></div>
      <Box title="TAMANHO ORIGINAL (ESCALA 100%)" st={o} set={setO} /><Box title="TAMANHO DESEJADO" st={d} set={setD} />
      <div className="rounded-xl border bg-primary/10 py-6 text-center"><p className="text-4xl font-extrabold text-primary">{pct === null ? '--%' : pct.toFixed(2).replace(/\.?0+$/, '') + '%'}</p><p className="text-sm text-muted-foreground">{pct === null ? 'Preencha os dois tamanhos para ver o resultado' : 'Escala a aplicar no fatiador'}</p></div>
      <button className="btn-ghost" onClick={() => { setO({ v: '', u: 'mm' }); setD({ v: '', u: 'mm' }); }}>Limpar</button>
      <p className="text-xs text-muted-foreground">Dica: selecione todas as suas peças e coloque o valor novo da escala. Não esqueça de deixar marcado o quadrado de "alterar tudo uniformemente".</p>
    </div>
  );
}

const CHECKS = {
  'Antes de imprimir': ['Mesa nivelada e limpa (álcool isopropílico)', 'Filamento seco e sem enroscos no rolo', 'Bico limpo e sem resíduos', 'Temperatura correta para o material', 'Aderência na 1ª camada verificada', 'Suportes/brim configurados quando necessário'],
  'Durante a impressão': ['Acompanhar as primeiras camadas', 'Ventilação da peça adequada', 'Sem ruídos ou pulos de passo', 'Filamento suficiente para a peça inteira'],
  'Depois de imprimir': ['Aguardar esfriar antes de remover', 'Remover suportes com cuidado', 'Conferir medidas e encaixes', 'Acabamento (lixa/pintura), se necessário', 'Embalar e etiquetar o pedido'],
};
export function Checklist() {
  const [done, setDone] = useState(() => { try { return JSON.parse(localStorage.getItem('checklist3d') || '{}'); } catch { return {}; } });
  const toggle = (k) => setDone((d) => { const n = { ...d, [k]: !d[k] }; try { localStorage.setItem('checklist3d', JSON.stringify(n)); } catch {} return n; });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {Object.entries(CHECKS).map(([g, items]) => (
        <div key={g} className="card"><h3 className="mb-2 font-semibold">{g}</h3>
          {items.map((i) => <label key={i} className="flex items-center gap-3 py-1.5 text-sm"><input type="checkbox" checked={!!done[i]} onChange={() => toggle(i)} /><span className={done[i] ? 'text-muted-foreground line-through' : ''}>{i}</span></label>)}</div>))}
      <button className="btn-ghost" onClick={() => { setDone({}); try { localStorage.removeItem('checklist3d'); } catch {} }}>Limpar marcações</button>
    </div>
  );
}
