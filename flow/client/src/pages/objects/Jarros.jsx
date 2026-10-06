import React, { useMemo, useState } from 'react';
import { Ruler, Waves, Settings2, FileDown } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { buildVaseGeometry, VASE_PRESETS } from '../../lib/three/vase.js';
import { downloadSingleSTL, downloadMultipartZip } from '../../lib/three/export.js';

const PRESETS = [['classico', 'Clássico'], ['moderno', 'Moderno'], ['bojudinho', 'Bojudinho'], ['torcido', 'Torcido']];

function Slider({ label, value, onChange, min, max, step = 1, unit = 'mm' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="rounded border px-1.5 py-0.5 text-foreground">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
function Section({ icon: Icon, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card !p-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3 font-semibold">
        <Icon size={16} className="text-primary" />{title}
      </button>
      {open && <div className="space-y-4 border-t px-4 py-4">{children}</div>}
    </div>
  );
}

export default function Jarros() {
  const [preset, setPreset] = useState('classico');
  const [p, setP] = useState(VASE_PRESETS.classico);
  const [parede, setParede] = useState(2);
  const [fundo, setFundo] = useState(3);
  const [qualidade, setQualidade] = useState(96);
  const [cor, setCor] = useState('#ef4444');
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));

  const geometry = useMemo(() => buildVaseGeometry({ ...p, parede, fundo, qualidade }), [p, parede, fundo, qualidade]);
  const triCount = geometry.index ? geometry.index.count / 3 : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="font-semibold">Gerador de Jarros</h2>
          <p className="text-sm text-muted-foreground">Jarro paramétrico em 3D — exporte STL para imprimir.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map(([id, label]) => (
              <button key={id} onClick={() => { setPreset(id); setP(VASE_PRESETS[id]); }}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold ${preset === id ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{label}</button>
            ))}
          </div>
        </div>

        <Section icon={Ruler} title="Forma">
          <div className="grid grid-cols-2 gap-4">
            <Slider label="Altura" value={p.height} onChange={set('height')} min={40} max={300} />
            <Slider label="Raio Base" value={p.raioBase} onChange={set('raioBase')} min={10} max={100} />
            <Slider label="Raio Boca" value={p.raioBoca} onChange={set('raioBoca')} min={5} max={100} />
            <Slider label="Barriga" value={p.barriga} onChange={set('barriga')} min={5} max={120} />
            <Slider label="Pescoço" value={p.pescoco} onChange={set('pescoco')} min={5} max={100} />
            <Slider label="Torção" value={p.torcao} onChange={set('torcao')} min={0} max={360} unit="°" />
          </div>
        </Section>

        <Section icon={Waves} title="Textura & Ondas">
          <div className="grid grid-cols-2 gap-4">
            <Slider label="Ondas" value={p.ondas} onChange={set('ondas')} min={0} max={24} unit="x" />
            <Slider label="Força" value={p.forca} onChange={set('forca')} min={0} max={15} unit="mm" />
          </div>
        </Section>

        <Section icon={Settings2} title="Acabamento">
          <div className="grid grid-cols-2 gap-4">
            <Slider label="Parede" value={parede} onChange={setParede} min={0.8} max={8} step={0.1} />
            <Slider label="Fundo" value={fundo} onChange={setFundo} min={0.8} max={10} step={0.1} />
            <Slider label="Qualidade" value={qualidade} onChange={setQualidade} min={24} max={160} unit="" />
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cor</div>
              <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-9 w-16 cursor-pointer rounded border bg-transparent" />
            </div>
          </div>
        </Section>

        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => downloadMultipartZip([{ geometry, name: 'jarro' }], 'jarro')}><FileDown size={16} />Baixar Multiparts</button>
          <button className="btn-ghost w-full" onClick={() => downloadSingleSTL([{ geometry }], 'jarro.stl')}>STL único</button>
        </div>
      </div>

      <Viewer3D parts={[{ geometry, color: cor }]} height={620}
        footer={<div className="flex justify-between"><span>Jarro • Triângulos: {Math.round(triCount)}</span><span>Unidade: mm</span></div>} />
    </div>
  );
}
