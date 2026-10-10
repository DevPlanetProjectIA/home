// Catálogo Oficial DevPlanet Store — Assinaturas e Licenças Digitais
const PRODUCTS = [
  {
    id: "google-ai-pro-18m",
    image: "img/promo-google-ai-pro.svg",
    name: "Google AI Pro — 18 meses",
    tag: "Inteligência Artificial",
    category: "ia",
    badge: "🔥 Mais Vendido",
    price: 40,
    originalPrice: 199,
    discount: "-80% OFF",
    rating: 4.9,
    reviewsCount: 184,
    short: "18 meses com Gemini Avançado, 5 TB de armazenamento Google Drive e 1.000 créditos de IA mensais.",
    description: "Plano estendido de 18 meses com acesso completo ao Gemini Avançado 1.5 Pro, 5 TB de nuvem no Google Drive e 1.000 créditos por mês para ferramentas de ponta como Veo 3 e NotebookLM. Pague uma única vez e aproveite sem renovação automática.",
    highlights: [
      "5 TB de espaço em nuvem no Google Drive",
      "Gemini Avançado 1.5 Pro com raciocínio superior",
      "1.000 créditos mensais de IA por 18 meses"
    ],
    features: [
      ["Gemini Avançado", "Respostas inteligentes, análise profunda de documentos e programação."],
      ["5 TB de Armazenamento", "Espaço gigante para seus arquivos, fotos, vídeos e backups."],
      ["1000 Créditos Mensais", "Para geração de vídeos com Veo 3 e recursos de ponta."],
      ["NotebookLM Pro", "Pesquisa acadêmica e resumos assistidos por IA."],
      ["Pagamento Único", "Sem cobranças mensais, sem surpresas na fatura."]
    ],
    audience: ["Criadores de conteúdo", "Estudantes", "Desenvolvedores", "Profissionais"]
  },
  {
    id: "duolingo-super-12m",
    image: "img/promo-duolingo-super.svg",
    name: "Duolingo Super — 12 meses",
    tag: "Idiomas & Cursos",
    category: "idiomas",
    badge: "⚡ Destaque",
    price: 40,
    originalPrice: 180,
    discount: "-78% OFF",
    rating: 4.9,
    reviewsCount: 126,
    short: "12 meses de Duolingo Super com vidas infinitas, sem anúncios e revisão personalizada de erros.",
    description: "Desbloqueie o aprendizado acelerado de idiomas com o Duolingo Super por 1 ano completo. Estude inglês, espanhol, francês e muito mais sem interrupções de propaganda e com corações ilimitados.",
    highlights: [
      "Vidas infinitas — erre o quanto precisar",
      "Sem anúncios para focar 100% no estudo",
      "Testes ilimitados e revisão inteligente de erros"
    ],
    features: [
      ["Vidas Ilimitadas", "Pratique sem medo de perder vidas durante os testes."],
      ["Zero Anúncios", "Experiência limpa e fluida sem nenhuma interrupção comercial."],
      ["Prática Personalizada", "Treine exclusivamente as palavras e frases que você errou."],
      ["Testes de Nível Ilimitados", "Pule níveis quando quiser sem pagar gemas extras."]
    ],
    audience: ["Estudantes", "Viajantes", "Profissionais"]
  },
  {
    id: "canva-pro-12m",
    image: "img/promo-canva-pro.svg",
    name: "Canva Pro — 12 meses",
    tag: "Design & Produtividade",
    category: "design",
    badge: "✨ Popular",
    price: 35,
    originalPrice: 289,
    discount: "-88% OFF",
    rating: 4.8,
    reviewsCount: 95,
    short: "1 ano de Canva Pro ativado diretamente na sua conta. Milhões de templates, fotos e IA inclusos.",
    description: "Crie posts, apresentações, vídeos profissionais e materiais de marketing com acesso ilimitado a toda a biblioteca premium do Canva, removedor de fundo em 1 clique e ferramentas de IA integradas.",
    highlights: [
      "Removedor de fundo mágico em 1 clique",
      "+100 milhões de fotos, vídeos e elementos premium",
      "Redimensionamento mágico para todas as redes sociais"
    ],
    features: [
      ["Biblioteca Completa", "Mais de 100 milhões de fotos de estoque, vídeos e áudios."],
      ["Ferramentas Mágicas IA", "Expansão de imagem, edição mágica e geração de texto."],
      ["Brand Kit", "Salve suas fontes, paletas de cores e logos da sua marca."],
      ["Ativação no seu E-mail", "Conectado diretamente na sua própria conta do Canva."]
    ],
    audience: ["Designers", "Empreendedores", "Social Media", "Estudantes"]
  },
  {
    id: "chatgpt-plus-1m",
    image: "img/promo-chatgpt-plus.svg",
    name: "ChatGPT Plus & GPT-4o — Mensal",
    tag: "Inteligência Artificial",
    category: "ia",
    badge: "🚀 Alta Procura",
    price: 45,
    originalPrice: 120,
    discount: "-62% OFF",
    rating: 5.0,
    reviewsCount: 73,
    short: "Acesso ao GPT-4o, geração de imagens no DALL-E 3, navegação web e recursos avançados de voz.",
    description: "Utilize o modelo mais inteligente do mundo sem limites de horário ou lentidão. Acesso privativo com criação de GPTs personalizados, análise de dados e fotos em tempo real.",
    highlights: [
      "Acesso completo ao GPT-4o e GPT-4 Turbo",
      "Criação de imagens de alta definição com DALL-E 3",
      "Leitura de arquivos, planilhas e PDFs com IA"
    ],
    features: [
      ["GPT-4o Ilimitado", "Raciocínio ultrarrápido para textos, códigos e traduções."],
      ["DALL-E 3 Integrado", "Crie ilustrações e fotos realistas em segundos."],
      ["Análise Avançada de Dados", "Faça upload de planilhas Excel e receba gráficos prontos."],
      ["Acesso Privado", "Garantia de privacidade e estabilidade contínua."]
    ],
    audience: ["Programadores", "Empresários", "Pesquisadores", "Criadores"]
  }
];
