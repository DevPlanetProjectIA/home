// Catálogo Oficial DevPlanet Store — Assinaturas e Licenças Digitais
const PRODUCTS = [
  {
    id: "google-ai-pro-18m",
    image: "img/promo-google-ai-pro.jpg",
    name: "Google AI Pro — 18 meses",
    tag: "Inteligência Artificial",
    category: "ia",
    badge: "🔥 Mais Vendido",
    price: 50,
    creditPrice: 55,
    originalPrice: 199,
    discount: "-75% OFF",
    rating: 4.9,
    reviewsCount: 184,
    short: "18 meses com Gemini Avançado 1.5 Pro, 5 TB de armazenamento Google Drive e 1.000 créditos de IA mensais.",
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
    id: "canva-pro-12m",
    image: "img/promo-canva-pro.jpg",
    name: "Canva Pro — 12 meses",
    tag: "Design & Produtividade",
    category: "design",
    badge: "✨ Popular",
    price: 120,
    creditPrice: 120,
    originalPrice: 289,
    discount: "-58% OFF",
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
    id: "duolingo-super-12m",
    image: "img/promo-duolingo-super.jpg",
    name: "Duolingo Super — 12 meses",
    tag: "Idiomas & Cursos",
    category: "idiomas",
    badge: "⚡ Destaque",
    price: 40,
    creditPrice: 45,
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
  }
];
