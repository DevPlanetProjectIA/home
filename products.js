// Catálogo Oficial DevPlanet Store — Assinaturas e Licenças Digitais
const PRODUCTS = [
  {
    id: "google-ai-pro-18m",
    image: "img/promo-google-ai-pro.svg",
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
    id: "lovable-lite-12m",
    image: "img/promo-lovable-lite.svg",
    name: "Lovable Lite — 12 meses",
    tag: "Inteligência Artificial & Dev",
    category: "ia",
    badge: "🚀 Super Lançamento",
    price: 139.90,
    creditPrice: 154,
    originalPrice: 1350,
    discount: "-89% OFF",
    rating: 5.0,
    reviewsCount: 78,
    short: "12 meses de Lovable Lite. Crie softwares e aplicações web full-stack conversando com inteligência artificial.",
    description: "A plataforma líder mundial em desenvolvimento de software com IA. Crie aplicativos web completos (frontend, backend e banco de dados) em minutos apenas descrevendo o que deseja. Sincronização direta com GitHub e deploy em 1 clique.",
    highlights: [
      "Crie aplicações web full-stack completas com IA",
      "Sincronização direta e exportação para seu GitHub",
      "Hospedagem e deploy instantâneo inclusos"
    ],
    features: [
      ["Geração Full-Stack IA", "Frontend moderno, backend e banco de dados gerados em linguagem natural."],
      ["Sync com GitHub", "Você é 100% dono do código-fonte e pode clonar a qualquer momento."],
      ["Deploy Instantâneo", "Coloque seu aplicativo no ar com link público em 1 clique."],
      ["Economia Gigante", "Substitua a mensalidade cara em dólar por pagamento único em reais."]
    ],
    audience: ["Desenvolvedores", "Empreendedores", "Designers", "Criadores de Startups"]
  },
  {
    id: "microsoft-365-12m",
    image: "img/promo-microsoft-365.svg",
    name: "Microsoft 365 Premium — 12 meses",
    tag: "Produtividade & Office",
    category: "produtividade",
    badge: "💼 Mais Procurado",
    price: 89,
    creditPrice: 98,
    originalPrice: 359,
    discount: "-75% OFF",
    rating: 4.9,
    reviewsCount: 162,
    short: "12 meses de assinatura oficial Microsoft 365 com 1 TB de OneDrive, Word, Excel, PowerPoint e Outlook.",
    description: "A suíte de produtividade mais usada no mundo ativada diretamente na sua conta Microsoft oficial. Acesse os aplicativos clássicos e online com 1 TB de armazenamento em nuvem no OneDrive seguro e cofre pessoal.",
    highlights: [
      "1 TB de armazenamento em nuvem no OneDrive",
      "Word, Excel, PowerPoint, Outlook e OneNote completos",
      "Instale no seu PC, Mac, celular ou tablet"
    ],
    features: [
      ["Apps Oficiais", "Word, Excel, PowerPoint e Outlook com recursos premium desbloqueados."],
      ["1 TB no OneDrive", "Backup automático de fotos e documentos com cofre pessoal criptografado."],
      ["Multi-dispositivo", "Use em até 5 dispositivos simultâneos (PC, Mac, Android e iOS)."],
      ["Ativação Segura", "Vinculado à sua própria conta Microsoft de forma 100% oficial."]
    ],
    audience: ["Profissionais", "Estudantes", "Empresas", "Famílias"]
  },
  {
    id: "adobe-express-12m",
    image: "img/promo-adobe-express.svg",
    name: "Adobe Express — 12 meses",
    tag: "Design & IA",
    category: "design",
    badge: "🎨 Criatividade",
    price: 40,
    creditPrice: 45,
    originalPrice: 516,
    discount: "-92% OFF",
    rating: 4.8,
    reviewsCount: 94,
    short: "12 meses de Adobe Express Premium com IA Adobe Firefly, milhares de fontes e biblioteca completa Adobe Stock.",
    description: "Crie posts para redes sociais, vídeos profissionais, flyers e apresentações com ferramentas de ponta da Adobe. Inclui IA Generativa do Adobe Firefly para texto para imagem, preenchimento generativo e removedor de fundo em 1 clique.",
    highlights: [
      "IA Generativa Adobe Firefly integrada",
      "Removedor de fundo em 1 clique para fotos e vídeos",
      "+25.000 fontes licenciadas e biblioteca Adobe Stock"
    ],
    features: [
      ["Adobe Firefly IA", "Gere imagens e efeitos de texto surreais a partir de comandos em texto."],
      ["Removedor de Fundo Instantâneo", "Isole objetos e pessoas com máxima precisão em 1 toque."],
      ["Modelos Profissionais", "Milhares de templates prontos para Instagram, TikTok, YouTube e LinkedIn."],
      ["Redimensionamento Rápido", "Adapte qualquer arte para todos os formatos de redes sociais."]
    ],
    audience: ["Designers", "Social Media", "Empreendedores", "Criadores de Conteúdo"]
  },
  {
    id: "prime-video-6m",
    image: "img/promo-prime-video.svg",
    name: "Amazon Prime Video — 6 meses",
    tag: "Streaming & Filmes",
    category: "streaming",
    badge: "🍿 Filmes & Séries",
    price: 79.90,
    creditPrice: 88,
    originalPrice: 120,
    discount: "-33% OFF",
    rating: 4.9,
    reviewsCount: 115,
    short: "6 meses de Amazon Prime Video com streaming em 4K Ultra HD, download para offline e produções Originais.",
    description: "Acesso ilimitado ao streaming da Amazon por 6 meses. Assista a grandes sucessos do cinema, produções originais como The Boys, O Senhor dos Anéis, Fallout, Reacher e muito mais com a máxima qualidade de som e imagem.",
    highlights: [
      "Streaming em 4K Ultra HD com HDR e áudio surround",
      "Até 3 telas simultâneas para toda a família",
      "Download offline para assistir sem internet no celular ou tablet"
    ],
    features: [
      ["Catálogo Completo", "Milhares de filmes e séries premiadas com estreias frequentes."],
      ["Qualidade Máxima", "4K Ultra HD, HDR10+ e áudio Dolby Atmos nos títulos compatíveis."],
      ["Sem Comerciais", "Experiência de streaming contínua e imersiva."],
      ["Multi-plataforma", "Assista na Smart TV, celular, videogame ou computador."]
    ],
    audience: ["Cinéfilos", "Famílias", "Maratonistas de Séries"]
  },
  {
    id: "duolingo-super-12m",
    image: "img/promo-duolingo-super.svg",
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
