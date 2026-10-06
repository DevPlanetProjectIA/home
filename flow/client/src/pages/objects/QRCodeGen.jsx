import React, { useMemo, useState } from 'react';
import { QrCode as QrIcon, Wifi, AtSign, Globe, Star, DollarSign, Link2, Download } from 'lucide-react';
import Viewer3D from '../../lib/three/viewer.jsx';
import { buildQRPlate } from '../../lib/three/qrplate.js';
import { downloadSingleSTL } from '../../lib/three/export.js';

const TIPOS = [
  { id: 'site', label: 'Site', icon: Globe, fields: [['url', 'https://seusite.com.br']] },
  { id: 'pix', label: 'Pix', icon: DollarSign, fields: [['chave', 'Chave Pix (e-mail, CPF, telefone...)']] },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi, fields: [['ssid', 'Nome da rede'], ['senha', 'Senha']] },
  { id: 'social', label: 'Redes sociais', icon: AtSign, fields: [['url', '@seuperfil ou link completo']] },
  { id: 'review', label: 'Avaliação Google', icon: Star, fields: [['url', 'Link de avaliação do Google']] },
  { id: 'texto', label: 'Múltiplos QR / Texto', icon: Link2, fields: [['url', 'Texto ou link']] },
];

function buildPayload(tipo, v) {
  if (tipo === 'wifi') return `WIFI:T:WPA;S:${v.ssid || ''};P:${v.senha || ''};;`;
  if (tipo === 'pix') return `Chave Pix: ${v.chave || ''}`;
  return v.url || v.chave || '';
}

export default function QRCodeGen() {
  const [tipo, setTipo] = useState('site');
  const [v, setV] = useState({ url: 'https://cordeiroflow.com' });
  const [titulo, setTitulo] = useState('Sua marca aqui');
  const [relevo, setRelevo] = useState(true);
  const [plateW, setPlateW] = useState(70);
  const [plateH, setPlateH] = useState(90);
  const [cor, setCor] = useState('#ffffff');
  const [corQr, setCorQr] = useState('#111827');

  const payload = buildPayload(tipo, v);
  const { plate, qr, plateThick } = useMemo(() => buildQRPlate({ text: payload, plateW, plateH, relevo }), [payload, plateW, plateH, relevo]);

  const tipoDef = TIPOS.find((t) => t.id === tipo);

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><QrIcon size={18} className="text-primary" />Gerador de Placa com QR Code</h2>
          <p className="text-sm text-muted-foreground">Crie placas personalizadas com links em QR Code para impressão 3D.</p>
        </div>

        <div className="card">
          <p className="label">Comece com um modelo</p>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map((t) => (
              <button key={t.id} onClick={() => setTipo(t.id)} className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium ${tipo === t.id ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {tipoDef.fields.map(([key, ph]) => (
              <input key={key} className="input" placeholder={ph} value={v[key] || ''} onChange={(e) => setV((x) => ({ ...x, [key]: e.target.value }))} />
            ))}
          </div>
          <div className="mt-3 flex gap-1 rounded-xl border bg-card/60 p-1 text-sm">
            <button onClick={() => setRelevo(true)} className={`flex-1 rounded-lg py-1.5 font-medium ${relevo ? 'bg-background shadow' : 'text-muted-foreground'}`}>Relevo</button>
            <button onClick={() => setRelevo(false)} className={`flex-1 rounded-lg py-1.5 font-medium ${!relevo ? 'bg-background shadow' : 'text-muted-foreground'}`}>Plano</button>
          </div>
        </div>

        <div className="card space-y-3">
          <div><label className="label">Título</label><input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Sua marca aqui" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Largura</label><input type="number" className="input" value={plateW} onChange={(e) => setPlateW(Number(e.target.value))} /></div>
            <div><label className="label">Altura</label><input type="number" className="input" value={plateH} onChange={(e) => setPlateH(Number(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cor da placa</label><input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
            <div><label className="label">Cor do QR</label><input type="color" value={corQr} onChange={(e) => setCorQr(e.target.value)} className="h-9 w-full cursor-pointer rounded border bg-transparent" /></div>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={() => downloadSingleSTL([{ geometry: plate, color: cor }, { geometry: qr, color: corQr }], 'placa-qrcode.stl')}><Download size={16} />Baixar STL</button>
      </div>

      <Viewer3D parts={[{ geometry: plate, color: cor }, { geometry: qr, color: corQr }]} height={620}
        footer={<span>Placa QR Code • {plateW}×{plateH}×{plateThick}mm • {titulo}</span>} />
    </div>
  );
}
