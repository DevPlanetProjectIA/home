import React, { useMemo, useState } from 'react';
import { Sparkles, Zap, Gem, Scissors, Copy, Upload, Check } from 'lucide-react';
import { useToast } from '../../lib/ctx.jsx';

const STYLES = {
  pixar: { label: 'Pixar', icon: '✨', text: 'High-quality 3D cartoon render in Pixar/Disney style.\nSmooth plastic-like materials, soft rounded geometry.\nSlightly exaggerated proportions, big expressive eyes, friendly facial features.\nClean studio lighting, soft shadows, vibrant yet balanced colors.\nSemi-realistic cartoon look.' },
  chibi: { label: 'Chibi', icon: '🧸', text: 'Chibi 3D style: oversized head (about 40% of body height), small simplified body, big glossy eyes.\nSoft plastic-like toy material, pastel/vibrant colors, cute rounded shapes.' },
  funko: { label: 'Funko Pop', icon: '📦', text: 'Funko Pop vinyl-figure style: large square-ish head, flat black oval eyes with no pupils, small body, matte plastic finish, minimal detail.' },
  realista: { label: 'Realista', icon: '👤', text: 'High-detail realistic 3D scan style, physically-based materials, accurate skin/fabric texture, natural studio lighting.' },
};
const VIEWS = {
  frente: { label: 'Apenas Frente', hint: 'Gera 1 imagem frontal.', text: 'VIEWS\nSingle Front View only.\nShow the character facing forward.' },
  frentecostas: { label: 'Frente + Costas', hint: 'Gera 2 imagens lado a lado.', text: 'VIEWS\nTWO views side by side in the same image: Front View and Back View.\nSame scale and same geometry in both views.' },
  tres: { label: 'Frente + Costas + Lateral', hint: 'Gera 3 imagens.', text: 'VIEWS\nTHREE views side by side in the same image: Front View, Side View (left profile) and Back View.\nSame scale and same geometry in all views.' },
};

function buildPrompt({ style, pessoas, views }) {
  return [
    `Create a single WIDE 16:9 3D cartoon reference image from the uploaded photo.`,
    ``,
    `IMPORTANT`,
    `The character(s) MUST be shown FULL BODY, from top of the head to the soles of the feet.`,
    `No cropping is allowed.`,
    ``,
    ``,
    `SUBJECT`,
    `The photo contains exactly ${pessoas} ${pessoas === '1' ? 'person' : 'people'}.`,
    `Convert into ${pessoas === '1' ? 'ONE 3D mesh' : 'SEPARATE 3D meshes, one per person'}.`,
    ``,
    ``,
    `IDENTITY`,
    `Same skin tone, facial structure, hair, beard, glasses and visible accessories as the photo.`,
    `Same facial expression.`,
    `No beautification.`,
    `No redesign.`,
    ``,
    ``,
    `GEOMETRY LOCK (CRITICAL)`,
    `The geometry must be completely frozen between views.`,
    `Do not recalculate pose or proportions.`,
    ``,
    ``,
    VIEWS[views].text,
    ``,
    ``,
    `STYLE`,
    STYLES[style].text,
    ``,
    ``,
    `CAMERA`,
    `Orthographic or near-orthographic.`,
    `FULL BODY visible in all views (head to feet), centered, consistent scale.`,
    ``,
    ``,
    `BACKGROUND`,
    `Plain neutral light-gray background, no shadows on the floor, no props.`,
  ].join('\n');
}

