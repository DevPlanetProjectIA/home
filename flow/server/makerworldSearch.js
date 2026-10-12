import sharp from 'sharp';

export function sanitizeSearchQuery(title) {
  return String(title || '')
    .replace(/-mv[a-z0-9]+/gi, '')
    .replace(/\b(3mf|stl|rar|zip|faster|ams|v3|timizado|customizable|a1 mini version|bambu)\b/gi, '')
    .replace(/[()_.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const JUNK_PATTERNS = [
  'user-badge', 'avatar', 'badge', 'logo', 'icon', 'guardian',
  'wp-content', 'hero_meshy', 'makerworld-bambulab', 'capa-conteudo',
  '08-makerworld', 'placeholder', 'favicon', 'default-image'
];

function isJunkUrl(url) {
  const l = (url || '').toLowerCase();
  return JUNK_PATTERNS.some(p => l.includes(p));
}

/**
 * Busca candidatos a fotos de projetos 3D via DuckDuckGo com fallback para Bing
 */
export async function search3DModelCandidates(modelTitle) {
  const cleanTitle = sanitizeSearchQuery(modelTitle);
  if (!cleanTitle || cleanTitle.length < 2) return [];

  const candidates = [];
  const seenUrls = new Set();

  // 1. DuckDuckGo Image Search (retorna fotos reais de peças montadas do MakerWorld, Cults3D, etc.)
  try {
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(cleanTitle + ' 3d print')}&t=h_&iar=images&iax=images&ia=images`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (tokenRes.ok) {
      const html = await tokenRes.text();
      const vqdMatch = html.match(/vqd=([^&'"]+)/) || html.match(/vqd:\s*"([^"]+)"/);
      if (vqdMatch) {
        const vqd = vqdMatch[1];
        const apiRes = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(cleanTitle + ' 3d print')}&vqd=${vqd}&f=,,,&p=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://duckduckgo.com/'
          },
          signal: AbortSignal.timeout(8000)
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          for (const item of (data.results || [])) {
            const imgUrl = item.image || '';
            if (!imgUrl || isJunkUrl(imgUrl) || seenUrls.has(imgUrl)) continue;
            seenUrls.add(imgUrl);

            const isMakerWorld = imgUrl.includes('makerworld.bblmw.com') || (item.title || '').toLowerCase().includes('makerworld');
            candidates.push({
              id: candidates.length,
              title: item.title || cleanTitle,
              url: imgUrl,
              thumbUrl: item.thumbnail || imgUrl,
              isMakerWorld,
              source: isMakerWorld ? 'MakerWorld' : 'Comunidade 3D'
            });

            if (candidates.length >= 10) break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DDG Search Warning]:', err.message);
  }

  // 2. Fallback via Bing Images se DDG retornar pouco
  if (candidates.length < 4) {
    try {
      const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanTitle + ' 3d print model')}&FORM=HDRSC2`;
      const res = await fetch(bingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const html = await res.text();
        const murls = [...html.matchAll(/&quot;murl&quot;:&quot;(https:[^&]+)&quot;/gi)].map(m => m[1]);
        for (const u of murls) {
          if (!isJunkUrl(u) && !seenUrls.has(u)) {
            seenUrls.add(u);
            const isMakerWorld = u.includes('makerworld.bblmw.com');
            candidates.push({
              id: candidates.length,
              title: cleanTitle,
              url: u,
              thumbUrl: u,
              isMakerWorld,
              source: isMakerWorld ? 'MakerWorld' : 'Comunidade 3D'
            });
            if (candidates.length >= 10) break;
          }
        }
      }
    } catch {}
  }

  // Prioriza MakerWorld
  return candidates.sort((a, b) => (b.isMakerWorld ? 1 : 0) - (a.isMakerWorld ? 1 : 0));
}

/**
 * Busca automática de foto oficial (pega o melhor candidato e gera PNG 512x512)
 */
export async function searchMakerWorldImage(modelTitle) {
  const candidates = await search3DModelCandidates(modelTitle);
  if (!candidates || candidates.length === 0) return null;

  for (const item of candidates) {
    try {
      console.log(`  📸 Baixando capa candidata: ${item.url.slice(0, 90)}...`);
      const dlRes = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!dlRes.ok) continue;
      const rawBuf = Buffer.from(await dlRes.arrayBuffer());
      if (rawBuf.length < 5000) continue; // muito pequeno / inválido

      return await sharp(rawBuf)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        })
        .png()
        .toBuffer();
    } catch (err) {
      console.warn(`[Image Download Warning] ${item.url}:`, err.message);
    }
  }

  return null;
}
