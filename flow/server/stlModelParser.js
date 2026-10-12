import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';

/**
 * Normaliza strings para slugs compatíveis com IDs e diretórios
 */
export function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'modelo';
}

/**
 * Gera ID no padrão do 3D-Project (ex: suporte-celular-mux83k1)
 */
export function generateModelId(name) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slugify(name)}-${stamp}${rand}`;
}

/**
 * Analisa diretório central de um arquivo ZIP a partir do buffer
 */
export function parseZipEntries(buffer) {
  if (buffer.length < 22) return [];
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let eocd = -1;
  const maxSearch = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= maxSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return [];

  const entriesCount = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  let p = cdOffset;
  const entries = [];
  for (let i = 0; i < entriesCount; i++) {
    if (p + 46 > buffer.length) break;
    const sig = view.getUint32(p, true);
    if (sig !== 0x02014b50) break;
    const compMethod = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const uncompSize = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localHdrOffset = view.getUint32(p + 42, true);
    const name = buffer.toString('utf8', p + 46, p + 46 + nameLen);
    entries.push({ name, compMethod, compSize, uncompSize, localHdrOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/**
 * Extrai dados de uma entrada específica de um buffer ZIP
 */
export function extractZipEntry(buffer, entry) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const p = entry.localHdrOffset;
  if (p + 30 > buffer.length) throw new Error('Entrada ZIP truncada');
  const nameLen = view.getUint16(p + 26, true);
  const extraLen = view.getUint16(p + 28, true);
  const dataOffset = p + 30 + nameLen + extraLen;
  const compressed = buffer.subarray(dataOffset, dataOffset + entry.compSize);
  if (entry.compMethod === 0) return compressed;
  if (entry.compMethod === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`Método de compressão ${entry.compMethod} não suportado`);
}

/**
 * Verifica se um buffer com cabeçalho ZIP é na verdade um container 3MF
 */
export function is3mfZip(entries) {
  return entries.some(e => 
    /^3d\/3dmodel\.model$/i.test(e.name) || 
    /^3d\/objects\/.*\.model$/i.test(e.name) ||
    /\[content_types\]\.xml$/i.test(e.name)
  );
}

/**
 * Heurística de STL binário
 */
export function isBinaryStl(buffer) {
  if (buffer.length < 84) return false;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const declaredTriangles = view.getUint32(80, true);
  if (84 + declaredTriangles * 50 === buffer.length) return true;
  // Fallback para ASCII vs Binário
  const sample = buffer.subarray(0, Math.min(512, buffer.length)).toString('utf8').toLowerCase();
  return !(sample.includes('solid') && sample.includes('facet'));
}

/**
 * Heurística de STL ASCII
 */
export function isAsciiStl(buffer) {
  const sample = buffer.subarray(0, Math.min(512, buffer.length)).toString('utf8').toLowerCase();
  return sample.includes('solid') && (sample.includes('facet') || sample.includes('vertex'));
}

/**
 * Extrai modelos 3D de arquivos RAR utilizando WASM (node-unrar-js) e fallback local
 */
export async function extractRarArchive(buffer, originalFileName = 'archive.rar') {
  const results = [];

  // 1. Tenta extração via node-unrar-js (WASM, 100% em memória)
  try {
    const { createExtractorFromData } = await import('node-unrar-js');
    const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const extractor = await createExtractorFromData({ data: arrayBuf });
    const extracted = extractor.extract();

    for (const file of extracted.files) {
      if (file.fileHeader?.flags?.directory) continue;
      const fName = file.fileHeader?.name || '';
      if (!/\.(stl|3mf)$/i.test(fName) || fName.startsWith('__MACOSX/')) continue;

      const ext = fName.toLowerCase().endsWith('.3mf') ? '3mf' : 'stl';
      const base = fName.split(/[/\\]/).pop().replace(new RegExp(`\\.${ext}$`, 'i'), '');
      results.push({
        fileName: fName.split(/[/\\]/).pop(),
        cleanName: base,
        format: ext,
        buffer: Buffer.from(file.extraction)
      });
    }
    if (results.length > 0) {
      console.log(`[RAR Extraction] ${results.length} modelos extraídos via WASM de "${originalFileName}"`);
      return results;
    }
  } catch (err) {
    console.warn('[RAR WASM Extraction Warning]:', err.message);
  }

  // 2. Fallback via tar.exe do Windows (bsdtar / libarchive)
  try {
    const tempDir = path.join(os.tmpdir(), `rar_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const tempRar = path.join(tempDir, 'input.rar');
    fs.writeFileSync(tempRar, buffer);

    await new Promise((resolve, reject) => {
      exec(`tar -xf "${tempRar}" -C "${tempDir}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walkDir(full);
        } else if (/\.(stl|3mf)$/i.test(f)) {
          const ext = f.toLowerCase().endsWith('.3mf') ? '3mf' : 'stl';
          const base = f.replace(new RegExp(`\\.${ext}$`, 'i'), '');
          results.push({
            fileName: f,
            cleanName: base,
            format: ext,
            buffer: fs.readFileSync(full)
          });
        }
      }
    }
    walkDir(tempDir);
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    if (results.length > 0) {
      console.log(`[RAR Extraction] ${results.length} modelos extraídos via fallback tar de "${originalFileName}"`);
    }
  } catch (fallbackErr) {
    console.warn('[RAR Tar Fallback Warning]:', fallbackErr.message);
  }

  return results;
}

/**
 * Limpa o nome do anexo do WhatsApp e extrai os modelos reais
 * Resolve o problema onde o WhatsApp renomeia .stl ou .3mf para .zip ou envia .rar
 * Devolve um array de objetos: [{ fileName, cleanName, format, buffer }]
 */
export async function cleanAndExtractAttachments(rawFileName, rawBuffer) {
  let name = (rawFileName || 'anexo').trim();
  const results = [];

  // 1. Caso direto com extensão dupla: exemplo "modelo.stl.zip" -> "modelo.stl"
  if (/\.stl\.zip$/i.test(name)) {
    const cleanName = name.replace(/\.zip$/i, '');
    return [{
      fileName: cleanName,
      cleanName: cleanName.replace(/\.stl$/i, ''),
      format: 'stl',
      buffer: rawBuffer
    }];
  }

  // 2. Caso direto com extensão dupla 3MF: "peca.3mf.zip" -> "peca.3mf"
  if (/\.3mf\.zip$/i.test(name)) {
    const cleanName = name.replace(/\.zip$/i, '');
    return [{
      fileName: cleanName,
      cleanName: cleanName.replace(/\.3mf$/i, ''),
      format: '3mf',
      buffer: rawBuffer
    }];
  }

  // 3. Caso o arquivo venha terminado em .zip ou sem extensão clara
  const isZip = rawBuffer.length >= 4 && rawBuffer[0] === 0x50 && rawBuffer[1] === 0x4B;

  if (isZip) {
    const entries = parseZipEntries(rawBuffer);

    // 3a. É um 3MF completo que recebeu nome .zip!
    if (is3mfZip(entries)) {
      const cleanName = name.replace(/\.zip$/i, '') + '.3mf';
      return [{
        fileName: cleanName,
        cleanName: cleanName.replace(/\.3mf$/i, ''),
        format: '3mf',
        buffer: rawBuffer
      }];
    }

    // 3b. É um arquivo ZIP contendo arquivos 3D dentro
    const modelEntries = entries.filter(e => /\.(stl|3mf)$/i.test(e.name) && !e.name.startsWith('__MACOSX/'));
    if (modelEntries.length > 0) {
      for (const entry of modelEntries) {
        try {
          const extractedBuf = extractZipEntry(rawBuffer, entry);
          const ext = entry.name.toLowerCase().endsWith('.3mf') ? '3mf' : 'stl';
          const base = entry.name.split('/').pop().replace(new RegExp(`\\.${ext}$`, 'i'), '');
          results.push({
            fileName: entry.name.split('/').pop(),
            cleanName: base,
            format: ext,
            buffer: extractedBuf
          });
        } catch (err) {
          console.warn(`[STL Parser] Falha ao extrair ${entry.name}:`, err.message);
        }
      }
      if (results.length > 0) return results;
    }
  }

  // 4. Caso o arquivo venha terminado em .rar ou tenha assinatura RAR
  const isRar = /\.rar$/i.test(name) || (rawBuffer.length >= 4 && rawBuffer[0] === 0x52 && rawBuffer[1] === 0x61 && rawBuffer[2] === 0x72 && rawBuffer[3] === 0x21);
  if (isRar) {
    const rarModels = await extractRarArchive(rawBuffer, name);
    if (rarModels.length > 0) return rarModels;
  }

  // 4. Se o nome termina em .stl ou o buffer é STL puro
  if (/\.stl$/i.test(name) || (!isZip && (isBinaryStl(rawBuffer) || isAsciiStl(rawBuffer)))) {
    const cleanName = name.replace(/\.zip$/i, '');
    const finalName = /\.stl$/i.test(cleanName) ? cleanName : `${cleanName}.stl`;
    return [{
      fileName: finalName,
      cleanName: finalName.replace(/\.stl$/i, ''),
      format: 'stl',
      buffer: rawBuffer
    }];
  }

  // 5. Se o nome termina em .3mf
  if (/\.3mf$/i.test(name)) {
    return [{
      fileName: name,
      cleanName: name.replace(/\.3mf$/i, ''),
      format: '3mf',
      buffer: rawBuffer
    }];
  }

  // Se nada casar, retorna vazio para ignorar anexos irrelevantes (PDFs, imagens comuns, etc.)
  return [];
}

/**
 * Extrai métricas de dimensões e contagem de triângulos de STL binário
 */
export function extractStlMetrics(buffer) {
  if (buffer.length < 84) {
    return { triangles: 0, dim_x: 0, dim_y: 0, dim_z: 0, weightGrams: 0 };
  }

  const isBin = isBinaryStl(buffer);
  if (!isBin) {
    // Parser simples para ASCII STL
    const text = buffer.toString('utf8');
    const vertices = [...text.matchAll(/vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/gi)];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const v of vertices) {
      const x = parseFloat(v[1]), y = parseFloat(v[2]), z = parseFloat(v[3]);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }
    const triangles = Math.floor(vertices.length / 3);
    const dx = isFinite(minX) ? Math.max(0, maxX - minX) : 0;
    const dy = isFinite(minY) ? Math.max(0, maxY - minY) : 0;
    const dz = isFinite(minZ) ? Math.max(0, maxZ - minZ) : 0;
    const vol = (dx * dy * dz * 0.4) / 1000;
    return {
      triangles,
      dim_x: Number(dx.toFixed(2)),
      dim_y: Number(dy.toFixed(2)),
      dim_z: Number(dz.toFixed(2)),
      weightGrams: Number((vol * 1.24).toFixed(2))
    };
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const declared = view.getUint32(80, true);
  const maxPossible = Math.floor((buffer.length - 84) / 50);
  const count = Math.min(declared, maxPossible);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let volume = 0;

  for (let i = 0; i < count; i++) {
    const offset = 84 + i * 50 + 12;
    const ax = view.getFloat32(offset, true);
    const ay = view.getFloat32(offset + 4, true);
    const az = view.getFloat32(offset + 8, true);
    const bx = view.getFloat32(offset + 12, true);
    const by = view.getFloat32(offset + 16, true);
    const bz = view.getFloat32(offset + 20, true);
    const cx = view.getFloat32(offset + 24, true);
    const cy = view.getFloat32(offset + 28, true);
    const cz = view.getFloat32(offset + 32, true);

    minX = Math.min(minX, ax, bx, cx); maxX = Math.max(maxX, ax, bx, cx);
    minY = Math.min(minY, ay, by, cy); maxY = Math.max(maxY, ay, by, cy);
    minZ = Math.min(minZ, az, bz, cz); maxZ = Math.max(maxZ, az, bz, cz);

    volume += (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6;
  }

  const dx = isFinite(minX) ? Math.max(0, maxX - minX) : 0;
  const dy = isFinite(minY) ? Math.max(0, maxY - minY) : 0;
  const dz = isFinite(minZ) ? Math.max(0, maxZ - minZ) : 0;
  const volumeCm3 = Math.abs(volume) / 1000;

  return {
    triangles: count,
    dim_x: Number(dx.toFixed(2)),
    dim_y: Number(dy.toFixed(2)),
    dim_z: Number(dz.toFixed(2)),
    weightGrams: Number((volumeCm3 * 1.24).toFixed(2))
  };
}

/**
 * Extrai métricas de dimensões e triângulos de 3MF
 */
export function extract3mfMetrics(buffer) {
  try {
    const entries = parseZipEntries(buffer);
    const modelEntries = entries.filter(e => /\.model$/i.test(e.name));
    if (modelEntries.length === 0) {
      return { triangles: 0, dim_x: 0, dim_y: 0, dim_z: 0, weightGrams: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let totalTriangles = 0;

    for (const entry of modelEntries) {
      const xml = extractZipEntry(buffer, entry).toString('utf8');
      
      // Contagem de triângulos
      const triangleMatches = xml.match(/<triangle\s+/gi);
      if (triangleMatches) totalTriangles += triangleMatches.length;

      // Unidade de medida (padrão millimeter)
      let scale = 1;
      const unitMatch = xml.match(/<model[^>]*unit=[\"']([^\"']+)[\"']/i);
      if (unitMatch) {
        const u = unitMatch[1].toLowerCase();
        if (u === 'micron') scale = 0.001;
        else if (u === 'centimeter') scale = 10;
        else if (u === 'inch') scale = 25.4;
      }

      // Vértices
      const vertexRegex = /<vertex\s+[^>]*x=["']([^"']+)["'][^>]*y=["']([^"']+)["'][^>]*z=["']([^"']+)["']/gi;
      let match;
      while ((match = vertexRegex.exec(xml)) !== null) {
        const x = parseFloat(match[1]) * scale;
        const y = parseFloat(match[2]) * scale;
        const z = parseFloat(match[3]) * scale;
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        }
      }
    }

    const dx = isFinite(minX) ? Math.max(0, maxX - minX) : 0;
    const dy = isFinite(minY) ? Math.max(0, maxY - minY) : 0;
    const dz = isFinite(minZ) ? Math.max(0, maxZ - minZ) : 0;
    const estimatedVolCm3 = (dx * dy * dz * 0.35) / 1000;

    return {
      triangles: totalTriangles,
      dim_x: Number(dx.toFixed(2)),
      dim_y: Number(dy.toFixed(2)),
      dim_z: Number(dz.toFixed(2)),
      weightGrams: Number((estimatedVolCm3 * 1.24).toFixed(2))
    };
  } catch (err) {
    console.warn('[3MF Metric Error]:', err.message);
    return { triangles: 0, dim_x: 0, dim_y: 0, dim_z: 0, weightGrams: 0 };
  }
}

/**
 * Extrai métricas com base no formato
 */
export function extractModelMetrics(buffer, format) {
  if (format === '3mf') return extract3mfMetrics(buffer);
  return extractStlMetrics(buffer);
}

export const MAX_MODEL_FILE_SIZE = 100 * 1024 * 1024; // 100 MB (limite seguro aceito pelo Git/GitHub e 3D-Project)
export const MIN_MODEL_FILE_SIZE = 120; // Pelo menos tamanho de cabeçalho válido

/**
 * Validação rigorosa e preventiva para modelos 3D
 * Garante que apenas arquivos íntegros, dentro da cota de armazenamento e com malha 3D real sejam aceitos.
 * @returns {{ valid: boolean, reason?: string, metrics?: object }}
 */
export function validate3DModel(buffer, format, fileName = '') {
  // 1. Validação de tamanho
  if (!buffer || buffer.length === 0) {
    return { valid: false, reason: 'Arquivo vazio (0 bytes)' };
  }
  if (buffer.length < MIN_MODEL_FILE_SIZE) {
    return { valid: false, reason: `Arquivo truncado ou incompleto (${buffer.length} bytes)` };
  }
  if (buffer.length > MAX_MODEL_FILE_SIZE) {
    const mb = (buffer.length / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      reason: `Arquivo excede o limite máximo permitido de 100 MB (${mb} MB). Rejeitado para não violar a cota.` 
    };
  }

  const fmt = String(format || '').toLowerCase();

  // 2. Validação para STL
  if (fmt === 'stl') {
    const isBin = isBinaryStl(buffer);
    const isAsc = isAsciiStl(buffer);
    if (!isBin && !isAsc) {
      return { valid: false, reason: 'Arquivo STL corrompido ou formato não reconhecido (nem binário nem ASCII)' };
    }

    const metrics = extractStlMetrics(buffer);
    if (!metrics || metrics.triangles <= 0) {
      return { valid: false, reason: 'Arquivo STL não contém triângulos válidos (geometria vazia)' };
    }
    if (metrics.dim_x <= 0 && metrics.dim_y <= 0 && metrics.dim_z <= 0) {
      return { valid: false, reason: 'Dimensões do modelo STL são zeradas ou colapsadas' };
    }
    return { valid: true, metrics };
  }

  // 3. Validação para 3MF
  if (fmt === '3mf') {
    let entries = [];
    try {
      entries = parseZipEntries(buffer);
    } catch (err) {
      return { valid: false, reason: `Arquivo 3MF com container ZIP corrompido: ${err.message}` };
    }

    if (!entries || entries.length === 0) {
      return { valid: false, reason: 'Container 3MF não contém arquivos internos válidos' };
    }

    const hasModel = entries.some(e => /\.model$/i.test(e.name));
    if (!hasModel) {
      return { valid: false, reason: 'Arquivo 3MF não contém nenhuma definição de geometria 3D (.model)' };
    }

    const metrics = extract3mfMetrics(buffer);
    if (!metrics || metrics.triangles <= 0) {
      return { valid: false, reason: 'Arquivo 3MF possui definições sem triângulos na malha' };
    }
    if (metrics.dim_x <= 0 && metrics.dim_y <= 0 && metrics.dim_z <= 0) {
      return { valid: false, reason: 'Dimensões do modelo 3MF são zeradas ou colapsadas' };
    }

    return { valid: true, metrics };
  }

  return { valid: false, reason: `Formato de arquivo não suportado: ${format}` };
}

