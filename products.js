// Catálogo. Para vender outro produto, adicione um item aqui — a loja, o checkout e o pedido no Flow se adaptam sozinhos.
const PRODUCTS = [
  {
    id: "google-ai-pro-18m",
    name: "Google AI Pro — 18 meses",
    tag: "Assinatura digital",
    price: 40,
    short: "18 meses com 5 TB de armazenamento e 1000 créditos de IA por mês. Pague uma vez, sem mensalidade.",
    description: "Plano de 18 meses com acesso ao Gemini avançado, 5 TB no Google Drive e 1000 créditos por mês para os recursos de IA compatíveis.",
    features: [
      ["Gemini avançado", "Respostas mais inteligentes, criação de textos e produtividade."],
      ["5 TB de armazenamento", "Espaço para arquivos, fotos e vídeos."],
      ["1000 créditos por mês", "Para usar nos recursos de IA compatíveis, por 18 meses."],
      ["NotebookLM", "Pesquisa, resumo e estudo assistidos por IA."],
      ["Veo 3", "Criação de vídeos com IA."],
    ],
    audience: ["Criadores de conteúdo", "Estudantes", "Profissionais", "Designers"],
  },
  {
    id: "duolingo-super-12m",
    name: "Duolingo Super — 12 meses",
    tag: "Assinatura digital",
    price: 40,
    short: "12 meses de Duolingo Super. Pague uma vez, sem mensalidade.",
    description: "Plano de 12 meses de Duolingo Super para estudar idiomas. As instruções de ativação são enviadas pelo WhatsApp após a confirmação do pagamento.",
    features: [
      ["Duolingo Super por 12 meses", "Acesso ao plano Super durante todo o período contratado."],
      ["Pagamento único", "R$ 40,00 via PIX, sem mensalidade cobrada por nós."],
      ["Entrega pelo WhatsApp", "Instruções de ativação em até 24 horas após a confirmação do pagamento."],
    ],
    audience: ["Estudantes", "Profissionais"],
  },
];
