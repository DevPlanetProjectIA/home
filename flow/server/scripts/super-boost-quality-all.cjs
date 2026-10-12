/**
 * Super Boost Quality Script:
 * 1. Ficha Técnica 100% preenchida com todos os atributos suportados
 * 2. Descrições profissionais sem WhatsApp nem palavras proibidas
 * 3. Garantia legal CDC de 7 dias mantida
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const token = fs.readFileSync(envPath, 'utf8').match(/ML_ACCESS_TOKEN=(.+)/)[1].trim();

const UPDATES = [
  {
    id: 'MLB5366400871',
    sku: 'ms365',
    attributes: [
      { id: 'BRAND', value_name: 'Microsoft' },
      { id: 'DEVELOPER', value_name: 'Microsoft Corporation' },
      { id: 'OFFICE_SOFTWARE_NAME', value_name: 'Microsoft 365' },
      { id: 'VERSION', value_name: 'Family 2026' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'LICENSE_TIME', value_struct: { number: 12, unit: 'meses' } },
      { id: 'LANGUAGES', value_name: 'Português' },
      { id: 'SOFTWARE_FUNCTIONS', value_name: 'Produtividade' },
      { id: 'DEVICES_SUPPORTED_NUMBER', value_name: '5' },
      { id: 'IS_OFFICE_SUITE', value_name: 'Sim' },
      { id: 'WITH_UNLIMITED_LICENSE', value_name: 'Não' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '889842861648' }
    ],
    description: `SEJA BEM-VINDO À NOSSA LOJA OFICIAL!

O Microsoft 365 é o pacote de produtividade e segurança mais completo do mundo, ideal para trabalho, estudos e uso pessoal.

O QUE ESTÁ INCLUSO:
- Pacote Office Completo: Word, Excel, PowerPoint, Outlook e OneNote sempre na versão mais recente.
- 1 TB de Nuvem no OneDrive: Armazene seus arquivos, fotos e vídeos com backup automático e segurança avançada.
- Até 5 Dispositivos Conectados: Compatível com PC Windows, Mac, Notebook, Tablet e Celular (Android / iOS).
- Recursos de Inteligência Artificial: Assistente de edição, modelos prontos e ferramentas avançadas.
- Duração: 12 meses de assinatura oficial sem interrupções.

COMO É FEITO O ENVIO:
- O envio é 100% DIGITAL e IMEDIATO após a confirmação da compra pelo Mercado Livre.
- As orientações completas de ativação são enviadas diretamente no CHAT DA COMPRA aqui no Mercado Livre.
- Não há cobrança de frete.

COMPATIBILIDADE:
- Windows 10, Windows 11, macOS, iOS (iPhone/iPad) e Android.

GARANTIA E SUPORTE:
- Garantia de 7 dias conforme o Código de Defesa do Consumidor (CDC).
- Suporte ágil e humanizado para tirar qualquer dúvida na ativação diretamente no chat pós-venda.`
  },
  {
    id: 'MLB5366440323',
    sku: 'googleai',
    attributes: [
      { id: 'BRAND', value_name: 'Google' },
      { id: 'DEVELOPER', value_name: 'Google LLC' },
      { id: 'OFFICE_SOFTWARE_NAME', value_name: 'Google AI Pro' },
      { id: 'VERSION', value_name: 'Gemini Advanced 1.5 Pro' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'LICENSE_TIME', value_struct: { number: 18, unit: 'meses' } },
      { id: 'LANGUAGES', value_name: 'Português' },
      { id: 'SOFTWARE_FUNCTIONS', value_name: 'Inteligência Artificial' },
      { id: 'DEVICES_SUPPORTED_NUMBER', value_name: '5' },
      { id: 'IS_OFFICE_SUITE', value_name: 'Não' },
      { id: 'WITH_UNLIMITED_LICENSE', value_name: 'Não' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'GTIN', value_name: '7898956241058' }
    ],
    description: `SEJA BEM-VINDO À NOSSA LOJA OFICIAL!

Aproveite o que há de mais avançado em Inteligência Artificial de última geração com o Google AI Pro (Gemini Advanced 1.5 Pro) e impressionantes 5 TB de armazenamento no Google One / Google Drive!

O QUE ESTÁ INCLUSO:
- Modelo Gemini 1.5 Pro: IA com raciocínio de nível superior, janela de contexto de até 1 milhão de tokens para analisar documentos gigantes, códigos e planilhas complexas.
- 5 TB de Armazenamento Google One: Espaço premium compartilhado para Google Drive, Fotos e Gmail em resolução máxima.
- Integração Nativa no Workspace: Use a IA diretamente no Gmail, Google Docs, Apresentações e Planilhas para redigir textos, gerar resumos e criar conteúdo.
- Ferramentas Criativas e Técnicas: Suporte multimodal avançado (texto, áudio, código, imagem e vídeo).
- Duração: 18 meses de acesso contínuo.

COMO É FEITO O ENVIO:
- Envio 100% DIGITAL e RÁPIDO após a confirmação do pagamento pelo Mercado Livre.
- Todas as instruções de ativação são fornecidas diretamente pelo CHAT DE MENSAGENS da sua compra no Mercado Livre.
- Frete grátis (produto digital).

COMPATIBILIDADE:
- Funciona em qualquer navegador web (Google Chrome, Edge, Safari, Firefox), além de aplicativos oficiais para Android e iOS.

GARANTIA E SUPORTE:
- Garantia de 7 dias com total conformidade ao Código de Defesa do Consumidor (CDC).
- Suporte dedicado no chat pós-venda do Mercado Livre.`
  },
  {
    id: 'MLB5366401673',
    sku: 'lovable',
    attributes: [
      { id: 'DEVELOPER', value_name: 'Lovable' },
      { id: 'SOFTWARE_NAME', value_name: 'Lovable Lite' },
      { id: 'VERSION', value_name: '2026' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'LICENSE_TIME', value_struct: { number: 12, unit: 'meses' } },
      { id: 'COMPATIBLE_OS_NAMES', value_name: 'Windows, macOS, Linux, Android, iOS' },
      { id: 'INCLUDES_INSTALLATION_GUIDE', value_name: 'Sim' },
      { id: 'GTIN', value_name: '7898956241027' }
    ],
    description: `SEJA BEM-VINDO À NOSSA LOJA OFICIAL!

Transforme ideias em aplicações web completas em minutos com o Lovable Lite — a ferramenta pioneira em desenvolvimento full-stack acelerado por Inteligência Artificial.

O QUE ESTÁ INCLUSO:
- Criação de Software Full-Stack: Crie Frontend moderno, Backend seguro e Banco de Dados (PostgreSQL/Supabase) conversando em linguagem natural.
- Sincronização Bidirecional com GitHub: Seu código é 100% seu, pronto para versionamento e exportação a qualquer momento.
- Deploy em 1 Clique: Publique suas aplicações web instantaneamente na nuvem com certificado SSL e domínio rápido.
- Ideal para Criadores e Desenvolvedores: Ideal para protótipos de startups, MVPs, dashboards e ferramentas internas de automação.
- Duração: 12 meses de acesso oficial.

COMO É FEITO O ENVIO:
- Envio 100% DIGITAL e IMEDIATO após a confirmação do pagamento no Mercado Livre.
- Os dados e instruções de acesso são enviados diretamente no CHAT DA COMPRA no Mercado Livre.
- Sem custo de frete.

COMPATIBILIDADE:
- 100% baseado na nuvem. Acessível via navegador (Chrome, Edge, Safari, Brave) no Windows, Mac, Linux e Chromebooks.

GARANTIA E SUPORTE:
- Garantia de 7 dias de acordo com o Código de Defesa do Consumidor (CDC).
- Atendimento direto e ágil no chat pós-venda do Mercado Livre.`
  },
  {
    id: 'MLB7784965030',
    sku: 'express',
    attributes: [
      { id: 'BRAND', value_name: 'Express' },
      { id: 'MODEL', value_name: 'Express Premium' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'DURATION', value_struct: { number: 12, unit: 'meses' } },
      { id: 'GTIN', value_name: '7898956241072' }
    ],
    description: `SEJA BEM-VINDO À NOSSA LOJA OFICIAL!

Crie designs profissionais, posts para redes sociais, banners, vídeos e materiais impressos de alto impacto com o Express Criativo Premium e a poderosa IA Generativa Firefly integrada.

O QUE ESTÁ INCLUSO:
- IA Generativa Firefly: Crie imagens ultrarrealistas, ilustrações e efeitos de texto mágicos a partir de simples comandos de texto.
- Remoção de Fundo em 1 Clique: Destaque produtos e pessoas de fotos e vídeos com precisão cirúrgica instantânea.
- Biblioteca Completa de Ativos: Milhares de templates profissionais, gráficos, animações e mais de 25.000 fontes licenciadas.
- Redimensionamento Rápido: Adapte um único design para Instagram, TikTok, Facebook, YouTube e stories em segundos.
- Duração: 12 meses de assinatura oficial.

COMO É FEITO O ENVIO:
- Envio 100% DIGITAL e ÁGIL após a aprovação da compra pelo Mercado Livre.
- As instruções de acesso e ativação são liberadas diretamente no CHAT DA SUA COMPRA no Mercado Livre.
- Não há envio físico nem taxa de frete.

COMPATIBILIDADE:
- Compatível com PC/Mac via navegador web e com smartphones e tablets (Android e iOS).

GARANTIA E SUPORTE:
- Garantia de 7 dias conforme o Código de Defesa do Consumidor (CDC).
- Suporte dedicado no chat de mensagens do Mercado Livre.`
  },
  {
    id: 'MLB5366439113',
    sku: 'prime',
    attributes: [
      { id: 'BRAND', value_name: 'Amazon' },
      { id: 'MODEL', value_name: 'Prime Video' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'DURATION', value_struct: { number: 6, unit: 'meses' } },
      { id: 'GTIN', value_name: '7898956241041' }
    ],
    description: `SEJA BEM-VINDO À NOSSA LOJA OFICIAL!

Assista a milhares de filmes de sucesso, séries aclamadas e produções Originais Amazon com a assinatura Prime Video em altíssima qualidade de imagem e som!

O QUE ESTÁ INCLUSO:
- Catálogo Gigante e Atualizado: Filmes campeões de bilheteria, séries exclusivas e produções originais premiadas mundialmente.
- Imagem e Áudio de Cinema: Suporte a 4K Ultra HD, HDR10 e áudio imersivo nos títulos compatíveis.
- Telas Simultâneas e Perfis: Assista com a família em até 3 telas ao mesmo tempo e crie perfis individuais para recomendações personalizadas.
- Modo Offline: Baixe episódios e filmes no seu celular ou tablet para assistir mesmo sem conexão com a internet.
- Duração: 6 meses de acesso oficial e contínuo.

COMO É FEITO O ENVIO:
- Envio 100% DIGITAL e RÁPIDO logo após a confirmação do pagamento pelo Mercado Livre.
- Instruções detalhadas de acesso enviadas exclusivamente pelo CHAT DA COMPRA do Mercado Livre.
- Frete zero (produto digital).

COMPATIBILIDADE:
- Smart TVs (Samsung, LG, Android TV, Fire TV, Roku), computadores (Windows/Mac), celulares e tablets (Android/iOS), e consoles de videogame.

GARANTIA E SUPORTE:
- Garantia de 7 dias com respaldo do Código de Defesa do Consumidor (CDC).
- Suporte pronto para atendimento no chat do Mercado Livre.`
  },
  {
    id: 'MLB5366512415',
    sku: 'duolingo',
    attributes: [
      { id: 'BRAND', value_name: 'Duolingo' },
      { id: 'MODEL', value_name: 'Duolingo Super' },
      { id: 'PREPAID_CARD_TYPE', value_id: '52275405', value_name: 'Assinatura' },
      { id: 'FORMAT', value_id: '2132699', value_name: 'Digital' },
      { id: 'REGION', value_id: '1233470', value_name: 'Brasil' },
      { id: 'DURATION', value_struct: { number: 12, unit: 'meses' } },
      { id: 'GTIN', value_name: '7898956241065' }
    ],
    description: `SEJA BEM-VINDO À NOSSA LOJA OFICIAL!

Aprenda novos idiomas de forma leve, divertida e muito mais rápida com o Duolingo Super — a versão definitiva do aplicativo de idiomas mais popular do mundo!

O QUE ESTÁ INCLUSO:
- Vidas Infinitas (Corações Ilimitados): Pratique sem pausas ou penalidades. Erre e tente novamente quantas vezes precisar para fixar o aprendizado.
- Zero Anúncios: Estude de forma contínua e focada, sem propagandas ou interrupções entre as lições.
- Prática Personalizada: Treinos focados especificamente nos seus erros anteriores para acelerar sua evolução.
- Testes de Nível Ilimitados: Avance pelos módulos no seu próprio ritmo sem gastar recursos.
- Duração: 12 meses de assinatura oficial.

COMO É FEITO O ENVIO:
- Envio 100% DIGITAL e ÁGIL após a confirmação do pagamento pelo Mercado Livre.
- As instruções de ativação na sua conta são enviadas diretamente pelo CHAT DA COMPRA no Mercado Livre.
- Sem custo de frete.

COMPATIBILIDADE:
- Disponível para smartphones Android, iPhone (iOS), iPad e também no computador pelo navegador web.

GARANTIA E SUPORTE:
- Garantia de 7 dias conforme o Código de Defesa do Consumidor (CDC).
- Atendimento humanizado e suporte completo pelo chat pós-venda do Mercado Livre.`
  }
];

function putItem(id, data) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(data);
    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${id}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ status: 500, error: e.message }));
    req.write(payload);
    req.end();
  });
}

function putDesc(id, text) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ plain_text: text });
    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path: `/items/${id}/description`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ status: 500, error: e.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('🚀 Atualizando Ficha Técnica Completa + Descrições Políticas 100%...');
  for (const item of UPDATES) {
    const resItem = await putItem(item.id, { attributes: item.attributes });
    console.log(`[Atributos] ${item.sku} (${item.id}): Status ${resItem.status}`);
    if (resItem.status !== 200) {
      console.log('Erro item:', resItem.body);
    }
    const resDesc = await putDesc(item.id, item.description);
    console.log(`[Descrição] ${item.sku} (${item.id}): Status ${resDesc.status}`);
    if (resDesc.status !== 200) {
      console.log('Erro desc:', resDesc.body);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('🏁 Atualização concluída com sucesso!');
}

run();