function Padrao() {
  const toast = useToast();
  const [style, setStyle] = useState('pixar');
  const [pessoas, setPessoas] = useState('1');
  const [views, setViews] = useState('frente');
  const [file, setFile] = useState(null);
  const prompt = useMemo(() => buildPrompt({ style, pessoas, views }), [style, pessoas, views]);

  return (
    <div className="space-y-5">
      <div>
        <p className="label">1. Configurar prompt</p>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Estilo desejado</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(STYLES).map(([k, s]) => (
            <button key={k} onClick={() => setStyle(k)} className={`rounded-lg border px-3 py-3 text-center text-sm font-medium ${style === k ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>
              <div className="text-lg">{s.icon}</div>{s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Pessoas na foto</p>
        <div className="flex gap-2">
          {['1', '2', '3+'].map((n) => (
            <button key={n} onClick={() => setPessoas(n)} className={`rounded-lg border px-4 py-2 text-sm font-medium ${pessoas === n ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>{n}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Quais vistas gerar?</p>
        <div className="space-y-2">
          {Object.entries(VIEWS).map(([k, v]) => (
            <button key={k} onClick={() => setViews(k)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm ${views === k ? 'border-primary bg-primary/15' : 'hover:bg-secondary'}`}>
              <span className="font-medium">{v.label}</span><span className="text-xs text-muted-foreground">{v.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">2. Copie este prompt</p>
        <textarea readOnly value={prompt} className="input h-48 font-mono text-xs" />
        <button className="btn-primary mt-2" onClick={() => { navigator.clipboard.writeText(prompt); toast('Prompt copiado!'); }}><Copy size={15} />Copiar Prompt</button>
      </div>
      <div>
        <p className="label">3. Passos para criar</p>
        <ol className="space-y-1 text-sm text-muted-foreground">
          <li>1. Copie o prompt acima.</li>
          <li>2. Cole no Gemini (Nano Banana) ou ChatGPT (com a foto anexada).</li>
          <li>3. Salve a imagem gerada e faça upload abaixo.</li>
        </ol>
      </div>
      <div>
        <p className="label">4. Voltou? Faça o upload aqui</p>
        <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
          {file ? <img src={file} alt="" className="h-full object-contain" /> : <><Upload size={20} /><span>Arraste ou clique para enviar</span></>}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setFile(r.result); r.readAsDataURL(f); }} />
        </label>
      </div>
    </div>
  );
}

function Premium() {
  const toast = useToast();
  const [style, setStyle] = useState('pixar');
  const steps = ['frente', 'lateral', 'costas'];
  const [stepIdx, setStepIdx] = useState(0);
  const labels = { frente: 'Vista Frontal', lateral: 'Vista Lateral', costas: 'Vista Traseira' };
  const prompt = useMemo(() => {
    const base = buildPrompt({ style, pessoas: '1', views: 'frente' });
    return base.replace('Single Front View only.\nShow the character facing forward.',
      `Single ${labels[steps[stepIdx]]} only, matching EXACTLY the same character/geometry/proportions used in the previous views you generated.`);
  }, [style, stepIdx]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Gera cada vista separadamente, passo a passo, para máxima consistência entre elas (alta qualidade).</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(STYLES).map(([k, s]) => (
          <button key={k} onClick={() => setStyle(k)} className={`rounded-lg border px-3 py-3 text-center text-sm font-medium ${style === k ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>
            <div className="text-lg">{s.icon}</div>{s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-xl border bg-card/60 p-1 text-sm">
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStepIdx(i)} className={`flex-1 rounded-lg py-2 font-medium ${i === stepIdx ? 'bg-background shadow' : 'text-muted-foreground'}`}>{i + 1}. {labels[s]}</button>
        ))}
      </div>
      <textarea readOnly value={prompt} className="input h-48 font-mono text-xs" />
      <button className="btn-primary" onClick={() => { navigator.clipboard.writeText(prompt); toast('Prompt copiado!'); }}><Copy size={15} />Copiar prompt da etapa {stepIdx + 1}</button>
      <p className="text-xs text-muted-foreground">Gere e salve cada imagem antes de avançar para a próxima etapa, sempre anexando a imagem anterior como referência de consistência.</p>
    </div>
  );
}

function Cortar() {
  const [file, setFile] = useState(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Já tem a imagem com as vistas prontas? Envie abaixo para separar frente/costas/lateral em arquivos individuais antes de importar no slicer/gerador de mesh.</p>
      <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
        {file ? <img src={file} alt="" className="h-full object-contain" /> : <><Scissors size={22} /><span>Arraste ou clique para enviar a imagem combinada</span></>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setFile(r.result); r.readAsDataURL(f); }} />
      </label>
      {file && <ImageCutter src={file} />}
    </div>
  );
}

function ImageCutter({ src }) {
  const [parts, setParts] = useState(2);
  const download = (i) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.floor(img.width / parts);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, i * w, 0, w, img.height, 0, 0, w, img.height);
      canvas.toBlob((blob) => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vista-${i + 1}.png`; a.click();
      });
    };
    img.src = src;
  };
  return (
    <div>
      <p className="label">Quantas vistas tem a imagem?</p>
      <div className="mb-3 flex gap-2">{[2, 3].map((n) => <button key={n} onClick={() => setParts(n)} className={`rounded-lg border px-4 py-1.5 text-sm ${parts === n ? 'border-primary bg-primary/15 text-primary' : ''}`}>{n}</button>)}</div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: parts }).map((_, i) => <button key={i} className="btn-ghost" onClick={() => download(i)}><Check size={14} />Baixar vista {i + 1}</button>)}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'padrao', label: 'Método Padrão', icon: Zap, badge: 'Recomendado para iniciantes', desc: 'Gera todas as vistas em uma única imagem.' },
  { id: 'premium', label: 'Método Premium', icon: Gem, badge: 'Alta Qualidade', desc: 'Gera cada vista separadamente passo-a-passo.' },
  { id: 'cortar', label: 'Apenas Cortar', icon: Scissors, badge: 'Ferramenta Gratuita', desc: 'Já tem a imagem pronta? Use para separar as partes.' },
];

export default function Prompts() {
  const [tab, setTab] = useState(null);
  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold"><Sparkles size={18} className="text-primary" />Prompts Bonecos Personalizados</h2>
        <p className="text-sm text-muted-foreground">Esta ferramenta auxilia na preparação de imagens para transformação em 3D. Lembre-se que a IA ainda está aprendendo, então o processo envolve tentativa e erro.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`card text-left transition ${tab === t.id ? 'border-primary' : 'hover:border-primary/50'}`}>
            <t.icon className="mb-2 text-primary" size={20} />
            <p className="font-semibold">{t.label}</p>
            <p className="mb-2 text-xs text-muted-foreground">{t.desc}</p>
            <span className="badge border border-primary/40 text-primary">{t.badge}</span>
          </button>
        ))}
      </div>
      <div className="card">
        {tab === 'padrao' && <Padrao />}
        {tab === 'premium' && <Premium />}
        {tab === 'cortar' && <Cortar />}
        {!tab && <p className="py-10 text-center text-sm text-muted-foreground">Selecione uma opção acima para começar</p>}
      </div>
    </div>
  );
}
