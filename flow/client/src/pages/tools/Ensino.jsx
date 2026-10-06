import React, { useMemo, useState } from 'react';
import { GraduationCap, BookOpen, Camera, ExternalLink, ChevronDown } from 'lucide-react';

const MODULOS = [
  { nivel: 'Iniciante', titulo: 'O início da jornada', videos: 19, cat: 'Fundamentos' },
  { nivel: 'Iniciante', titulo: 'Fatiador', videos: 28, cat: 'Software' },
  { nivel: 'Iniciante', titulo: 'Dicas', videos: 10, cat: 'Fundamentos' },
  { nivel: 'Intermediário', titulo: 'Chaveiros personalizados', videos: 3, cat: 'Projetos' },
  { nivel: 'Intermediário', titulo: 'Como fazer bonecos personalizados', videos: 9, cat: 'Projetos' },
  { nivel: 'Avançado', titulo: 'Acabamento de peças', videos: 4, cat: 'Pós-processamento' },
  { nivel: 'Avançado', titulo: 'Técnicas de pintura', videos: 8, cat: 'Pós-processamento' },
  { nivel: 'Avançado', titulo: 'Vendendo suas peças', videos: 7, cat: 'Negócios' },
];
const NIVEIS = ['Todos os níveis', 'Iniciante', 'Intermediário', 'Avançado'];

export function Aulas() {
  const [nivel, setNivel] = useState('Todos os níveis');
  const [q, setQ] = useState('');
  const list = useMemo(() => MODULOS.filter((m) =>
    (nivel === 'Todos os níveis' || m.nivel === nivel) &&
    (!q.trim() || m.titulo.toLowerCase().includes(q.trim().toLowerCase()))), [nivel, q]);
  const tone = { Iniciante: 'bg-success/15 text-success', Intermediário: 'bg-warning/15 text-warning', Avançado: 'bg-destructive/15 text-destructive' };

  return (
    <div className="space-y-5">
      <div className="card flex items-start gap-3">
        <Camera className="mt-0.5 shrink-0 text-primary" size={22} />
        <div>
          <p className="font-semibold">Vídeos do Instagram organizados para você!</p>
          <p className="text-sm text-muted-foreground">Todos os vídeos das aulas são do Instagram (@BrunoCordeiro). Aqui eles estão organizados de forma mais didática para facilitar seu aprendizado! Os vídeos são gratuitos no Instagram — aqui oferecemos uma experiência organizada com progressão de ensino.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><GraduationCap size={18} className="text-primary" />Todos os módulos</h2>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input className="input flex-1" placeholder="Buscar módulos..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input sm:w-52" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            {NIVEIS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <a key={m.titulo} href="https://www.instagram.com/brunocordeiro" target="_blank" rel="noreferrer"
              className="flex flex-col justify-between rounded-xl border p-4 hover:border-primary/60 hover:bg-secondary/30">
              <div>
                <span className={`badge ${tone[m.nivel]}`}>{m.nivel}</span>
                <p className="mt-2 font-semibold leading-snug">{m.titulo}</p>
                <p className="text-xs text-muted-foreground">{m.cat}</p>
              </div>
              <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">{m.videos} vídeos <ExternalLink size={13} /></p>
            </a>
          ))}
          {list.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nenhum módulo encontrado.</p>}
        </div>
      </div>
    </div>
  );
}

