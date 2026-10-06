import React, { useMemo, useState } from 'react';
import { Box, Grid3x3, Download } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { buildBoxGeometry, buildLidGeometry } from '../../lib/three/box.js';
import { downloadMultipartZip } from '../../lib/three/export.js';

export default function Caixas() {
  const [step, setStep] = useState('tamanho');
  const [w, setW] = useState(100);
  const [d, setD] = useState(100);
  const [h, setH] = useState(28);
  const [wall, setWall] = useState(5);
  const [rOuter, setROuter] = useState(4.1);
  const [rInner, setRInner] = useState(2);
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(1);
  const [incluirTampa, setIncluirTampa] = useState(true);
  const [cor, setCor] = useState('#3b5a80');

  const geometry = useMemo(() => buildBoxGeometry({ w, d, h, wall, rOuter, rInner, cols, rows }), [w, d, h, wall, rOuter, rInner, cols, rows]);
  const cellW = ((w - wall * 2) / cols).toFixed(1), cellD = ((d - wall * 2) / rows).toFixed(1);

  const baixar = () => {
    const parts = [{ geometry, name: 'caixa' }];
    if (incluirTampa) parts.push({ geometry: buildLidGeometry({ w, d, wall, rOuter }), name: 'tampa' });
    downloadMultipartZip(parts, 'caixa-organizadora');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><Box size={18} className="text-primary" />Gerador de Caixas</h2>
          <p className="text-sm text-muted-foreground">Caixas organizadoras paramétricas com grade interna.</p>
          <div className="mt-3 flex gap-1 rounded-xl border bg-card/60 p-1 text-sm">
            <button onClick={() => setStep('tamanho')} className={`flex-1 rounded-lg py-2 font-medium ${step === 'tamanho' ? 'bg-background shadow' : 'text-muted-foreground'}`}>Tamanho</button>
            <button onClick={() => setStep('grade')} className={`flex-1 rounded-lg py-2 font-medium ${step === 'grade' ? 'bg-background shadow' : 'text-muted-foreground'}`}>Grade</button>
          </div>
        </div>

        {step === 'tamanho' ? (
          <div className="card space-y-4">
            <p className="label">Medidas externas (mm)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label !mb-0.5 !text-[11px]">Largura</label><input type="number" className="input" value={w} onChange={(e) => setW(Number(e.target.value))} /></div>
              <div><label className="label !mb-0.5 !text-[11px]">Profund.</label><input type="number" className="input" value={d} onChange={(e) => setD(Number(e.target.value))} /></div>
              <div><label className="label !mb-0.5 !text-[11px]">Altura</label><input type="number" className="input" value={h} onChange={(e) => setH(Number(e.target.value))} /></div>
            </div>
            <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>ESPESSURA</span><span>{wall}mm</span></div><input type="range" min={1.6} max={10} step={0.2} value={wall} onChange={(e) => setWall(Number(e.target.value))} className="w-full accent-primary" /></div>
            <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>ARRED. EXTERNO</span><span>{rOuter}mm</span></div><input type="range" min={0} max={12} step={0.1} value={rOuter} onChange={(e) => setROuter(Number(e.target.value))} className="w-full accent-primary" /></div>
            <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>ARRED. INTERNO</span><span>{rInner}mm</span></div><input type="range" min={0} max={8} step={0.1} value={rInner} onChange={(e) => setRInner(Number(e.target.value))} className="w-full accent-primary" /></div>
            <div><label className="label">Cor</label><input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-9 w-16 cursor-pointer rounded border bg-transparent" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={incluirTampa} onChange={(e) => setIncluirTampa(e.target.checked)} />Incluir tampa no ZIP <span className="text-xs text-muted-foreground">(não aparece na prévia)</span></label>
          </div>
        ) : (
          <div className="card space-y-4">
            <p className="label flex items-center gap-2"><Grid3x3 size={15} />Grade interna</p>
            <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>COLUNAS</span><span>{cols}</span></div><input type="range" min={1} max={6} value={cols} onChange={(e) => setCols(Number(e.target.value))} className="w-full accent-primary" /></div>
            <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>LINHAS</span><span>{rows}</span></div><input type="range" min={1} max={6} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="w-full accent-primary" /></div>
            <p className="text-xs text-muted-foreground">Menor espaço útil: {cellW} × {cellD} mm. Total externo: {w} × {d} mm.</p>
          </div>
        )}

        <button className="btn-primary w-full" onClick={baixar}><Download size={16} />Baixar ZIP</button>
      </div>

      <Viewer3D parts={[{ geometry, color: cor }]} height={620}
        footer={<span>Menor espaço útil reto: {cellW} x {cellD} mm. Total externo: {w} x {d} mm.</span>} />
    </div>
  );
}
