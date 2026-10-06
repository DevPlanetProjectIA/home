import React, { useState } from 'react';
import { Wand2, Upload, Download, AlertTriangle, Check } from 'lucide-react';
import { PRINTERS, processFile, downloadBlob } from '../../lib/printerOptim.js';
import { useToast } from '../../lib/ctx.jsx';

const MELHORIAS = [
  ['center', 'Centralizar automaticamente na mesa', true],
  ['dropToPlate', 'Pousar o modelo na mesa (Z=0)', true],
  ['scaleToFit', 'Reduzir escala se não couber na mesa', false],
];

export default function Otimizador() {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [printer, setPrinter] = useState(PRINTERS[0][0]);
  const [opts, setOpts] = useState({ center: true, dropToPlate: true, scaleToFit: false });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);

  const onFile = (f) => { if (!f) return; setFile(f); setResult(null); setStep(2); };

  const otimizar = async () => {
    setBusy(true);
    try {
      const [, label, bedX, bedY] = PRINTERS.find((p) => p[0] === printer);
      const r = await processFile(file, { bedX, bedY, ...opts });
      setResult({ ...r, filename: file.name.replace(/\.(3mf|stl)$/i, '') + `-otimizado.${r.ext}` });
      setStep(3);
      toast('Projeto otimizado!');
    } catch (e) { toast('Erro ao otimizar: ' + e.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold"><Wand2 size={18} className="text-primary" />Otimizador de Projetos <span className="badge bg-secondary text-[10px]">v0.21</span></h2>
        <p className="text-sm text-muted-foreground">Envie o projeto 3MF ou STL, marque as melhorias que quer e baixe pronto para a sua impressora.</p>
        <p className="mt-2 badge bg-success/15 text-success">● Roda no seu navegador · nenhum arquivo é enviado</p>
      </div>

      <div className="card">
        <p className="label">1. Arquivo <span className="font-normal text-muted-foreground">· projeto 3MF salvo no fatiador ou modelo STL</span></p>
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
          <Upload size={20} />
          <span>{file ? file.name : 'Solte o arquivo 3MF ou STL aqui'}</span>
          <input type="file" accept=".3mf,.stl" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
        </label>
      </div>

      {step >= 2 && (
        <div className="card">
          <p className="label">2. Melhorias</p>
          <div className="space-y-2">
            {MELHORIAS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-secondary/30">
                <input type="checkbox" checked={opts[key]} onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          <p className="label mt-4">Impressora de destino</p>
          <select className="input" value={printer} onChange={(e) => setPrinter(e.target.value)}>
            {PRINTERS.map(([id, label, x, y]) => <option key={id} value={id}>{label} ({x}×{y}mm)</option>)}
          </select>
          <button className="btn-primary mt-4 w-full" disabled={busy} onClick={otimizar}>{busy ? 'Otimizando...' : 'Otimizar projeto'}</button>
        </div>
      )}

      {step >= 3 && result && (
        <div className="card">
          <p className="label">3. Baixar</p>
          {result.warn && <p className="mb-2 flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning"><AlertTriangle size={14} />{result.warn}</p>}
          {!result.warn && <p className="mb-2 flex items-center gap-2 text-xs text-success"><Check size={14} />Projeto otimizado com sucesso.</p>}
          <button className="btn-primary w-full" onClick={() => downloadBlob(result.blob, result.filename)}><Download size={15} />Baixar {result.filename}</button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Só o perfil/posição do modelo é reescrito. Malha, pintura e peças são copiadas byte a byte.</p>
    </div>
  );
}
