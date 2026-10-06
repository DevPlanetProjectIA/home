import React from 'react';
import { Link2, ExternalLink } from 'lucide-react';

const SECTIONS = [
  { title: 'STLs Grátis', badge: 'GRÁTIS', desc: 'Modelos 3D gratuitos para baixar', items: [
    ['Printables', 'Modelos 3D gratuitos da comunidade Prusa', 'https://www.printables.com'],
    ['Thingiverse', 'Maior biblioteca de modelos 3D gratuitos', 'https://www.thingiverse.com'],
    ['MakerWorld', 'Modelos otimizados para impressão', 'https://makerworld.com'],
  ]},
  { title: 'STLs Premium', badge: 'PREMIUM', desc: 'Modelos exclusivos e profissionais', items: [
    ['Cults3D', 'Marketplace com modelos exclusivos', 'https://cults3d.com'],
    ['CGTrader', 'Modelos profissionais de alta qualidade', 'https://www.cgtrader.com'],
  ]},
  { title: 'Buscador de STLs', desc: 'Pesquise modelos em vários sites', items: [
    ['Yeggi', 'Buscador que pesquisa em vários sites de STL', 'https://www.yeggi.com'],
  ]},
  { title: 'Ferramentas de IA', badge: 'IA', desc: 'Crie modelos com inteligência artificial', items: [
    ['Hunyuan 3D', 'Crie bonecos personalizados com IA', 'https://3d.hunyuan.tencent.com'],
  ]},
  { title: 'Ferramentas de Criação', desc: 'Crie e personalize seus projetos', items: [
    ['MakerLab', 'Chaveiros, luminárias, vasos e muito mais', 'https://www.makerlab.com.br'],
    ['Tinkercad', 'Editor 3D online gratuito e fácil', 'https://www.tinkercad.com'],
    ['Map2Model', 'Crie mapas reais em STL', 'https://map2model.com'],
    ['RefMaker', 'Ajuste capacetes e acessórios de STL', 'https://www.thingiverse.com'],
  ]},
  { title: 'Fatiadores', desc: 'Software para preparar impressões', items: [
    ['Orca Slicer', 'Fatiador open-source avançado', 'https://orcaslicer.net'],
    ['Bambu Studio', 'Fatiador oficial Bambu Lab', 'https://bambulab.com/en/download/studio'],
    ['Creality Print', 'Fatiador oficial Creality', 'https://www.crealityprint.com'],
  ]},
  { title: 'Bruno Cordeiro', badge: 'RECOMENDADO', desc: 'Recomendações e redes sociais', items: [
    ['Produtos Recomendados', 'Lista de produtos que o Bruno usa e recomenda', 'https://www.cordeiroflow.com'],
    ['Instagram', 'Siga o Bruno Cordeiro no Instagram', 'https://www.instagram.com/brunocordeiro'],
  ]},
];

export default function Links() {
  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold"><Link2 size={18} className="text-primary" />Links Úteis</h2>
        <p className="text-sm text-muted-foreground">Sites e ferramentas essenciais para makers de impressão 3D.</p>
      </div>
      {SECTIONS.map((s) => (
        <div key={s.title} className="card">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold">{s.title}</h3>
            {s.badge && <span className="badge bg-primary/15 text-primary">{s.badge}</span>}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{s.desc}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {s.items.map(([label, desc, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm hover:bg-secondary/50">
                <span><span className="font-medium">{label}</span><br /><span className="text-xs text-muted-foreground">{desc}</span></span>
                <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      ))}
      <div className="card bg-primary/5 text-sm text-muted-foreground">💡 Dica do Maker: Salve seus modelos favoritos e organize por categorias para encontrar mais rápido!</div>
    </div>
  );
}
