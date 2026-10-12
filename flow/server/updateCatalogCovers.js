import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { humanizeModelName } from './nameHumanizer.js';
import { generateThumbnailForModel } from './thumbnailGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '3D-Project');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqhxwpgpzseprcmiuaww.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_USER_ID = process.env.SUPABASE_USER_ID || 'a25a3db7-e996-47c8-869f-3c167f26cf1e';

async function updateAllModels() {
  console.log('🚀 Iniciando atualização de capas e nomes amigáveis...');

  // 1. Busca todos os modelos do Supabase
  const res = await fetch(`${SUPABASE_URL}/rest/v1/models?select=*`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    }
  });

  const models = await res.json();
  console.log(`Encontrados ${models.length} modelos no Supabase.`);

  const seenNames = new Map();
  const duplicatesToDelete = [];
  const toUpdate = [];

  // Deduplicação inteligente por nome humanizado
  for (const m of models) {
    const friendly = humanizeModelName(m.name);
    if (seenNames.has(friendly)) {
      // Duplicata encontrada: marca o mais antigo/repetido para remoção
      duplicatesToDelete.push(m.id);
    } else {
      seenNames.set(friendly, m.id);
      toUpdate.push({ ...m, friendlyName: friendly });
    }
  }

  console.log(`Modelos únicos a manter: ${toUpdate.length} (Duplicatas para remover: ${duplicatesToDelete.length})`);

  // Remove duplicatas do banco
  for (const dupId of duplicatesToDelete) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/models?id=eq.${dupId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        }
      });
    } catch {}
  }

  // 2. Para cada modelo único, gera capa e atualiza título
  let updatedCount = 0;
  const updatedCatalogModels = [];

  for (let i = 0; i < toUpdate.length; i++) {
    const m = toUpdate[i];
    console.log(`\n[${i + 1}/${toUpdate.length}] Processando: "${m.name}" => "${m.friendlyName}"`);

    // Procura arquivo no repositório local
    let fileBuffer = null;
    let localModelDir = path.join(PROJECT_ROOT, 'models', m.id);
    let localFilePath = path.join(localModelDir, `${m.id}.${m.format}`);

    if (fs.existsSync(localFilePath)) {
      fileBuffer = fs.readFileSync(localFilePath);
    } else {
      // Se não estiver local, baixa do Supabase Storage
      try {
        const dlUrl = `${SUPABASE_URL}/storage/v1/object/public/modelos/${m.file_path}`;
        const dlRes = await fetch(dlUrl);
        if (dlRes.ok) {
          fileBuffer = Buffer.from(await dlRes.arrayBuffer());
          fs.mkdirSync(localModelDir, { recursive: true });
          fs.writeFileSync(localFilePath, fileBuffer);
        }
      } catch {}
    }

    if (!fileBuffer) {
      console.warn(`⚠️ Arquivo 3D não encontrado para ${m.id}`);
      continue;
    }

    // Gera miniatura / capa (extrai do 3MF ou renderiza 3D isométrico)
    const thumbBuffer = await generateThumbnailForModel(fileBuffer, m.format, m.friendlyName);
    let thumbPath = '';

    if (thumbBuffer && thumbBuffer.length > 0) {
      // Salva localmente
      fs.mkdirSync(localModelDir, { recursive: true });
      fs.writeFileSync(path.join(localModelDir, 'thumb.png'), thumbBuffer);
      thumbPath = `${SUPABASE_USER_ID}/${m.id}/thumb.png`;

      // Upload para o Supabase Storage
      try {
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/modelos/${encodeURIComponent(SUPABASE_USER_ID)}/${encodeURIComponent(m.id)}/thumb.png`;
        const upRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true'
          },
          body: thumbBuffer
        });
        if (upRes.ok) {
          console.log(`  📸 Capa salva no Supabase Storage: ${thumbPath}`);
        } else {
          console.warn(`  Aviso upload capa: ${upRes.status} ${await upRes.text()}`);
        }
      } catch (err) {
        console.warn(`  Erro upload capa: ${err.message}`);
      }
    }

    // Atualiza linha na tabela public.models
    try {
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/models?id=eq.${m.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: m.friendlyName,
          thumb_path: thumbPath,
          updated_at: new Date().toISOString()
        })
      });

      if (updateRes.ok) {
        console.log(`  ✅ Nome atualizado para: "${m.friendlyName}"`);
        updatedCount++;
      } else {
        console.warn(`  Erro PATCH banco: ${updateRes.status}`);
      }
    } catch (err) {
      console.warn(`  Erro atualização banco: ${err.message}`);
    }

    // Monta entrada para o catálogo local
    updatedCatalogModels.push({
      id: m.id,
      storage: 'storage',
      name: m.friendlyName,
      description: m.description,
      format: m.format,
      file: m.file_path,
      thumb: thumbPath || '',
      size: m.size,
      tags: m.tags,
      author: m.author,
      triangles: m.triangles,
      dimensions: { x: m.dim_x, y: m.dim_y, z: m.dim_z },
      print: m.print_settings || {},
      createdAt: m.created_at,
      weightGrams: m.weight_grams,
      weightSource: m.weight_source,
      filaments: m.filaments
    });
  }

  // 3. Atualiza data/catalog.json local com títulos e capas organizadas
  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify({
    version: 1,
    updated: new Date().toISOString(),
    models: updatedCatalogModels
  }, null, 2));

  console.log(`\n🎉 Processo concluído! ${updatedCount} modelos atualizados com nomes amigáveis e capas!`);
}

updateAllModels();
