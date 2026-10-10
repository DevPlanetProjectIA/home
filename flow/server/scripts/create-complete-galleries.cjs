/**
 * Gera galerias profissionais em alta resolução (1200x1200px) para os 6 produtos do Mercado Livre
 * Foto 1: Fundo branco puro (requisito do algoritmo do Mercado Livre para pontuação máxima)
 * Foto 2: Recursos e ferramentas inclusas
 * Foto 3: Compatibilidade multidispositivo
 * Foto 4: Garantia de 7 dias, entrega imediata e suporte DevPlanet
 */
const fs = require('fs');
const path = require('path');
const sharp = require('../node_modules/sharp');

const IMG_DIR = path.resolve(__dirname, '../../../img');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const PRODUCTS = [
  {
    sku: 'ms365',
    brand: 'Microsoft',
    name: 'Microsoft 365 Premium',
    subtitle: 'Assinatura Oficial 12 Meses',
    color: '#0078d4',
    features: [
      '1 TB de Nuvem no OneDrive com Cofre Pessoal',
      'Word, Excel, PowerPoint, Outlook e OneNote',
      'Instale em até 5 dispositivos simultâneos',
      'Compatível com Windows, Mac, iPad e Celular'
    ],
    devices: 'PC Windows • Mac • iPad • iPhone • Android',
    badge: '12 MESES OFICIAL'
  },
  {
    sku: 'googleai',
    brand: 'Google',
    name: 'Google AI Pro 18 Meses',
    subtitle: 'Gemini Advanced 1.5 Pro + 5 TB Nuvem',
    color: '#1a73e8',
    features: [
      '5 TB de Armazenamento no Google Drive',
      'Gemini 1.5 Pro com 1 Milhão de Tokens',
      '1.000 Créditos Mensais de IA para Criação',
      'Integrado com Docs, Sheets e Gmail'
    ],
    devices: 'Web • Computador • Android • iPhone • iPad',
    badge: '5 TB NUVEM + 18 MESES'
  },
  {
    sku: 'lovable',
    brand: 'Lovable',
    name: 'Lovable Lite 12 Meses',
    subtitle: 'Criador de Software Web com IA Fullstack',
    color: '#ec4899',
    features: [
      'Crie aplicações completas com IA em minutos',
      'Frontend, Backend e Banco de Dados inclusos',
      'Sincronização direta com seu GitHub oficial',
      'Deploy instantâneo com link público ativo'
    ],
    devices: 'Acesso Web Oficial • Sincroniza com GitHub',
    badge: 'ACESSO OFICIAL 12M'
  },
  {
    sku: 'express',
    brand: 'Express',
    name: 'Express Criativo Premium',
    subtitle: 'Design Profissional com IA Firefly',
    color: '#fa5c00',
    features: [
      'IA Generativa Firefly (Texto para Imagem)',
      'Removedor de fundo em 1 clique para fotos e vídeos',
      '+25.000 fontes licenciadas e biblioteca de templates',
      'Edição rápida para Instagram, TikTok e YouTube'
    ],
    devices: 'Navegador Web • App para Android e iOS',
    badge: 'PREMIUM 12 MESES'
  },
  {
    sku: 'prime',
    brand: 'Prime Video',
    name: 'Amazon Prime Video 6 Meses',
    subtitle: 'Streaming em 4K Ultra HD e Filmes',
    color: '#00a8e1',
    features: [
      'Filmes consagrados e produções Amazon Originals',
      'Resolução 4K Ultra HD com HDR e som surround',
      'Até 3 telas simultâneas para toda a família',
      'Download liberado para assistir offline'
    ],
    devices: 'Smart TVs • Celulares • Tablets • Videogames',
    badge: '6 MESES 4K ULTRA HD'
  },
  {
    sku: 'duolingo',
    brand: 'Duolingo',
    name: 'Duolingo Super 12 Meses',
    subtitle: 'Vidas Infinitas e Aprendizado Acelerado',
    color: '#58cc02',
    features: [
      'Vidas infinitas: pratique sem medo de errar',
      'Zero comerciais e anúncios durante as lições',
      'Prática personalizada e revisão inteligente',
      'Testes de nível e simulados ilimitados'
    ],
    devices: 'App para Android • iOS • Versão Web',
    badge: 'VIDAS INFINITAS 12M'
  }
];

