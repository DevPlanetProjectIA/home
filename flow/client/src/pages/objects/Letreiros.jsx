import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Type as TypeIcon, FileDown, Plus, Trash2 } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { textGeometry } from '../../lib/three/text.js';
import { downloadSingleSTL, downloadMultipartZip } from '../../lib/three/export.js';

const ESTILOS = [
  { id: 0, label: 'Começar do Zero', back: '', front: [] },
  { id: 1, label: 'Estilo 1', back: 'DEUS', front: [{ t: 'nunca', x: -30, y: 10 }, { t: 'falha', x: 32, y: -14 }], color: '#f59e0b' },
  { id: 2, label: 'Estilo 2', back: 'MÃE', front: [{ t: 'Eu Te Amo', x: 0, y: -20 }], color: '#ef4444' },
  { id: 3, label: 'Estilo 3', back: 'A', front: [{ t: 'nome', x: 20, y: -8 }], color: '#3b82f6' },
  { id: 4, label: 'Estilo 4', back: 'Cursiva', front: [], color: '#a855f7' },
  { id: 5, label: 'Estilo 5', back: 'TIME', front: [], color: '#22c55e' },
];

export default function Letreiros() {
  const [estilo, setEstilo] = useState(1);
  const [back, setBack] = useState('DEUS');
  const [backSize, setBackSize] = useState(26);
  const [thick, setThick] = useState(4);
  const [corBack, setCorBack] = useState('#f8fafc');
  const [fronts, setFronts] = useState([{ t: 'nunca', x: -30, y: 10, size: 9 }, { t: 'falha', x: 32, y: -14, size: 9 }]);
  const [corFront, setCorFront] = useState('#f59e0b');
  const [parts, setParts] = useState([]);

  const applyEstilo = (id) => {
    const e = ESTILOS.find((x) => x.id === id); setEstilo(id);
    setBack(e.back); setFronts(e.front.map((f) => ({ ...f, size: 9 }))); if (e.color) setCorFront(e.color);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const newParts = [];
      if (back) {
        const g = await textGeometry(back, { font: 'display', size: backSize, height: thick, curveSegments: 6 });
        newParts.push({ geometry: g, color: corBack, name: 'palavra-tras' });
      }
      for (let i = 0; i < fronts.length; i++) {
        const f = fronts[i];
        if (!f.t) continue;
        const g = await textGeometry(f.t, { font: 'bold', size: f.size || 9, height: thick * 0.7, curveSegments: 5 });
        g.translate(f.x || 0, f.y || 0, thick + 0.3);
        newParts.push({ geometry: g, color: corFront, name: `palavra-frente-${i}` });
      }
      if (alive) setParts(newParts);
    })();
    return () => { alive = false; };
  }, [back, backSize, thick, corBack, fronts, corFront]);

  const triCount = parts.reduce((s, p) => s + (p.geometry?.index ? p.geometry.index.count / 3 : 0), 0);
  const setFront = (i, k, v) => setFronts((arr) => arr.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><TypeIcon size={18} className="text-primary" />Gerador de Letreiros</h2>
          <p className="text-sm text-muted-foreground">Palavra grande atrás + palavras frontais e adereços ilimitados.</p>
          <p className="label mt-4">Estilo</p>
          <div className="grid grid-cols-2 gap-2">
            {ESTILOS.map((e) => (
              <button key={e.id} onClick={() => applyEstilo(e.id)} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${estilo === e.id ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{e.label}</button>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <p className="label">Palavra de Trás</p>
          <input className="input" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Ex: DEUS" maxLength={16} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tamanho</label><input type="range" min={12} max={50} value={backSize} onChange={(e) => setBackSize(Number(e.target.value))} className="w-full accent-primary" /></div>
            <div><label className="label">Cor</label><input type="color" value={corBack} onChange={(e) => setCorBack(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
          </div>
          <div><label className="label">Espessura</label><input type="range" min={2} max={10} step={0.5} value={thick} onChange={(e) => setThick(Number(e.target.value))} className="w-full accent-primary" /></div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between"><p className="label !mb-0">Palavras Frontais</p><button className="btn-ghost !py-1 !px-2" onClick={() => setFronts((f) => [...f, { t: '', x: 0, y: 0, size: 8 }])}><Plus size={14} /></button></div>
          {fronts.map((f, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-2.5">
              <div className="flex gap-2">
                <input className="input flex-1" value={f.t} onChange={(e) => setFront(i, 't', e.target.value)} placeholder="Palavra" />
                <button className="btn-ghost !px-2" onClick={() => setFronts((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>X<input type="range" min={-60} max={60} value={f.x} onChange={(e) => setFront(i, 'x', Number(e.target.value))} className="w-full accent-primary" /></div>
                <div>Y<input type="range" min={-40} max={40} value={f.y} onChange={(e) => setFront(i, 'y', Number(e.target.value))} className="w-full accent-primary" /></div>
                <div>Tam.<input type="range" min={4} max={16} value={f.size} onChange={(e) => setFront(i, 'size', Number(e.target.value))} className="w-full accent-primary" /></div>
              </div>
            </div>
          ))}
          <div><label className="label">Cor das palavras frontais</label><input type="color" value={corFront} onChange={(e) => setCorFront(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
        </div>

        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => downloadMultipartZip(parts, 'letreiro')}><FileDown size={16} />Baixar Multiparts</button>
          <button className="btn-ghost w-full" onClick={() => downloadSingleSTL(parts, 'letreiro.stl')}>STL único</button>
        </div>
      </div>

      <Viewer3D parts={parts} height={620} footer={<div className="flex justify-between"><span>Letreiro • {back || '—'} • Triângulos: {Math.round(triCount)}</span><span>Unidade: mm</span></div>} />
    </div>
  );
}
