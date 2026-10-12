import sharp from 'sharp';
import { parseZipEntries, extractZipEntry } from './stlModelParser.js';
import { searchMakerWorldImage } from './makerworldSearch.js';

/**
 * Tenta extrair imagem de capa embutida no arquivo 3MF
 * Suporta fotos reais do MakerWorld, miniaturas Bambu Studio, OrcaSlicer e PrusaSlicer.
 */
export function extractEmbedded3mfImage(buffer) {
  try {
    const entries = parseZipEntries(buffer);
    if (!entries || entries.length === 0) return null;

    // Ordem estrita de preferência de capa:
    // 1. Fotos reais de alta definição da peça impressa (MakerWorld: Auxiliaries/Model Pictures/*.webp ou *.jpg)
    // 2. Foto de capa do perfil Bambu/Orca (Auxiliaries/Profile Pictures/*.webp ou *.jpg)
    // 3. Render oficial do modelo montado (Auxiliaries/.thumbnails/thumbnail_3mf.png)
    // 4. Thumbnail oficial ou capa oficial (Metadata/thumbnail.* ou Metadata/cover.*)
    // 5. Visão de prato fatiado em alta resolução (Metadata/plate_1.png)
    // 6. Visão superior da mesa (Metadata/top_1.png)
    // NUNCA pick_*.png (máscara preta de picking) nem *_small.png nem plate_no_light_*.png!
    const priorities = [
      /auxiliaries\/model pictures\/.*\.(webp|jpe?g|png)$/i,
      /auxiliaries\/profile pictures\/.*\.(webp|jpe?g|png)$/i,
      /auxiliaries\/\.thumbnails\/thumbnail_3mf\.png$/i,
      /metadata\/thumbnail\.(png|jpe?g|webp)$/i,
      /thumbnail\.(png|jpe?g|webp)$/i,
      /metadata\/cover\.(png|jpe?g|webp)$/i,
      /metadata\/plate_1\.png$/i,
      /plate_1\.png$/i,
      /thumbnail_middle\.png$/i,
      /metadata\/top_1\.png$/i,
      /metadata\/plate_2\.png$/i,
      /metadata\/plate_3\.png$/i,
      /metadata\/plate_4\.png$/i
    ];

    for (const regex of priorities) {
      const match = entries.find(e => regex.test(e.name));
      if (match) {
        try {
          const rawImg = extractZipEntry(buffer, match);
          // Validação: não aceitar imagens com menos de 3KB (geralmente ícones 32x32 vazios)
          if (rawImg && rawImg.length > 3000) {
            return rawImg;
          }
        } catch {}
      }
    }

    // Fallback: qualquer imagem PNG/JPG/WEBP relevante que não seja pick ou no_light ou small
    const anyImage = entries.find(e => 
      /\.(png|jpe?g|webp)$/i.test(e.name) && 
      !e.name.toLowerCase().includes('_small') &&
      !e.name.toLowerCase().includes('pick_') &&
      !e.name.toLowerCase().includes('no_light')
    );

    if (anyImage) {
      try {
        const rawImg = extractZipEntry(buffer, anyImage);
        if (rawImg && rawImg.length > 3000) return rawImg;
      } catch {}
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Extrai triângulos 3D de modelos XML contidos dentro de um arquivo 3MF
 */
export function extract3mfTriangles(buffer) {
  try {
    const entries = parseZipEntries(buffer);
    const modelEntries = entries.filter(e => /\.model$/i.test(e.name));
    if (modelEntries.length === 0) return [];

    const allTriangles = [];

    for (const entry of modelEntries) {
      const xml = extractZipEntry(buffer, entry).toString('utf8');
      const vertices = [];
      const vRegex = /<vertex\s+[^>]*x=["']([^"']+)["'][^>]*y=["']([^"']+)["'][^>]*z=["']([^"']+)["']/gi;
      let m;
      while ((m = vRegex.exec(xml)) !== null) {
        vertices.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
      }

      const tRegex = /<triangle\s+[^>]*v1=["'](\d+)["'][^>]*v2=["'](\d+)["'][^>]*v3=["'](\d+)["']/gi;
      while ((m = tRegex.exec(xml)) !== null) {
        const p1 = vertices[parseInt(m[1])];
        const p2 = vertices[parseInt(m[2])];
        const p3 = vertices[parseInt(m[3])];
        if (p1 && p2 && p3) {
          allTriangles.push({
            ax: p1[0], ay: p1[1], az: p1[2],
            bx: p2[0], by: p2[1], bz: p2[2],
            cx: p3[0], cy: p3[1], cz: p3[2]
          });
        }
      }
    }

    return allTriangles;
  } catch (err) {
    console.warn('[3MF Triangle Parser Warning]:', err.message);
    return [];
  }
}

/**
 * Renderizador Isométrico 3D Vetorial a partir de uma lista de triângulos
 * Projeta triângulos em 2D com sombreamento e iluminação direta,
 * convertendo para PNG de 512x512 com fundo escuro elegante.
 */
export async function renderTrianglesToPng(triangles, size = 512) {
  try {
    if (!triangles || triangles.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const maxPolygons = 15000;
    const step = Math.max(1, Math.floor(triangles.length / maxPolygons));
    const sampled = [];

    for (let i = 0; i < triangles.length; i += step) {
      const t = triangles[i];
      minX = Math.min(minX, t.ax, t.bx, t.cx); maxX = Math.max(maxX, t.ax, t.bx, t.cx);
      minY = Math.min(minY, t.ay, t.by, t.cy); maxY = Math.max(maxY, t.ay, t.by, t.cy);
      minZ = Math.min(minZ, t.az, t.bz, t.cz); maxZ = Math.max(maxZ, t.az, t.bz, t.cz);
      sampled.push(t);
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const scale = (size * 0.72) / maxDim;

    // Ângulo Isométrico (32° elevação, 45° rotação)
    const radAz = (45 * Math.PI) / 180;
    const radEl = (32 * Math.PI) / 180;
    const cosAz = Math.cos(radAz), sinAz = Math.sin(radAz);
    const cosEl = Math.cos(radEl), sinEl = Math.sin(radEl);

    // Vetor de Luz Direcional Superior
    const lx = 0.55, ly = -0.55, lz = 0.62;
    const lightLen = Math.hypot(lx, ly, lz);
    const nlx = lx / lightLen, nly = ly / lightLen, nlz = lz / lightLen;

    const projected = [];

    for (const t of sampled) {
      // Vértice A
      const x1 = t.ax - cx, y1 = t.ay - cy, z1 = t.az - cz;
      const px1 = x1 * cosAz - y1 * sinAz;
      const ry1 = x1 * sinAz + y1 * cosAz;
      const py1 = ry1 * sinEl + z1 * cosEl;
      const pz1 = -ry1 * cosEl + z1 * sinEl;

      // Vértice B
      const x2 = t.bx - cx, y2 = t.by - cy, z2 = t.bz - cz;
      const px2 = x2 * cosAz - y2 * sinAz;
      const ry2 = x2 * sinAz + y2 * cosAz;
      const py2 = ry2 * sinEl + z2 * cosEl;
      const pz2 = -ry2 * cosEl + z2 * sinEl;

      // Vértice C
      const x3 = t.cx - cx, y3 = t.cy - cy, z3 = t.cz - cz;
      const px3 = x3 * cosAz - y3 * sinAz;
      const ry3 = x3 * sinAz + y3 * cosAz;
      const py3 = ry3 * sinEl + z3 * cosEl;
      const pz3 = -ry3 * cosEl + z3 * sinEl;

      // Vetor normal no espaço de tela
      const ux = px2 - px1, uy = py2 - py1, uz = pz2 - pz1;
      const vx = px3 - px1, vy = py3 - py1, vz = pz3 - pz1;
      const normZ = ux * vy - uy * vx;

      // Descarta faces traseiras ocultas
      if (normZ <= 0) continue;

      const normX = uy * vz - uz * vy;
      const normY = uz * vx - ux * vz;
      const len = Math.hypot(normX, normY, normZ) || 1;
      const dot = Math.max(0, (normX / len) * nlx + (normY / len) * nly + (normZ / len) * nlz);
      const lum = Math.round(28 + dot * 58);

      const sx1 = (size / 2 + px1 * scale).toFixed(1);
      const sy1 = (size / 2 - py1 * scale).toFixed(1);
      const sx2 = (size / 2 + px2 * scale).toFixed(1);
      const sy2 = (size / 2 - py2 * scale).toFixed(1);
      const sx3 = (size / 2 + px3 * scale).toFixed(1);
      const sy3 = (size / 2 - py3 * scale).toFixed(1);

      const avgZ = (pz1 + pz2 + pz3) / 3;
      const color = `hsl(210, 85%, ${lum}%)`;
      projected.push({
        avgZ,
        poly: `<polygon points="${sx1},${sy1} ${sx2},${sy2} ${sx3},${sy3}" fill="${color}" stroke="${color}" stroke-width="0.3"/>`
      });
    }

    // Painter's algorithm
    projected.sort((a, b) => a.avgZ - b.avgZ);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <g>${projected.map(p => p.poly).join('')}</g>
    </svg>`;

    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch (err) {
    console.warn('[3D Thumbnail Render Error]:', err.message);
    return null;
  }
}

/**
 * Renderizador 3D Isométrico para arquivos STL
 */
export async function render3dIsometricPreview(buffer, size = 512) {
  try {
    if (buffer.length < 84) return null;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const count = view.getUint32(80, true);
    if (84 + count * 50 > buffer.length) return null;

    const triangles = [];
    for (let i = 0; i < count; i++) {
      const offset = 84 + i * 50;
      triangles.push({
        ax: view.getFloat32(offset + 12, true),
        ay: view.getFloat32(offset + 16, true),
        az: view.getFloat32(offset + 20, true),
        bx: view.getFloat32(offset + 24, true),
        by: view.getFloat32(offset + 28, true),
        bz: view.getFloat32(offset + 32, true),
        cx: view.getFloat32(offset + 36, true),
        cy: view.getFloat32(offset + 40, true),
        cz: view.getFloat32(offset + 44, true)
      });
    }

    return await renderTrianglesToPng(triangles, size);
  } catch (err) {
    return null;
  }
}

/**
 * Renderizador 3D Isométrico para arquivos 3MF sem fotos embutidas
 */
export async function render3mfIsometricPreview(buffer, size = 512) {
  const triangles = extract3mfTriangles(buffer);
  if (!triangles || triangles.length === 0) return null;
  return await renderTrianglesToPng(triangles, size);
}

/**
 * Cria uma capa com visual estilizado para modelos sem geometria legível
 */
export async function renderFallbackThumbnail(title, format, size = 512) {
  const cleanTitle = (title || 'Modelo 3D').slice(0, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" rx="16"/>
    <g transform="translate(196, 150)">
      <polygon points="60,10 110,38 110,95 60,125 10,95 10,38" fill="none" stroke="#38bdf8" stroke-width="4"/>
      <polyline points="10,38 60,68 110,38" fill="none" stroke="#38bdf8" stroke-width="4"/>
      <line x1="60" y1="68" x2="60" y2="125" stroke="#38bdf8" stroke-width="4"/>
    </g>
    <text x="50%" y="330" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700">
      ${cleanTitle}
    </text>
    <text x="50%" y="365" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="2">
      ARQUIVO .${(format || '3D').toUpperCase()}
    </text>
  </svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Gera a miniatura definitiva para qualquer modelo 3D (3MF ou STL)
 * Devolve Buffer PNG de 512x512
 */
export async function generateThumbnailForModel(buffer, format, title = '') {
  // 1. Se for 3MF, tenta primeiro a capa original embutida pelo fatiador ou MakerWorld
  if (format === '3mf') {
    const embeddedImg = extractEmbedded3mfImage(buffer);
    if (embeddedImg) {
      try {
        return await sharp(embeddedImg)
          .resize(512, 512, {
            fit: 'contain',
            background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
          })
          .png()
          .toBuffer();
      } catch (e) {
        console.warn('[Thumbnail Warning] Falha ao redimensionar imagem embutida:', e.message);
      }
    }
  }

  // 2. Busca na web / MakerWorld pela foto oficial do projeto montado
  if (title && title.length > 2) {
    try {
      const mwPhoto = await searchMakerWorldImage(title);
      if (mwPhoto && mwPhoto.length > 3000) {
        console.log(`[Thumbnail Engine] 🌟 Capa oficial do MakerWorld obtida para "${title}" (${mwPhoto.length} bytes)`);
        return mwPhoto;
      }
    } catch (err) {
      console.warn(`[Thumbnail Engine] Aviso na busca MakerWorld para "${title}":`, err.message);
    }
  }

  // 3. Se não houver foto no MakerWorld, gera renderização 3D isométrica da malha
  if (format === '3mf') {
    const rendered3mf = await render3mfIsometricPreview(buffer, 512);
    if (rendered3mf) return rendered3mf;
  }

  if (format === 'stl') {
    const rendered = await render3dIsometricPreview(buffer, 512);
    if (rendered) return rendered;
  }

  // 4. Fallback visual padronizado caso a malha esteja ilegível
  return await renderFallbackThumbnail(title, format, 512);
}
