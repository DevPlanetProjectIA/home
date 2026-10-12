import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateThumbnailForModel } from './thumbnailGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '3D-Project');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqhxwpgpzseprcmiuaww.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_USER_ID = process.env.SUPABASE_USER_ID || 'a25a3db7-e996-47c8-869f-3c167f26cf1e';

async function run() {
  console.log('🚀 Iniciando pré-análise, deduplicação e varredura avançada de capas...');

  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // 1. DEDUPLICAÇÃO INTELIGENTE
  const seenSlugs = new Map();
  const seenHashes = new Map();
  const uniqueModels = [];
  const duplicatesRemoved = [];

  for (const m of catalog.models) {
    const modelDir = path.join(PROJECT_ROOT, 'models', m.id);
    const modelFile = path.join(modelDir, `${m.id}.${m.format}`);
    
    let fileHash = null;
    if (fs.existsSync(modelFile)) {
      fileHash = crypto.createHash('sha256').update(fs.readFileSync(modelFile)).digest('hex');
    }

    const normName = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    // Verifica se já vimos esse hash ou nome com mesmo tamanho
    let isDup = false;
    if (fileHash && seenHashes.has(fileHash)) {
      isDup = true;
      duplicatesRemoved.push({ id: m.id, name: m.name, reason: `Hash idêntico ao modelo ${seenHashes.get(fileHash)}` });
    } else if (seenSlugs.has(normName)) {
      const prev = seenSlugs.get(normName);
      if (Math.abs(prev.size - m.size) < 100) {
        isDup = true;
        duplicatesRemoved.push({ id: m.id, name: m.name, reason: `Nome e tamanho idênticos ao modelo ${prev.id}` });
      }
    }

    if (isDup) {
      // Remove registro duplicado do Supabase Database se existir
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/models?id=eq.${encodeURIComponent(m.id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
          }
        });
        console.log(`🗑️ Duplicata removida do Supabase: "${m.name}" (${m.id})`);
      } catch (e) {
        console.warn(`Aviso ao remover duplicata: ${e.message}`);
      }
    } else {
      if (fileHash) seenHashes.set(fileHash, m.id);
      seenSlugs.set(normName, { id: m.id, size: m.size });
      uniqueModels.push(m);
    }
  }

  console.log(`\n📊 Modelos antes: ${catalog.models.length} | Únicos: ${uniqueModels.length} | Duplicatas eliminadas: ${duplicatesRemoved.length}`);
  catalog.models = uniqueModels;

  // 2. VARREDURA AVANÇADA E REGENERAÇÃO DE CAPAS
  let coversUpdated = 0;

  for (const m of catalog.models) {
    const modelDir = path.join(PROJECT_ROOT, 'models', m.id);
    const modelFile = path.join(modelDir, `${m.id}.${m.format}`);
    if (!fs.existsSync(modelFile)) {
      console.warn(`Arquivo local não encontrado: ${m.id}`);
      continue;
    }

    const buf = fs.readFileSync(modelFile);
    const newThumb = await generateThumbnailForModel(buf, m.format, m.name);

    if (newThumb && newThumb.length > 0) {
      // Salva localmente
      fs.writeFileSync(path.join(modelDir, 'thumb.png'), newThumb);

      // Upload para Supabase Storage
      const storagePath = `${SUPABASE_USER_ID}/${m.id}/thumb.png`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/modelos/${encodeURIComponent(SUPABASE_USER_ID)}/${encodeURIComponent(m.id)}/thumb.png`;

      try {
        const upRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true'
          },
          body: newThumb
        });

        if (upRes.ok) {
          m.thumb = storagePath;
          coversUpdated++;
          console.log(`✅ [${m.name}] Capa gerada em alta definição (${newThumb.length} bytes)`);
        } else {
          console.warn(`⚠️ [${m.name}] Falha no envio da capa: ${upRes.status}`);
        }
      } catch (err) {
        console.warn(`Erro de rede para ${m.name}: ${err.message}`);
      }
    }
  }

  // 3. SALVAR CATALOG.JSON LIMPO E ATUALIZADO
  catalog.updated = new Date().toISOString();
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n🎉 Processamento concluído! ${coversUpdated} capas atualizadas, ${duplicatesRemoved.length} duplicatas eliminadas.`);
}

run();