function generateSlide1(p) {
  // Foto 1: Fundo Branco Puro, logo grande centralizado, tipografia limpa (Estilo Foto de Catálogo Oficial ML)
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#ffffff"/>
    
    <!-- Moldura sutil e moderna -->
    <rect x="60" y="60" width="1080" height="1080" rx="36" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3"/>
    
    <!-- Badge Superior -->
    <rect x="420" y="110" width="360" height="52" rx="26" fill="${p.color}"/>
    <text x="600" y="144" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${p.badge}</text>

    <!-- Ícone Central / Box 3D -->
    <g transform="translate(600, 480)">
      <circle cx="0" cy="0" r="190" fill="${p.color}" opacity="0.08"/>
      <rect x="-140" y="-140" width="280" height="280" rx="42" fill="${p.color}" filter="drop-shadow(0 20px 30px rgba(0,0,0,0.15))"/>
      
      <!-- Símbolo interno representativo -->
      <path d="M -60 -40 L 60 -40 L 60 40 L -60 40 Z" fill="#ffffff" opacity="0.3"/>
      <circle cx="0" cy="0" r="45" fill="#ffffff"/>
      <path d="M -15 -10 L 15 -10 L 0 20 Z" fill="${p.color}"/>
    </g>

    <!-- Título Principal -->
    <text x="600" y="760" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900" fill="#0f172a" text-anchor="middle">${p.name}</text>
    <text x="600" y="815" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="#64748b" text-anchor="middle">${p.subtitle}</text>

    <!-- Selos de Confiança Inferiores -->
    <g transform="translate(600, 960)">
      <rect x="-420" y="-45" width="840" height="90" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <text x="-260" y="8" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#059669" text-anchor="middle">✓ ATIVAÇÃO OFICIAL</text>
      <text x="0" y="8" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#2563eb" text-anchor="middle">✓ ENTREGA NO CHAT</text>
      <text x="260" y="8" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#d97706" text-anchor="middle">✓ GARANTIA 7 DIAS</text>
    </g>
  </svg>`;
}

function generateSlide2(p) {
  // Foto 2: Recursos inclusos e diferenciais
  const feats = p.features.map((f, i) => `
    <g transform="translate(140, ${460 + i * 125})">
      <rect x="0" y="0" width="920" height="95" rx="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="50" cy="48" r="24" fill="${p.color}"/>
      <text x="50" y="55" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">✓</text>
      <text x="100" y="56" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#1e293b">${f}</text>
    </g>
  `).join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#ffffff"/>
    <rect x="60" y="60" width="1080" height="1080" rx="36" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3"/>

    <text x="140" y="180" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${p.color}" letter-spacing="2">O QUE ESTÁ INCLUSO</text>
    <text x="140" y="245" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#0f172a">Principais Vantagens do Plano</text>
    <text x="140" y="295" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#64748b">Aproveite todos os recursos oficiais desbloqueados na sua conta:</text>

    ${feats}

    <rect x="140" y="1000" width="920" height="70" rx="14" fill="#eff6ff" stroke="#bfdbfe" stroke-width="2"/>
    <text x="600" y="1044" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1d4ed8" text-anchor="middle">🔒 Ativação vinculada diretamente aos servidores oficiais</text>
  </svg>`;
}

