import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchMakerWorldImage } from './makerworldSearch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '3D-Project');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqhxwpgpzseprcmiuaww.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_USER_ID = process.env.SUPABASE_USER_ID || 'a25a3db7-e996-47c8-869f-3c167f26cf1e';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Iniciando busca de capas oficiais no MakerWorld com espaçamento seguro...');

  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  let updatedCount = 0;

  for (const m of catalog.models) {
    const modelDir = path.join(PROJECT_ROOT, 'models', m.id);
    const currentThumbPath = path.join(modelDir, 'thumb.png');
    const currentSize = fs.existsSync(currentThumbPath) ? fs.statSync(currentThumbPath).size : 0;

    // Modelos que estão com capa de render de malha simples (< 40 KB) recebem busca no MakerWorld
    if (currentSize > 40000) {
      console.log(`⏩ [${m.name}] Já possui foto de alta resolução (${currentSize} bytes). Pulando.`);
      continue;
    }

    console.log(`\n🔍 [${m.name}] (Capa atual: ${currentSize} bytes). Buscando no MakerWorld...`);
    const newThumb = await searchMakerWorldImage(m.name);

    if (newThumb && newThumb.length > 5000) {
      fs.mkdirSync(modelDir, { recursive: true });
      fs.writeFileSync(currentThumbPath, newThumb);

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
          updatedCount++;
          console.log(`✅ [${m.name}] Foto oficial do MakerWorld enviada para Supabase: ${newThumb.length} bytes!`);
        } else {
          console.warn(`⚠️ [${m.name}] Falha no upload Supabase: ${upRes.status}`);
        }
      } catch (err) {
        console.warn(`[${m.name}] Erro de rede: ${err.message}`);
      }
    } else {
      console.log(`ℹ️ [${m.name}] Mantida a renderização 3D isométrica existente.`);
    }

    // Intervalo de segurança para não tomar rate limit
    await sleep(2500);
  }

  catalog.updated = new Date().toISOString();
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n🎉 Concluído! ${updatedCount} capas oficiais do MakerWorld atualizadas no acervo.`);
}

run();
