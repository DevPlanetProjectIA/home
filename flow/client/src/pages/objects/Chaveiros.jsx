import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { KeyRound, Type as TypeIcon, FileDown } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { CHAVEIRO_CATEGORIES } from '../../lib/three/chaveiroPresets.js';
import { ringGeometry } from '../../lib/three/shapes.js';
import { textGeometry } from '../../lib/three/text.js';
import { downloadSingleSTL, downloadMultipartZip } from '../../lib/three/export.js';

const LABELS = {
  circulo: 'Círculo', quadrado: 'Quadrado', coracao: 'Coração', estrela: 'Estrela',
  feliz: 'Feliz', piscando: 'Piscando', apaixonado: 'Apaixonado', triste: 'Triste', bravo: 'Bravo', lingua: 'Língua', cool: 'Cool', beijo: 'Beijo', morto: 'Morto',
  gato: 'Gato', cachorro: 'Cachorro', coelho: 'Coelho', urso: 'Urso',
  pizza: 'Pizza', hamburguer: 'Hambúrguer', sorvete: 'Sorvete', donut: 'Donut',
};
const THICK = 3.5;

function extrudeAt(shape, x, y, depth, rot = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 1, curveSegments: 24 });
  if (rot) g.rotateZ(rot);
  g.translate(x, y, 0);
  return g;
}

export default function Chaveiros() {
  const [cat, setCat] = useState('Emoticons');
  const [preset, setPreset] = useState('feliz');
  const [corBase, setCorBase] = useState('#facc15');
  const [corDetalhe, setCorDetalhe] = useState('#1f2937');
  const [corAccent, setCorAccent] = useState('#ef4444');
  const [tamanho, setTamanho] = useState(30);
  const [textoOn, setTextoOn] = useState(false);
  const [texto, setTexto] = useState('João');
  const [parts, setParts] = useState([]);

  const keys = Object.keys(CHAVEIRO_CATEGORIES[cat]);
  useEffect(() => { if (!keys.includes(preset)) setPreset(keys[0]); }, [cat]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const def = CHAVEIRO_CATEGORIES[cat]?.[preset]?.(tamanho);
      if (!def) return;
      const colorFor = (role) => (role === 'detail' ? corDetalhe : role === 'accent' ? corAccent : corBase);
      const newParts = [{ geometry: extrudeAt(def.base.shape, def.base.x, def.base.y, THICK), color: colorFor(def.base.role), name: 'base' }];
      def.extras.forEach((e, i) => newParts.push({ geometry: extrudeAt(e.shape, e.x, e.y, THICK + 0.8, e.rot || 0), color: colorFor(e.role), name: `detalhe-${i}` }));

      const bb = new THREE.Box3();
      newParts.forEach((p) => { p.geometry.computeBoundingBox(); bb.union(p.geometry.boundingBox); });
      const ring = ringGeometry(3.6, 1.3, 24);
      newParts.push({ geometry: ring, color: corBase, position: [0, bb.max.y + 3.6, THICK / 2], rotation: [Math.PI / 2, 0, 0], name: 'argola' });

      if (textoOn && texto) {
        const t = await textGeometry(texto, { font: 'bold', size: tamanho * 0.32, height: 1.4, curveSegments: 5 });
        const tb = t.boundingBox;
        const maxW = (bb.max.x - bb.min.x) * 0.95;
        const s = Math.min(1, maxW / Math.max(1, tb.max.x - tb.min.x));
        t.scale(s, s, 1);
        t.translate(0, bb.min.y - 5 - (tb.max.y - tb.min.y) * s / 2, 0);
        newParts.push({ geometry: t, color: corDetalhe, name: 'texto' });
      }
      if (alive) setParts(newParts);
    })();
    return () => { alive = false; };
  }, [cat, preset, tamanho, corBase, corDetalhe, corAccent, textoOn, texto]);

  const triCount = parts.reduce((s, p) => s + (p.geometry?.index ? p.geometry.index.count / 3 : 0), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} className="text-primary" />Gerador de Chaveiros</h2>
          <p className="text-sm text-muted-foreground">Chaveiros multi-cor com presets e texto opcional.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(CHAVEIRO_CATEGORIES).map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${cat === c ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{c}</button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {keys.map((k) => (
              <button key={k} onClick={() => setPreset(k)} className={`rounded-lg border px-1 py-2 text-center text-[11px] font-medium ${preset === k ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{LABELS[k] || k}</button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground"><span>TAMANHO</span><span>{tamanho}mm</span></div>
            <input type="range" min={18} max={50} value={tamanho} onChange={(e) => setTamanho(Number(e.target.value))} className="w-full accent-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Cor base</label><input type="color" value={corBase} onChange={(e) => setCorBase(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
            <div><label className="label">Detalhe</label><input type="color" value={corDetalhe} onChange={(e) => setCorDetalhe(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
            <div><label className="label">Destaque</label><input type="color" value={corAccent} onChange={(e) => setCorAccent(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
          </div>
        </div>

        <div className="card">
          <p className="label flex items-center gap-2"><TypeIcon size={15} />Texto (opcional)</p>
          <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={textoOn} onChange={(e) => setTextoOn(e.target.checked)} />Incluir texto no chaveiro</label>
          {textoOn && <input className="input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex: João" maxLength={14} />}
        </div>

        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => downloadMultipartZip(parts, 'chaveiro')}><FileDown size={16} />Baixar Multiparts</button>
          <button className="btn-ghost w-full" onClick={() => downloadSingleSTL(parts, 'chaveiro.stl')}>STL único</button>
        </div>
      </div>

      <Viewer3D parts={parts} height={620} footer={<div className="flex justify-between"><span>Chaveiro • {LABELS[preset] || preset} • Triângulos: {Math.round(triCount)}</span><span>Unidade: mm</span></div>} />
    </div>
  );
}
