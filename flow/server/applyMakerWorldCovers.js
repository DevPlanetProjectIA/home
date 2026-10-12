import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateThumbnailForModel } from './thumbnailGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '3D-Project');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqhxwpgpzseprcmiuaww.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_USER_ID = process.env.SUPABASE_USER_ID || 'a25a3db7-e996-47c8-869f-3c167f26cf1e';

async function run() {
  console.log('🚀 Atualizando capas reais do MakerWorld para os modelos do catálogo...');

  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  let updatedCount = 0;

  for (const m of catalog.models) {
    const modelDir = path.join(PROJECT_ROOT, 'models', m.id);
    const modelFile = path.join(modelDir, `${m.id}.${m.format}`);
    if (!fs.existsSync(modelFile)) {
      console.log(`Pular ${m.name} (arquivo local não encontrado)`);
      continue;
    }

    const buf = fs.readFileSync(modelFile);
    // Gera nova miniatura usando o novo thumbnailGenerator que prioriza fotos do MakerWorld
    const newThumb = await generateThumbnailForModel(buf, m.format, m.name);
    if (!newThumb || newThumb.length === 0) continue;

    // Salva localmente em models/<id>/thumb.png
    fs.writeFileSync(path.join(modelDir, 'thumb.png'), newThumb);

    // Upload para o Supabase Storage
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
        console.log(`✅ [${m.name}] Foto real enviada para Supabase: ${storagePath} (${newThumb.length} bytes)`);
        m.thumb = storagePath;
        updatedCount++;
      } else {
        console.warn(`⚠️ [${m.name}] Erro no Supabase: ${upRes.status} ${await upRes.text()}`);
      }
    } catch (err) {
      console.error(`❌ [${m.name}] Falha na rede:`, err.message);
    }
  }

  // Salva catalog.json atualizado
  catalog.updated = new Date().toISOString();
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n🎉 Concluído! ${updatedCount} modelos atualizados com capas reais.`);
}

run();