const GUIAS = [
  { id: 'fatiadores', nome: 'Guia para Fatiadores', resumo: 'Configurações essenciais de fatiamento para qualquer impressora.', passos: [
    'Sempre nivele a mesa (manual ou automático) antes de fatiar um novo perfil.',
    'Ajuste o fluxo (flow) e a temperatura de acordo com o filamento — comece pelos valores do fabricante.',
    'Use altura de camada 0.2mm para peças normais e 0.12mm para detalhes finos.',
    'Ative "arco de sequência de impressão" (ironing) apenas em superfícies visíveis, para não aumentar muito o tempo.',
    'Revise sempre o preview 3D camada a camada antes de enviar para a impressora.',
  ]},
  { id: 'ender3', nome: 'Guia Ender 3', resumo: 'Manutenção da Creality Ender 3 (e variantes: Pro, V2, S1).', passos: [
    'Reaperte as correias X/Y a cada 20h de uso — frouxas causam "ghosting" nas peças.',
    'Limpe a mesa com álcool isopropílico antes de cada impressão para melhorar a aderência.',
    'Lubrifique as hastes lisas (varas lisas) a cada 100h com óleo de máquina de costura.',
    'Verifique o tensionamento da correia da extrusora — muito frouxa causa falha de extrusão.',
    'Troque o bico a cada ~300h de uso (ou antes, se notar entupimentos frequentes).',
  ]},
  { id: 'k1', nome: 'Guia K1', resumo: 'Manutenção da Creality K1/K1 Max (CoreXY, alta velocidade).', passos: [
    'Verifique a tensão das correias CoreXY periodicamente (aperto firme, sem folga).',
    'Limpe o ventilador da hotend — poeira reduz o resfriamento e piora o acabamento.',
    'Atualize o firmware regularmente pelo app Creality Cloud para correções de estabilidade.',
    'Use o nivelamento automático (ATC) antes de peças grandes ou após transporte da impressora.',
    'Monitore o desgaste do bico endurecido ao usar filamentos abrasivos (fibra de carbono, glitter).',
  ]},
  { id: 'k2', nome: 'Guia K2', resumo: 'Manutenção da Creality K2 Plus (câmara fechada, multi-material).', passos: [
    'Verifique a vedação da câmara para manter temperatura estável com ABS/ASA.',
    'Limpe o sensor de fluxo de filamento periodicamente para evitar falsas pausas.',
    'Calibre o sistema multi-material (CFS) a cada troca de bobina para evitar mistura de cor.',
    'Verifique o extrusor duplo-engrenagem — reaperte se notar falha de extrusão (clicking).',
  ]},
  { id: 'ad5x', nome: 'Guia AD5X', resumo: 'Manutenção da Creality AD5X (impressão multicolor com ACE).', passos: [
    'Limpe os tubos do sistema ACE regularmente para evitar entupimento entre cores.',
    'Verifique o corte automático de filamento — lâmina precisa estar afiada para trocas limpas.',
    'Nivele a mesa antes de peças multicor, já que o tempo de impressão é maior.',
    'Guarde bobinas não utilizadas dentro do ACE com dessecante para evitar umidade.',
  ]},
  { id: 'a1', nome: 'Guia A1', resumo: 'Manutenção da Bambu Lab A1 (mesa aberta, AMS opcional).', passos: [
    'Faça a calibração de vibração (Input Shaping) após mudanças de local da impressora.',
    'Limpe a placa de impressão texturizada com água e sabão neutro periodicamente.',
    'Verifique o AMS: rodas de tração limpas evitam falha de alimentação do filamento.',
    'Atualize o firmware pelo Bambu Handy/Studio para melhorias de estabilidade.',
  ]},
  { id: 'p1s', nome: 'Guia P1S', resumo: 'Manutenção da Bambu Lab P1S (câmara fechada).', passos: [
    'Limpe o filtro de carbono ativado periodicamente ao imprimir ABS/ASA.',
    'Verifique a vedação da porta frontal para manter a temperatura da câmara estável.',
    'Rode a calibração de fluxo (flow dynamics) ao trocar de marca de filamento.',
    'Limpe o extrusor e a roda dentada a cada poucas centenas de horas de uso.',
  ]},
  { id: 'x1c', nome: 'Guia X1C', resumo: 'Manutenção da Bambu Lab X1 Carbon (LIDAR + câmara fechada).', passos: [
    'Limpe a lente do LIDAR com pano de microfibra — poeira afeta a detecção de falhas.',
    'Verifique o filtro HEPA/carbono a cada ~200h de impressão com materiais técnicos.',
    'Rode a calibração completa (Micro Lidar + flow) após transporte da máquina.',
    'Monitore o desgaste do bico de aço endurecido ao usar PA-CF/PETG-CF.',
  ]},
  { id: 'h2s', nome: 'Guia H2S', resumo: 'Manutenção da Bambu Lab H2S (câmara fechada, dual extrusão a laser opcional).', passos: [
    'Verifique a calibração de altura entre os dois bicos (dual nozzle) periodicamente.',
    'Limpe o sistema de exaustão/filtro regularmente para materiais com odor forte.',
    'Confirme a vedação da câmara antes de imprimir materiais de engenharia (ABS/PC).',
  ]},
  { id: 'h2d', nome: 'Guia H2D', resumo: 'Manutenção da Bambu Lab H2D (impressão + corte a laser).', passos: [
    'Limpe as lentes do módulo laser regularmente — resíduos reduzem a potência de corte.',
    'Nunca opere o laser sem a proteção/ventilação adequada instalada.',
    'Verifique o alinhamento entre o cabeçote de impressão e o módulo laser após trocas.',
    'Mantenha a mesa de corte limpa de detritos entre um projeto e outro.',
  ]},
];

export function Manuais() {
  const [open, setOpen] = useState('fatiadores');
  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold"><BookOpen size={18} className="text-primary" />Guias de Manutenção</h2>
        <p className="text-sm text-muted-foreground">Guias baseados em boas práticas e documentação dos fabricantes, para ajudar você na manutenção das suas impressoras 3D.</p>
        <p className="mt-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">Aviso importante: estes guias não substituem os manuais oficiais de cada fabricante. Em caso de dúvidas, sempre consulte a documentação oficial do seu equipamento.</p>
      </div>
      <div className="space-y-2">
        {GUIAS.map((g) => (
          <div key={g.id} className="card !p-0">
            <button onClick={() => setOpen(open === g.id ? null : g.id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <div><p className="font-semibold">{g.nome}</p><p className="text-xs text-muted-foreground">{g.resumo}</p></div>
              <ChevronDown size={16} className={open === g.id ? '' : '-rotate-90'} />
            </button>
            {open === g.id && (
              <ol className="space-y-1.5 border-t px-4 py-3 text-sm text-muted-foreground">
                {g.passos.map((p, i) => <li key={i}><b className="text-foreground">{i + 1}.</b> {p}</li>)}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
