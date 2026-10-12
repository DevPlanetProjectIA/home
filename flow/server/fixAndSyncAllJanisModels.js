import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { humanizeModelName } from './nameHumanizer.js';
import { generateThumbnailForModel } from './thumbnailGenerator.js';
import { extractModelMetrics } from './stlModelParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '3D-Project');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqhxwpgpzseprcmiuaww.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_USER_ID = process.env.SUPABASE_USER_ID || 'a25a3db7-e996-47c8-869f-3c167f26cf1e';
const SUPABASE_AUTHOR = process.env.SUPABASE_AUTHOR || 'Bruno T.';

async function fixAllModels() {
  console.log('🚀 Iniciando correção de todos os modelos (upload Storage + capas + catalog.json)...');

  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const fixedModels = [];
  let successCount = 0;

  for (let i = 0; i < catalog.models.length; i++) {
    const m = catalog.models[i];
    const friendly = humanizeModelName(m.name);
    console.log(`\n[${i + 1}/${catalog.models.length}] Processando: "${m.name}" => "${friendly}" (${m.id})`);

    // Procura arquivo no disco local
    let fileBuffer = null;
    const localDir = path.join(PROJECT_ROOT, 'models', m.id);
    const localFilePath = path.join(localDir, `${m.id}.${m.format}`);

    if (fs.existsSync(localFilePath)) {
      fileBuffer = fs.readFileSync(localFilePath);
    } else {
      // Tenta baixar do storage se já existir
      try {
        const dlRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/modelos/${m.file}`);
        if (dlRes.ok) {
          fileBuffer = Buffer.from(await dlRes.arrayBuffer());
        }
      } catch {}
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      console.warn(`⚠️ Arquivo 3D não encontrado para ${m.id}`);
      continue;
    }

    const storageFilePath = `${SUPABASE_USER_ID}/${m.id}/${m.id}.${m.format}`;
    const storageThumbPath = `${SUPABASE_USER_ID}/${m.id}/thumb.png`;

    // 1. Garante upload do arquivo 3D para o Supabase Storage
    try {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/modelos/${encodeURIComponent(SUPABASE_USER_ID)}/${encodeURIComponent(m.id)}/${encodeURIComponent(m.id)}.${m.format}`;
      const upRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Content-Type': m.format === '3mf' ? 'model/3mf' : 'model/stl',
          'x-upsert': 'true'
        },
        body: fileBuffer
      });
      if (upRes.ok) {
        console.log(`  📦 Arquivo 3D gravado no Storage: ${storageFilePath}`);
      } else {
        const errTxt = await upRes.text();
        console.error(`  ❌ Falha upload Storage (${upRes.status}): ${errTxt}`);
        continue; // Não cadastra se não subiu no storage!
      }
    } catch (err) {
      console.error(`  ❌ Exceção upload Storage: ${err.message}`);
      continue;
    }

    // 2. Extrai e salva capa
    let thumbBuffer = null;
    const localThumb = path.join(localDir, 'thumb.png');
    if (fs.existsSync(localThumb)) {
      thumbBuffer = fs.readFileSync(localThumb);
    }
    if (!thumbBuffer || thumbBuffer.length === 0) {
      thumbBuffer = await generateThumbnailForModel(fileBuffer, m.format, friendly);
      if (thumbBuffer) {
        fs.mkdirSync(localDir, { recursive: true });
        fs.writeFileSync(localThumb, thumbBuffer);
      }
    }

    if (thumbBuffer && thumbBuffer.length > 0) {
      try {
        const thumbUploadUrl = `${SUPABASE_URL}/storage/v1/object/modelos/${encodeURIComponent(SUPABASE_USER_ID)}/${encodeURIComponent(m.id)}/thumb.png`;
        const tRes = await fetch(thumbUploadUrl, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true'
          },
          body: thumbBuffer
        });
        if (tRes.ok) {
          console.log(`  📸 Capa salva no Storage: ${storageThumbPath}`);
        }
      } catch (err) {
        console.warn(`  Aviso upload capa: ${err.message}`);
      }
    }

    // 3. Atualiza ou insere na tabela public.models
    const metrics = extractModelMetrics(fileBuffer, m.format);
    const dbRecord = {
      id: m.id,
      user_id: SUPABASE_USER_ID,
      author: m.author || SUPABASE_AUTHOR,
      name: friendly,
      description: m.description || 'Baixado automaticamente do WhatsApp (Catálogo WhatsApp)',
      format: m.format,
      tags: m.tags || ['whatsapp'],
      file_path: storageFilePath,
      thumb_path: storageThumbPath,
      size: fileBuffer.length,
      triangles: metrics.triangles || m.triangles || 0,
      dim_x: metrics.dim_x || m.dimensions?.x || 0,
      dim_y: metrics.dim_y || m.dimensions?.y || 0,
      dim_z: metrics.dim_z || m.dimensions?.z || 0,
      printer_id: '',
      weight_grams: metrics.weightGrams || m.weightGrams || 0,
      purge_grams: 0,
      print_seconds: 0,
      cost_brl: 0,
      price_brl: 0,
      weight_source: 'estimativa',
      filaments: m.filaments || [{ material: 'PLA', color: '#3b82f6', grams: metrics.weightGrams || 0 }],
      print_settings: m.print || { material: 'PLA', infill: '15%', layerHeight: '0.2' },
      created_at: m.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/models`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify([dbRecord])
      });
      if (dbRes.ok) {
        console.log(`  ✅ Banco atualizado para: "${friendly}"`);
      } else {
        console.warn(`  Aviso banco: ${dbRes.status} ${await dbRes.text()}`);
      }
    } catch (err) {
      console.warn(`  Aviso exceção banco: ${err.message}`);
    }

    // 4. Monta entrada corrigida para o catalog.json
    fixedModels.push({
      id: m.id,
      storage: 'storage',
      name: friendly,
      description: dbRecord.description,
      format: m.format,
      file: storageFilePath,
      thumb: storageThumbPath,
      size: fileBuffer.length,
      tags: dbRecord.tags,
      author: dbRecord.author,
      triangles: dbRecord.triangles,
      dimensions: { x: dbRecord.dim_x, y: dbRecord.dim_y, z: dbRecord.dim_z },
      print: dbRecord.print_settings,
      createdAt: dbRecord.created_at,
      weightGrams: dbRecord.weight_grams,
      weightSource: 'estimativa',
      filaments: dbRecord.filaments
    });

    successCount++;
  }

  // 5. Salva data/catalog.json
  catalog.models = fixedModels;
  catalog.updated = new Date().toISOString();
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

  console.log(`\n🎉 Finalizado com sucesso! ${successCount} modelos corrigidos e sincronizados com Supabase Storage e catálogo.`);
}

fixAllModels();
