/**
 * Normaliza e humaniza nomes de arquivos de modelos 3D
 * Transforma nomes técnicos crus em títulos amigáveis, legíveis e profissionais.
 */
export function humanizeModelName(rawFileName) {
  let s = String(rawFileName || '').trim();

  // 1. Remove extensões de arquivo
  s = s.replace(/\.(stl|3mf|zip|gcode|step|obj)$/gi, '');

  // 2. Remove sufixos numéricos de duplicata (1), (2), etc.
  s = s.replace(/\s*\(\d+\)\s*$/g, '');
  s = s.replace(/_\(\d+\)\s*$/g, '');

  // 3. Substitui separadores rígidos por espaços (incluindo hífens de kebab-case)
  s = s.replace(/[\+_]+/g, ' ');
  // Se contiver múltiplos hífens colados em letras (kebab-case), transforma em espaços
  s = s.replace(/([a-zA-Z0-9])-([a-zA-Z0-9])/g, '$1 $2');
  s = s.replace(/\s*-\s*/g, ' ');
  s = s.replace(/^100%\s*/gi, '');

  // 4. Normaliza termos de IA conhecidos
  s = s.replace(/meshy\s*ai\s*export\s*\d+(\s*image\s*to\s*3d\s*texture|\s*texture)?/gi, 'Modelo Texturizado Meshy AI');

  // 5. Dicionário de termos comuns para tradução e títulos amigáveis (aplicado antes para casar expressões completas)
  const dictionary = [
    { test: /outubro\s*rosa.*mulher\s*maravilha/i, to: 'Chaveiro Outubro Rosa - Mulher-Maravilha' },
    { test: /outubro\s*rosa.*bonequinha/i, to: 'Chaveiro Outubro Rosa - Bonequinha' },
    { test: /^chaveiro\s*rosa$/i, to: 'Chaveiro Outubro Rosa' },
    { test: /corujinha\s*professor/i, to: 'Chaveiro Corujinha (Professor)' },
    { test: /coruja\s*professora/i, to: 'Chaveiro Coruja (Professora)' },
    { test: /lapis\s*coloridos/i, to: 'Chaveiro Lápis Coloridos' },
    { test: /olho\s*grego/i, to: 'Chaveiro Olho Grego (Conjunto)' },
    { test: /switch\s*gameh(ü|u)llen|nintendo\s*switch/i, to: 'Suporte para Jogos Nintendo Switch' },
    { test: /pen\s*holder\s*customizable|porta\s*-\s*canetas\s*personaliz/i, to: 'Porta-Canetas Personalizável' },
    { test: /pen\s*holder|porta\s*-\s*canetas/i, to: 'Porta-Canetas' },
    { test: /tree\s*ornament\s*names/i, to: 'Enfeite de Árvore de Natal com Nomes' },
    { test: /santa\s*split/i, to: 'Papai Noel Articulado (Santa Split)' },
    { test: /articulated\s*cute\s*t\s*rex|t\s*-\s*rex/i, to: 'T-Rex Fofo Articulado' },
    { test: /caixa\s*cadeado/i, to: 'Caixa com Cadeado' },
    { test: /chaveiro\s*nossa\s*senhora/i, to: 'Chaveiro Nossa Senhora (6,5cm)' },
    { test: /chaveiro\s*voc(ê|e)\s*faz\s*a\s*diferen(ç|c)a/i, to: 'Chaveiro Você Faz a Diferença' },
    { test: /suporte\s*abridor\s*de\s*lata\s*coracao/i, to: 'Suporte Abridor de Lata Coração (MS Fox V3)' },
    { test: /mascote\s*spfc/i, to: 'Mascote SPFC - Rogério Ceni Mundial 2005 (53cm)' },
    { test: /drag(ã|a)o\s*articulado\s*wyvern|wyvern/i, to: 'Dragão Articulado Wyvern' },
    { test: /^np1$/i, to: 'Suporte NP1' },
    { test: /suporte\s+np1/i, to: 'Suporte NP1' }
  ];

  for (const item of dictionary) {
    if (item.test.test(s)) {
      s = item.to;
      break;
    }
  }

  // 6. Separa palavras grudadas em CamelCase / PascalCase
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // 7. Remove ruídos técnicos de fatiadores
  s = s.replace(/\b(multipart\s*bambustudio\s*x1c|bambustudio\s*x1c|bambustudio|orcaslicer|creality|prusa)\b/gi, '');
  s = s.replace(/\b(a1\s*mini\s*version|a1\s*mini|x1c|p1p|ams)\b/gi, '');
  s = s.replace(/\b(faster|otimizado|timizado|projekt|2\s*teilig|1\s*teilig)\b/gi, '');
  s = s.replace(/\(\(+/g, '(').replace(/\)\)+/g, ')');
  s = s.replace(/\bmultipart\b/gi, '(Multipart)');

  // 8. Limpa espaços extras e hífens órfãos
  s = s.replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').replace(/^-\s*/, '').trim();

  // 9. Formatação em Title Case elegante
  const lowerWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com', 'a', 'o', 'no', 'na', 'por']);
  const acronyms = new Set(['SPFC', 'MS', 'V3', 'AI', 'STL', '3MF', 'CM', 'NP1', 'T-REX', 'CENI']);

  const words = s.split(/\s+/).map((w, idx) => {
    const cleanWord = w.replace(/^[^\w\u00C0-\u00FF]+|[^\w\u00C0-\u00FF]+$/g, '');
    const upper = cleanWord.toUpperCase();

    if (acronyms.has(upper)) {
      return w.replace(cleanWord, upper);
    }

    const low = cleanWord.toLowerCase();
    if (idx > 0 && lowerWords.has(low)) {
      return w.replace(cleanWord, low);
    }

    const capitalized = low.charAt(0).toUpperCase() + low.slice(1);
    return w.replace(cleanWord, capitalized);
  });

  return words.join(' ').replace(/\s+-\s*$/, '').trim() || 'Modelo 3D';
}
