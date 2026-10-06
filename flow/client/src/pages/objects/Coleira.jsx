import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Tag, Ruler, Circle, Type as TypeIcon, FileDown } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { SHAPE_BUILDERS, ringGeometry } from '../../lib/three/shapes.js';
import { textGeometry } from '../../lib/three/text.js';
import { downloadSingleSTL, downloadMultipartZip } from '../../lib/three/export.js';

const FORMATOS = [['redondo', 'Redondo'], ['osso', 'Osso'], ['coracao', 'Coração'], ['estrela', 'Estrela']];
const FONTES = [['bold', 'Arredondada (Bold)'], ['display', 'Display'], ['regular', 'Regular']];

function Slider({ label, value, onChange, min, max, step = 1, unit = 'mm' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground"><span className="uppercase tracking-wide">{label}</span><span className="rounded border px-1.5 py-0.5 text-foreground">{value}{unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
function Section({ icon: Icon, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card !p-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3 font-semibold"><Icon size={16} className="text-primary" />{title}</button>
      {open && <div className="space-y-4 border-t px-4 py-4">{children}</div>}
    </div>
  );
}

export default function Coleira() {
  const [formato, setFormato] = useState('osso');
  const [nome, setNome] = useState('THOR');
  const [fonte, setFonte] = useState('bold');
  const [tamanho, setTamanho] = useState(34);
  const [espessura, setEspessura] = useState(4);
  const [argolaR, setArgolaR] = useState(4.5);
  const [argolaTubo, setArgolaTubo] = useState(1.6);
  const [textoTam, setTextoTam] = useState(9);
  const [corBase, setCorBase] = useState('#4f9eff');
  const [corTexto, setCorTexto] = useState('#ffffff');
  const [versoOn, setVersoOn] = useState(false);
  const [verso, setVerso] = useState('Se achar, ligue!');
  const [parts, setParts] = useState([]);

  const baseShape = useMemo(() => SHAPE_BUILDERS[formato](tamanho), [formato, tamanho]);
  const baseGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(baseShape, { depth: espessura, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2, curveSegments: 32 });
    g.center();
    g.computeBoundingBox();
    return g;
  }, [baseShape, espessura]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const bb = baseGeo.boundingBox;
      const topY = bb.max.y;
      const ring = ringGeometry(argolaR, argolaTubo, 28);
      const ringParts = [{ geometry: ring, color: corBase, position: [0, topY + argolaR, espessura / 2], rotation: [Math.PI / 2, 0, 0], name: 'argola' }];

      const frontText = await textGeometry(nome || ' ', { font: fonte, size: textoTam, height: 1.2, curveSegments: 6 });
      const fb = frontText.boundingBox;
      const maxW = (bb.max.x - bb.min.x) * 0.82;
      const scale = Math.min(1, maxW / Math.max(1, fb.max.x - fb.min.x));
      frontText.scale(scale, scale, 1);

      const textParts = [{ geometry: frontText, color: corTexto, position: [0, 0, espessura + 0.05], name: 'texto-frente' }];

      let backParts = [];
      if (versoOn && verso) {
        const backText = await textGeometry(verso, { font: 'regular', size: textoTam * 0.55, height: 1, curveSegments: 5 });
        const bbb = backText.boundingBox;
        const scaleB = Math.min(1, maxW / Math.max(1, bbb.max.x - bbb.min.x));
        backText.scale(scaleB, scaleB, 1);
        backParts = [{ geometry: backText, color: corTexto, position: [0, 0, -0.05], rotation: [0, Math.PI, 0], name: 'texto-verso' }];
      }

      if (alive) setParts([{ geometry: baseGeo, color: corBase, name: 'base' }, ...ringParts, ...textParts, ...backParts]);
    })();
    return () => { alive = false; };
  }, [baseGeo, nome, fonte, textoTam, corBase, corTexto, argolaR, argolaTubo, espessura, versoOn, verso]);

  const triCount = parts.reduce((s, p) => s + (p.geometry?.index ? p.geometry.index.count / 3 : (p.geometry?.attributes?.position?.count || 0) / 3), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><Tag size={18} className="text-primary" />Gerador de Coleira PET</h2>
          <p className="text-sm text-muted-foreground">Pingente personalizado com nome, formato e relevo.</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {FORMATOS.map(([id, label]) => (
              <button key={id} onClick={() => setFormato(id)} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${formato === id ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{label}</button>
            ))}
          </div>
        </div>

        <Section icon={TypeIcon} title="Identificação">
          <div>
            <label className="label">Nome no pingente</label>
            <input className="input" value={nome} maxLength={14} onChange={(e) => setNome(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">Fonte do texto</label>
            <select className="input" value={fonte} onChange={(e) => setFonte(e.target.value)}>
              {FONTES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </Section>

        <Section icon={Ruler} title="Formato & Escala">
          <Slider label="Tamanho" value={tamanho} onChange={setTamanho} min={18} max={60} />
          <Slider label="Espessura" value={espessura} onChange={setEspessura} min={2} max={8} step={0.5} />
        </Section>

        <Section icon={Circle} title="Argola & Furo">
          <Slider label="Raio da argola" value={argolaR} onChange={setArgolaR} min={2.5} max={8} step={0.5} />
          <Slider label="Espessura do tubo" value={argolaTubo} onChange={setArgolaTubo} min={0.8} max={3} step={0.2} />
        </Section>

        <Section icon={TypeIcon} title="Ajustes do Texto">
          <Slider label="Tamanho do texto" value={textoTam} onChange={setTextoTam} min={4} max={16} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cor base</label><input type="color" value={corBase} onChange={(e) => setCorBase(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
            <div><label className="label">Cor do texto</label><input type="color" value={corTexto} onChange={(e) => setCorTexto(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
          </div>
        </Section>

        <Section icon={TypeIcon} title="Texto Atrás (Verso)">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={versoOn} onChange={(e) => setVersoOn(e.target.checked)} />Incluir texto no verso</label>
          {versoOn && <input className="input" value={verso} onChange={(e) => setVerso(e.target.value)} placeholder="Ex: Se achar, ligue!" />}
        </Section>

        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => downloadMultipartZip(parts, 'coleira-pet')}><FileDown size={16} />Baixar Multiparts</button>
          <button className="btn-ghost w-full" onClick={() => downloadSingleSTL(parts, 'coleira-pet.stl')}>STL único</button>
        </div>
      </div>

      <Viewer3D parts={parts} height={620} footer={<div className="flex justify-between"><span>Pingente Pet • Triângulos: {Math.round(triCount)} • Nome: {nome}</span><span>Unidade: mm</span></div>} />
    </div>
  );
}
