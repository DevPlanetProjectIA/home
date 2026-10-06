import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { findBestRecipe, rgbToHsl, hexToRgb } from '../../lib/colorMix.js';

const PRIMARIES = [
  { hex: '#ffffff', label: 'Branco' }, { hex: '#000000', label: 'Preto' },
  { hex: '#ff2d2d', label: 'Vermelho' }, { hex: '#ffe100', label: 'Amarelo' }, { hex: '#0057ff', label: 'Azul' },
  { hex: '#00b0a3', label: 'Ciano' }, { hex: '#e6007e', label: 'Magenta' }, { hex: '#ff8a00', label: 'Laranja' },
];

export default function MixCores() {
  const [target, setTarget] = useState('#7c4dff');
  const [recipe, setRecipe] = useState(null);
  const hsl = rgbToHsl(hexToRgb(target));

  const calcular = () => setRecipe(findBestRecipe(target, PRIMARIES, { sizes: [2, 3] }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold"><Palette size={18} className="text-primary" />Mix de Cores</h2>
        <p className="text-sm text-muted-foreground">Combine tintas primárias para chegar em qualquer cor de acabamento/pintura.</p>
        <div className="mt-4 flex items-center gap-3">
          <input type="color" value={target} onChange={(e) => setTarget(e.target.value)} className="h-14 w-20 cursor-pointer rounded border bg-transparent" />
          <input className="input flex-1" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Luminância</p><p className="font-semibold">{hsl.l}%</p></div>
          <div><p className="text-xs text-muted-foreground">Saturação</p><p className="font-semibold">{hsl.s}%</p></div>
        </div>
        <button className="btn-primary mt-4 w-full" onClick={calcular}>Calcular receita de tinta</button>

        <p className="label mt-5">Paleta de tintas base</p>
        <div className="flex flex-wrap gap-2">
          {PRIMARIES.map((p) => <span key={p.hex} title={p.label} className="h-7 w-7 rounded-full border-2" style={{ background: p.hex }} />)}
        </div>
      </div>

      <div className="card">
        <p className="label">Receita sugerida</p>
        {!recipe ? <p className="text-sm text-muted-foreground">Escolha uma cor alvo e clique em calcular.</p> : (
          <div className="flex items-center gap-4">
            <span className="h-20 w-20 shrink-0 rounded-xl border-2" style={{ background: recipe.hex }} />
            <div className="text-sm">
              <p className="mb-1 font-semibold">Resultado: {recipe.hex.toUpperCase()}</p>
              <ul className="space-y-1">
                {recipe.combo.map((c, i) => recipe.weights[i] > 0 && (
                  <li key={i} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border" style={{ background: c.hex }} />{c.label}: <b>{recipe.weights[i]}%</b></li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Comece com pouca tinta e vá ajustando as proporções aos poucos — a estimativa é visual.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
