import {
  Clock, CheckCircle2, BarChart3, Users, CalendarDays, Package, Wallet, FileText, Store, Handshake,
  GraduationCap, BookOpen, Calculator, Ruler, FlaskConical, Palette, Sparkles, Link2, Repeat, ListChecks,
  Wand2, Flower2, Dog, KeyRound, Type, Box, QrCode, Scissors, Paintbrush, Blend, Settings, Bell, ShoppingCart,
} from 'lucide-react';

export const BRAND = { name: 'Casa BCBM', tagline: 'Gestão para impressão 3D' };

// tone: classes de cor por grupo
export const GROUPS = [
  { id: 'pedidos', title: 'Pedidos', icon: ShoppingCart, tone: 'blue', items: [
    { to: '/pedidos/andamento', label: 'Tarefas em andamento', short: 'Em Andamento', desc: 'Pedidos em produção', icon: Clock, badge: 'active' },
    { to: '/pedidos/finalizados', label: 'Tarefas finalizadas', short: 'Finalizados', desc: 'Histórico de pedidos', icon: CheckCircle2, badge: 'done' },
    { to: '/estatisticas', label: 'Estatísticas de Pedidos', short: 'Estatísticas', desc: 'Métricas e desempenho', icon: BarChart3 },
    { to: '/clientes', label: 'Cadastro de Clientes', short: 'Clientes', desc: 'Cadastro de clientes', icon: Users },
    { to: '/calendario', label: 'Calendário', short: 'Calendário', desc: 'Prazos e entregas', icon: CalendarDays },
  ]},
  { id: 'gestao', title: 'Gestão', icon: Package, tone: 'green', items: [
    { to: '/estoque', label: 'Estoque', desc: 'Produtos e filamentos', icon: Package },
    { to: '/financeiro', label: 'Gestão Financeira', short: 'Financeiro', desc: 'Receitas e despesas', icon: Wallet },
    { to: '/orcamento', label: 'Gerador de Orçamento', short: 'Orçamento', desc: 'Gere PDFs para clientes', icon: FileText },
    { to: '/vitrine', label: 'Vitrine', desc: 'Sua loja pública', icon: Store },
    { to: '/consignados', label: 'Consignados', desc: 'Peças em lojas parceiras', icon: Handshake, isNew: true },
  ]},
  { id: 'ensino', title: 'Ensino', icon: GraduationCap, tone: 'amber', items: [
    { to: '/aulas', label: 'Aulas', desc: 'Cursos em vídeo', icon: GraduationCap },
    { to: '/manuais', label: 'Manuais', desc: 'Guias em PDF e vídeo', icon: BookOpen },
  ]},
  { id: 'ferramentas', title: 'Ferramentas', icon: Wand2, tone: 'purple', items: [
    { to: '/ferramentas/calculadora', label: 'Calculadora 3D', desc: 'Custo, tempo e lucro', icon: Calculator },
    { to: '/ferramentas/escala', label: 'Escala', desc: 'Converter medidas', icon: Ruler },
    { to: '/ferramentas/mix-filamento', label: 'Mix Filamento', desc: 'Simular misturas', icon: FlaskConical },
    { to: '/ferramentas/mix-cores', label: 'Mix de Cores', desc: 'Combinar tintas', icon: Palette },
    { to: '/ferramentas/prompts', label: 'Prompts IA', desc: 'Gerar figuras', icon: Sparkles },
    { to: '/ferramentas/links', label: 'Links Úteis', desc: 'Recursos curados', icon: Link2 },
    { to: '/ferramentas/conversor-3mf', label: 'Conversor 3MF', desc: 'Leve seu projeto 3MF para outra impressora', icon: Repeat, isNew: true },
    { to: '/ferramentas/checklist', label: 'Checklist 3D', desc: 'Checklist para acertar sua impressão', icon: ListChecks, isNew: true },
    { to: '/ferramentas/otimizador', label: 'Otimizador de Projetos', desc: 'Deixe seu projeto pronto para imprimir', icon: Wand2, isNew: true },
  ]},
  { id: 'objetos', title: 'Gerador de Objetos', icon: Box, tone: 'cyan', items: [
    { to: '/objetos/jarros', label: 'Jarros', desc: 'Jarros paramétricos', icon: Flower2 },
    { to: '/objetos/coleira', label: 'Coleira PET', desc: 'Coleiras com nome', icon: Dog },
    { to: '/objetos/chaveiros', label: 'Chaveiros', desc: 'Chaveiros multipartes', icon: KeyRound },
    { to: '/objetos/letreiros', label: 'Letreiros', desc: 'Letreiros 3D com palavras', icon: Type },
    { to: '/objetos/caixas', label: 'Gerador de Caixas', desc: 'Caixas paramétricas em 3D', icon: Box },
    { to: '/objetos/qrcode', label: 'QR CODE', desc: 'Crie placas 3D com links em QR Code', icon: QrCode, isNew: true },
  ]},
  { id: 'ferramentas3d', title: 'Ferramentas 3D', icon: Blend, tone: 'pink', items: [
    { to: '/3d/cut', label: 'Cordeiro Cut', desc: 'Cortes orgânicos em STL/OBJ', icon: Scissors },
    { to: '/3d/paint', label: 'Cordeiro Paint', desc: 'Pinte suas peças 3D no navegador', icon: Paintbrush },
    { to: '/3d/separa-cores', label: 'Separa Cores - OBJ', desc: 'Separe objetos coloridos de arquivos OBJ', icon: Blend },
  ]},
  { id: 'config', title: 'Configuração', icon: Settings, tone: 'slate', items: [
    { to: '/configuracoes', label: 'Configurações', desc: 'Preferências da conta', icon: Settings },
    { to: '/atualizacoes', label: 'Atualizações', desc: 'Novidades do sistema', icon: Bell, isNew: true },
  ]},
];

export const TONES = {
  blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  green: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
  pink: 'text-pink-400 border-pink-500/30 bg-pink-500/5',
  slate: 'text-slate-300 border-slate-500/30 bg-slate-500/5',
};
export const ICON_BG = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-indigo-500'];

export const TITLES = {};
GROUPS.forEach((g) => g.items.forEach((i) => { TITLES[i.to] = { title: i.label, sub: i.desc }; }));
Object.assign(TITLES, {
  '/': { title: 'Início', sub: `Acesse rapidamente todas as ferramentas do ${BRAND.name}` },
  '/pedidos/novo': { title: 'Novo pedido', sub: 'Cadastre um novo pedido de impressão.' },
  '/clientes': { title: 'Cadastro de Clientes', sub: 'Veja seus clientes e os pedidos de cada um.' },
  '/orcamento': { title: 'Gerador de Orçamento', sub: 'Crie orçamentos profissionais em PDF.' },
});