function generateSlide3(p) {
  // Foto 3: Dispositivos compatíveis & Como funciona
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#ffffff"/>
    <rect x="60" y="60" width="1080" height="1080" rx="36" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3"/>

    <text x="140" y="180" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${p.color}" letter-spacing="2">COMPATIBILIDADE E SUPORTE</text>
    <text x="140" y="245" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#0f172a">Use Onde e Quando Quiser</text>
    
    <!-- Card de Dispositivos -->
    <rect x="140" y="320" width="920" height="200" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="200" y="380" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#0f172a">💻 Plataformas Compatíveis:</text>
    <text x="200" y="440" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="${p.color}">${p.devices}</text>
    <text x="200" y="485" font-family="Arial, sans-serif" font-size="20" font-weight="500" fill="#64748b">Sincronização em nuvem e histórico atualizado em tempo real.</text>

    <!-- Passo a Passo -->
    <text x="140" y="590" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#0f172a">Como Funciona o Acesso:</text>

    <g transform="translate(140, 630)">
      <rect x="0" y="0" width="280" height="280" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="140" cy="70" r="36" fill="#2563eb"/>
      <text x="140" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">1</text>
      <text x="140" y="150" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">Aprovação</text>
      <text x="140" y="185" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="#64748b" text-anchor="middle">Seu pedido é aprovado</text>
      <text x="140" y="210" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="#64748b" text-anchor="middle">no Mercado Livre</text>
    </g>

    <g transform="translate(460, 630)">
      <rect x="0" y="0" width="280" height="280" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="140" cy="70" r="36" fill="#059669"/>
      <text x="140" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">2</text>
      <text x="140" y="150" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">Envio via Chat</text>
      <text x="140" y="185" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="#64748b" text-anchor="middle">Você recebe a licença</text>
      <text x="140" y="210" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="#64748b" text-anchor="middle">e guia no chat/WhatsApp</text>
    </g>

    <g transform="translate(780, 630)">
      <rect x="0" y="0" width="280" height="280" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="140" cy="70" r="36" fill="#d97706"/>
      <text x="140" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">3</text>
      <text x="140" y="150" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">Ativação</text>
      <text x="140" y="185" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="#64748b" text-anchor="middle">Pronto! Conta ativada</text>
      <text x="140" y="210" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="#64748b" text-anchor="middle">com suporte total</text>
    </g>
  </svg>`;
}

function generateSlide4(p) {
  // Foto 4: Garantia incondicional de 7 dias e suporte DevPlanet Store
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#ffffff"/>
    <rect x="60" y="60" width="1080" height="1080" rx="36" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3"/>

    <!-- Escudo de Garantia -->
    <g transform="translate(600, 260)">
      <circle cx="0" cy="0" r="110" fill="#059669" opacity="0.1"/>
      <circle cx="0" cy="0" r="80" fill="#059669"/>
      <text x="0" y="14" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle">7</text>
      <text x="0" y="44" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">DIAS</text>
    </g>

    <text x="600" y="440" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#0f172a" text-anchor="middle">Garantia Incondicional de 7 Dias</text>
    <text x="600" y="490" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#059669" text-anchor="middle">Conforme o Artigo 49 do Código de Defesa do Consumidor (CDC)</text>

    <!-- Caixa explicativa -->
    <rect x="140" y="550" width="920" height="340" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    
    <text x="200" y="620" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#0f172a">🛡️ Compra 100% Protegida:</text>
    <text x="200" y="665" font-family="Arial, sans-serif" font-size="20" font-weight="normal" fill="#475569">• Você tem 7 dias para testar todos os recursos do seu plano.</text>
    <text x="200" y="705" font-family="Arial, sans-serif" font-size="20" font-weight="normal" fill="#475569">• Se tiver qualquer dúvida ou problema, nossa equipe resolve imediatamente.</text>
    <text x="200" y="745" font-family="Arial, sans-serif" font-size="20" font-weight="normal" fill="#475569">• Suporte humanizado e ágil diretamente no chat do Mercado Livre ou WhatsApp.</text>
    <text x="200" y="785" font-family="Arial, sans-serif" font-size="20" font-weight="normal" fill="#475569">• Satisfação garantida ou seu dinheiro de volta sem burocracia.</text>

    <g transform="translate(600, 990)">
      <rect x="-300" y="-40" width="600" height="80" rx="20" fill="#0f172a"/>
      <text x="0" y="10" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">DevPlanet Store — Licenças Oficiais</text>
    </g>
  </svg>`;
}

async function buildAll() {
  console.log('🚀 Iniciando geração das galerias completas em 1200x1200px...');
  for (const p of PRODUCTS) {
    console.log(`\n⏳ Renderizando produto: ${p.name}...`);

    const slides = [
      { name: `prod-${p.sku}-1.jpg`, svg: generateSlide1(p) },
      { name: `prod-${p.sku}-2.jpg`, svg: generateSlide2(p) },
      { name: `prod-${p.sku}-3.jpg`, svg: generateSlide3(p) },
      { name: `prod-${p.sku}-4.jpg`, svg: generateSlide4(p) }
    ];

    for (const s of slides) {
      const outPath = path.join(IMG_DIR, s.name);
      await sharp(Buffer.from(s.svg))
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toFile(outPath);
      console.log(`  ✓ ${s.name} gerado com sucesso.`);
    }
  }
  console.log('\n🏁 Todas as 24 imagens em alta definição (1200x1200px) geradas com sucesso!');
}

buildAll();
