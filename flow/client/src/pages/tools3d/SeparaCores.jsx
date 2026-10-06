import React, { useState } from 'react';
import { Blend, Upload, Download, RotateCcw, Info } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { importMeshFile } from '../../lib/three/importMesh.js';
import { downloadSingleSTL, downloadMultipartZip } from '../../lib/three/export.js';
import { useToast } from '../../lib/ctx.jsx';

export default function SeparaCores() {
  const toast = useToast();
  const [parts, setParts] = useState(null);
  const [name, setName] = useState('');

  const onFile = async (file) => {
    if (!file) return;
    try {
      const p = await importMeshFile(file);
      setParts(p.map((x, i) => ({ ...x, id: crypto.randomUUID() })));
      setName(file.name);
      if (file.name.toLowerCase().endsWith('.stl')) toast('Arquivos STL não têm cor — importe um OBJ com material (MTL) para separar por cor.', 'err');
      else toast(`${p.length} grupo(s) de cor encontrados.`);
    } catch (e) { toast(e.message, 'err'); }
  };

  const triCount = parts?.reduce((s, p) => s + (p.geometry?.attributes?.position?.count || 0) / 3, 0) || 0;

  if (!parts) {
    return (
      <div className="mx-auto max-w-2xl card">
        <h2 className="flex items-center gap-2 font-semibold"><Blend size={18} className="text-primary" />Separa Cores - OBJ</h2>
        <p className="mb-3 text-sm text-muted-foreground">Separe objetos coloridos de arquivos OBJ (com .mtl) em partes individuais para imprimir cada cor separadamente.</p>
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-xs text-muted-foreground"><Info size={14} className="mt-0.5 shrink-0" />Funciona melhor com arquivos .OBJ que tenham um .MTL associado (grupos "usemtl" por cor). Envie os dois arquivos com o mesmo nome na mesma pasta antes de zipar, ou exporte um .OBJ com o MTL embutido no mesmo ZIP do seu editor 3D.</p>
        <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
          <Upload size={24} /><span className="font-semibold text-foreground">Importe um arquivo OBJ</span><span>O arquivo fica no seu navegador.</span>
          <input type="file" accept=".obj,.stl,.glb,.gltf" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
          <span className="btn-primary mt-2">Selecionar arquivo</span>
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Blend size={18} className="text-primary" />Separa Cores</h2>
            <button className="btn-ghost !py-1 !px-2" onClick={() => setParts(null)}><RotateCcw size={14} />Novo</button>
          </div>
          <p className="truncate text-xs text-muted-foreground">{name}</p>
        </div>
        <div className="card">
          <p className="label">Grupos de cor encontrados ({parts.length})</p>
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {parts.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm">
                <span className="h-5 w-5 shrink-0 rounded-full border" style={{ background: p.color }} />
                <span className="flex-1 truncate">{p.name}</span>
                <button onClick={() => downloadSingleSTL([p], `${p.name}.stl`)} className="rounded p-1 hover:bg-secondary"><Download size={13} /></button>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-3 w-full" onClick={() => downloadMultipartZip(parts, 'separa-cores')}><Download size={15} />Baixar todas as partes (ZIP)</button>
        </div>
      </div>
      <Viewer3D parts={parts} height={620} footer={<span>{parts.length} grupo(s) de cor • Triângulos: {Math.round(triCount)}</span>} />
    </div>
  );
}
