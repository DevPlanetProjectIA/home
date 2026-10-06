import React, { useState } from 'react';
import { Repeat, Upload, Download, AlertTriangle } from 'lucide-react';
import { PRINTERS, processFile, downloadBlob } from '../../lib/printerOptim.js';
import { useToast } from '../../lib/ctx.jsx';

export default function Conversor3MF() {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [printer, setPrinter] = useState(PRINTERS[0][0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = (f) => { if (!f) return; setFile(f); setResult(null); };

  const converter = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const [, label, bedX, bedY] = PRINTERS.find((p) => p[0] === printer);
      const r = await processFile(file, { bedX, bedY, center: true, dropToPlate: true });
      setResult({ ...r, label, filename: file.name.replace(/\.(3mf|stl)$/i, '') + `-${printer}.${r.ext}` });
      toast('Conversão concluída!');
    } catch (e) { toast('Não foi possível converter este arquivo: ' + e.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold"><Repeat size={18} className="text-primary" />Conversor 3MF</h2>
        <p className="text-sm text-muted-foreground">Leve um projeto do MakerWorld, ou de qualquer fatiador, para a sua impressora — recentralizando o modelo na mesa certa.</p>
        <p className="mt-2 badge bg-success/15 text-success">● Roda no seu navegador · nenhum arquivo é enviado</p>
      </div>

      <div className="card">
        <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
          <Upload size={22} />
          <span>{file ? file.name : 'Solte o arquivo 3MF ou STL aqui'}</span>
          <span className="text-xs">ou clique para escolher</span>
          <input type="file" accept=".3mf,.stl" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
        </label>

        <p className="label mt-4">Impressora de destino</p>
        <select className="input" value={printer} onChange={(e) => setPrinter(e.target.value)}>
          {PRINTERS.map(([id, label, x, y]) => <option key={id} value={id}>{label} ({x}×{y}mm)</option>)}
        </select>

        <button className="btn-primary mt-4 w-full" disabled={!file || busy} onClick={converter}>
          {busy ? 'Convertendo...' : 'Converter para esta impressora'}
        </button>

        {result?.warn && <p className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning"><AlertTriangle size={14} />{result.warn}</p>}
        {result && !result.warn && (
          <button className="btn-ghost mt-3 w-full" onClick={() => downloadBlob(result.blob, result.filename)}><Download size={15} />Baixar {result.filename}</button>
        )}
        {result?.warn && (
          <button className="btn-ghost mt-2 w-full" onClick={() => downloadBlob(result.blob, result.filename)}><Download size={15} />Baixar mesmo assim</button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">A malha e os ajustes por peça são copiados byte a byte. Só a posição/transformação na mesa é reescrita para caber e centralizar na impressora de destino.</p>
    </div>
  );
}
