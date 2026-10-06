import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Scissors, Upload, Download, Layers, Combine, RotateCcw } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { importMeshFile } from '../../lib/three/importMesh.js';
import { cutGeometryByPlane } from '../../lib/three/planeCut.js';
import { downloadSingleSTL, downloadMultipartZip } from '../../lib/three/export.js';
import { useToast } from '../../lib/ctx.jsx';

const PALETTE = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#94a3b8'];

export default function CordeiroCut() {
  const toast = useToast();
  const [parts, setParts] = useState(null); // null = tela de importação
  const [selected, setSelected] = useState(new Set());
  const [axis, setAxis] = useState('x');
  const [offset, setOffset] = useState(0);
  const fileRef = useRef();

  const bbox = useMemo(() => {
    if (!parts) return null;
    const box = new THREE.Box3();
    parts.forEach((p) => { p.geometry.computeBoundingBox(); box.union(p.geometry.boundingBox); });
    return box;
  }, [parts]);

  const onFile = async (file) => {
    if (!file) return;
    try {
      const p = await importMeshFile(file);
      const colored = p.map((x, i) => ({ ...x, color: PALETTE[i % PALETTE.length], id: crypto.randomUUID() }));
      setParts(colored);
      setSelected(new Set([colored[0]?.id]));
      toast('Modelo importado!');
    } catch (e) { toast(e.message, 'err'); }
  };

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const cortar = () => {
    if (!parts) return;
    const targets = parts.filter((p) => selected.has(p.id));
    if (!targets.length) return toast('Selecione ao menos uma parte para cortar', 'err');
    const normal = axis === 'x' ? new THREE.Vector3(1, 0, 0) : axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    const plane = new THREE.Plane(normal, -offset);
    let next = [...parts];
    targets.forEach((t) => {
      const { pos, neg } = cutGeometryByPlane(t.geometry, plane);
      if (!pos.attributes.position.count || !neg.attributes.position.count) { toast('O plano não intersecta essa parte.', 'err'); return; }
      next = next.filter((p) => p.id !== t.id);
      next.push({ geometry: pos, color: t.color, name: t.name + '-a', id: crypto.randomUUID() });
      next.push({ geometry: neg, color: PALETTE[(next.length) % PALETTE.length], name: t.name + '-b', id: crypto.randomUUID() });
    });
    setParts(next);
    setSelected(new Set());
    toast('Corte aplicado!');
  };

  const juntar = () => {
    const targets = parts.filter((p) => selected.has(p.id));
    if (targets.length < 2) return toast('Selecione ao menos 2 partes para juntar', 'err');
    const merged = mergeGeometries(targets.map((t) => t.geometry), false);
    const rest = parts.filter((p) => !selected.has(p.id));
    setParts([...rest, { geometry: merged, color: targets[0].color, name: 'juntado', id: crypto.randomUUID() }]);
    setSelected(new Set());
  };

  if (!parts) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><Scissors size={18} className="text-primary" />Cordeiro Cut</h2>
          <p className="mb-4 text-sm text-muted-foreground">Corte peças 3D em múltiplas partes com um plano de corte — o arquivo fica no seu navegador.</p>
          <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
            <Upload size={24} /><span className="font-semibold text-foreground">Importe um STL, OBJ ou GLB</span><span>O arquivo fica no seu navegador.</span>
            <input ref={fileRef} type="file" accept=".stl,.obj,.glb,.gltf" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
            <span className="btn-primary mt-2">Selecionar arquivo</span>
          </label>
        </div>
      </div>
    );
  }

  const triCount = parts.reduce((s, p) => s + (p.geometry?.attributes?.position?.count || 0) / 3, 0);
  const min = bbox ? bbox.min[axis] : -50, max = bbox ? bbox.max[axis] : 50;

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Scissors size={18} className="text-primary" />Cordeiro Cut</h2>
            <button className="btn-ghost !py-1 !px-2" onClick={() => setParts(null)}><RotateCcw size={14} />Novo</button>
          </div>
          <p className="label">Plano de corte</p>
          <div className="mb-2 flex gap-1 rounded-lg border bg-card/60 p-1 text-sm">
            {['x', 'y', 'z'].map((a) => <button key={a} onClick={() => setAxis(a)} className={`flex-1 rounded-md py-1.5 uppercase ${axis === a ? 'bg-background shadow' : 'text-muted-foreground'}`}>{a}</button>)}
          </div>
          <input type="range" min={min} max={max} step={(max - min) / 200 || 1} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="w-full accent-primary" />
          <p className="mt-1 text-xs text-muted-foreground">Posição no eixo {axis.toUpperCase()}: {offset.toFixed(1)}mm</p>
          <button className="btn-primary mt-3 w-full" onClick={cortar}><Scissors size={15} />Cortar partes selecionadas</button>
          <button className="btn-ghost mt-2 w-full" onClick={juntar}><Combine size={15} />Juntar partes selecionadas</button>
        </div>

        <div className="card">
          <p className="label flex items-center gap-2"><Layers size={15} />Partes / Segmentos</p>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {parts.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm hover:bg-secondary/30">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                <span className="h-4 w-4 shrink-0 rounded-full border" style={{ background: p.color }} />
                <span className="flex-1 truncate">{p.name}</span>
                <button onClick={() => downloadSingleSTL([p], `${p.name}.stl`)} className="rounded p-1 hover:bg-secondary"><Download size={13} /></button>
              </label>
            ))}
          </div>
          <button className="btn-primary mt-3 w-full" onClick={() => downloadMultipartZip(parts, 'cordeiro-cut')}><Download size={15} />Baixar todas as partes</button>
        </div>
      </div>

      <Viewer3D parts={parts} height={620} footer={<span>{parts.length} parte(s) • Triângulos: {Math.round(triCount)}</span>} />
    </div>
  );
}
