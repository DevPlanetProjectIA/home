import React, { useMemo, useState } from 'react';
import { FlaskConical, Pipette } from 'lucide-react';
import { useCollection } from '../../lib/ctx.jsx';
import { mixWeighted, rgbToHsl, hexToRgb, findBestRecipe, colorDistance } from '../../lib/colorMix.js';

const FIL_TYPES = ['PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'ASA', 'PC', 'HIPS', 'Outro'];
const RATIOS_2 = [[75, 25], [50, 50], [25, 75]];
const RATIOS_3 = [[50, 25, 25], [34, 33, 33], [25, 50, 25], [25, 25, 50]];

function Swatch({ hex, label, onClick, active }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs ${active ? 'border-primary bg-primary/10' : 'hover:bg-secondary/50'}`}>
      <span className="h-6 w-6 shrink-0 rounded-full border" style={{ background: hex }} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function MixFilamento() {
  const { items } = useCollection('stock');
  const [ftype, setFtype] = useState('PLA');
  const [target, setTarget] = useState('#06b6a4');
  const [recipe, setRecipe] = useState(null);

  const filaments = useMemo(
    () => items.filter((i) => i.type === 'filamento' && (i.ftype || 'PLA') === ftype && i.color?.hex),
    [items, ftype]
  );

  const pairCombos = useMemo(() => {
    const out = [];
    for (let i = 0; i < filaments.length; i++) for (let j = i + 1; j < filaments.length; j++) {
      RATIOS_2.forEach(([a, b]) => {
        const hex = mixWeighted([{ hex: filaments[i].color.hex, weight: a }, { hex: filaments[j].color.hex, weight: b }]);
        out.push({ hex, label: `${filaments[i].color.name || filaments[i].name} ${a}% + ${filaments[j].color.name || filaments[j].name} ${b}%` });
      });
    }
    return out;
  }, [filaments]);

  const tripleCombos = useMemo(() => {
    const out = [];
    for (let i = 0; i < filaments.length; i++) for (let j = i + 1; j < filaments.length; j++) for (let k = j + 1; k < filaments.length; k++) {
      RATIOS_3.forEach(([a, b, c]) => {
        const hex = mixWeighted([{ hex: filaments[i].color.hex, weight: a }, { hex: filaments[j].color.hex, weight: b }, { hex: filaments[k].color.hex, weight: c }]);
        out.push({ hex, label: `${filaments[i].color.name || filaments[i].name} ${a}% + ${filaments[j].color.name || filaments[j].name} ${b}% + ${filaments[k].color.name || filaments[k].name} ${c}%` });
      });
    }
    return out.slice(0, 60);
  }, [filaments]);

  const [tab2, setTab2] = useState(true);
  const hsl = rgbToHsl(hexToRgb(target));

  const buscarReceita = () => {
    if (filaments.length < 2) return setRecipe(null);
    const palette = filaments.map((f) => ({ hex: f.color.hex, label: f.color.name || f.name }));
    const best = findBestRecipe(target, palette, { sizes: filaments.length >= 3 ? [2, 3] : [2] });
    setRecipe(best);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><FlaskConical size={18} className="text-primary" />Misturador de Filamentos</h2>
          <p className="text-sm text-muted-foreground">Descubra combinações de filamentos para chegar em qualquer cor baseada no seu estoque.</p>
          <p className="mt-2 text-xs text-muted-foreground">Esta ferramenta usa os filamentos cadastrados no seu Estoque como base para simular novas cores no sistema de filamento misto (multi-color) dos fatiadores. Os resultados são apenas uma estimativa visual — cada marca de filamento tem uma tonalidade um pouco diferente, então a cor real impressa pode variar.</p>
        </div>

        <div className="card">
          <p className="label">Escolha o tipo de filamento</p>
          <div className="flex flex-wrap gap-2">
            {FIL_TYPES.map((t) => (
              <button key={t} onClick={() => setFtype(t)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${ftype === t ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{t}</button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{filaments.length} filamento(s) no estoque</p>
          {filaments.length < 2 && <p className="mt-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">Cadastre ao menos 2 filamentos do tipo {ftype} no Estoque para começar a misturar.</p>}
        </div>

        <div className="card">
          <p className="label">Cores que você consegue criar</p>
          <p className="mb-3 text-xs text-muted-foreground">Combinações possíveis com seus filamentos de {ftype}. Toque em uma cor para carregar a receita.</p>
          <div className="mb-3 flex gap-1 rounded-lg border bg-card/60 p-1 text-xs">
            <button onClick={() => setTab2(true)} className={`flex-1 rounded-md py-1.5 ${tab2 ? 'bg-background shadow' : 'text-muted-foreground'}`}>2 filamentos</button>
            <button onClick={() => setTab2(false)} className={`flex-1 rounded-md py-1.5 ${!tab2 ? 'bg-background shadow' : 'text-muted-foreground'}`}>3 filamentos</button>
          </div>
          {(tab2 ? pairCombos : tripleCombos).length === 0
            ? <p className="text-sm text-muted-foreground">Adicione pelo menos {tab2 ? 2 : 3} filamentos do tipo {ftype} no estoque.</p>
            : <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {(tab2 ? pairCombos : tripleCombos).map((c, i) => <Swatch key={i} hex={c.hex} label={c.label} onClick={() => setRecipe({ hex: c.hex, label: c.label })} />)}
              </div>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <p className="label flex items-center gap-2"><Pipette size={15} />Quero chegar nesta cor...</p>
          <p className="mb-3 text-xs text-muted-foreground">Escolha uma cor alvo. Mostraremos quais filamentos do seu estoque chegam perto.</p>
          <div className="flex items-center gap-3">
            <input type="color" value={target} onChange={(e) => setTarget(e.target.value)} className="h-12 w-16 cursor-pointer rounded border bg-transparent" />
            <input className="input flex-1" value={target} onChange={(e) => setTarget(e.target.value)} />
            <button className="btn-primary" onClick={buscarReceita}>Buscar</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Luminância</p><p className="font-semibold">{hsl.l}%</p></div>
            <div><p className="text-xs text-muted-foreground">Saturação</p><p className="font-semibold">{hsl.s}%</p></div>
          </div>
        </div>

        {recipe && (
          <div className="card">
            <p className="label">Receita encontrada</p>
            <div className="flex items-center gap-3">
              <span className="h-16 w-16 shrink-0 rounded-xl border-2" style={{ background: recipe.hex }} />
              <div className="text-sm">
                <p className="font-semibold">{recipe.hex.toUpperCase()}</p>
                {recipe.combo ? (
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {recipe.combo.map((c, i) => <li key={i}>{c.label}: <b className="text-foreground">{recipe.weights[i]}%</b></li>)}
                  </ul>
                ) : <p className="text-muted-foreground">{recipe.label}</p>}
                {recipe.dist !== undefined && <p className="mt-1 text-xs text-muted-foreground">Diferença de cor: {recipe.dist < 20 ? 'muito próxima' : recipe.dist < 60 ? 'aproximada' : 'distante — considere comprar um filamento mais próximo'}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
