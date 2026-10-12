// Serviço de download, limpeza e sincronização de arquivos STL e 3MF do WhatsApp
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  cleanAndExtractAttachments,
  extractModelMetrics,
  generateModelId,
  slugify,
  validate3DModel
} from './stlModelParser.js';
import { humanizeModelName } from './nameHumanizer.js';
import { generateThumbnailForModel } from './thumbnailGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DOWNLOADS_DIR = path.join(DATA_DIR, 'downloads', 'stl_models');
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

// Arquivo de rastreio para evitar downloads duplicados
const TRACKING_FILE = path.join(DATA_DIR, 'stl_download_history.json');
let historyCache = {};
if (fs.existsSync(TRACKING_FILE)) {
  try {
    historyCache = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
  } catch {
    historyCache = {};
  }
}

function saveTracking() {
  try {
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(historyCache, null, 2));
  } catch (err) {
    console.error('[STL Sync] Erro ao salvar histórico:', err.message);
  }
}

// Configurações do 3D-Project e Supabase
const PROJECT_ROOT = process.env.PROJECT_3D_DIR || 
  (fs.existsSync(path.resolve(__dirname, '..', '..', '..', '3D-Project'))
    ? path.resolve(__dirname, '..', '..', '..', '3D-Project')
    : path.resolve(__dirname, '..', '..', '3D-Project'));
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqhxwpgpzseprcmiuaww.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_P_uamf5YKN2AFGyTJP3QTA_VrijCGgw';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_USER_ID = process.env.SUPABASE_USER_ID || 'a25a3db7-e996-47c8-869f-3c167f26cf1e';
const SUPABASE_AUTHOR = process.env.SUPABASE_AUTHOR || 'Bruno T.';

// Grupos monitorados (Identificados por ID e por nome)
export const TARGET_GROUPS = [
  { id: '120363429333134994@g.us', name: 'STL dos Calangos' },
  { id: '120363429327299826@g.us', name: 'STL 🟠🦎' },
  { id: '120363411680506909@g.us', name: 'GRUPO ABERTO 🔵🦎' },
  { id: '120363410867510570@g.us', name: 'Calangaiada 3D' },
  { id: '120363430405104042@g.us', name: 'Calangaiada 3D 2' },
  { id: '120363412848571168@g.us', name: 'CALANGAIADA 2' },
  { id: '120363413055838658@g.us', name: 'CALANGAIADA 2' },
  { id: '120363411445288635@g.us', name: 'Calangaiada 3D (comunidade)' },
  { id: '120363429104723971@g.us', name: 'Calangaiada 3D (comunidade)' }
];

/**
 * Verifica se um chat é um dos grupos monitorados
 */
export function isTargetGroup(jid, groupName = '') {
  if (!jid) return false;
  if (TARGET_GROUPS.some(g => g.id === jid)) return true;
  const name = String(groupName || '').toLowerCase();
  return (
    name.includes('stl') ||
    name.includes('calang') ||
    name.includes('🦎') ||
    name.includes('3d') ||
    name.includes('impress') ||
    name.includes('print')
  );
}

/**
 * Retorna o nome amigável do grupo
 */
export function getGroupName(jid, fallback = '') {
  const hit = TARGET_GROUPS.find(g => g.id === jid);
  if (hit) return hit.name;
  return fallback || jid.split('@')[0];
}

/**
 * Sincroniza um modelo com o Supabase (Storage + Tabela models)
 */
async function syncToSupabase({ modelId, cleanName, format, fileBuffer, metrics, groupName, authorName, thumbBuffer = null }) {
  const apiKey = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
  const isLargeFile = fileBuffer.length > 48 * 1024 * 1024;
  const folder = `${SUPABASE_USER_ID}/${modelId}`;
  const filePath = isLargeFile ? `models/${modelId}/${modelId}.${format}` : `${folder}/${modelId}.${format}`;
  let thumbPath = '';

  // 0. Validação rigorosa do modelo (tamanho < 100MB, malha 3D íntegra, triângulos > 0)
  const validation = validate3DModel(fileBuffer, format, cleanName);
  if (!validation.valid) {
    console.warn(`[STL Sync Rejeitado] Modelo "${cleanName}" inválido: ${validation.reason}`);
    return { success: false, storageOk: false, dbOk: false, reason: validation.reason };
  }
  if (!metrics || !metrics.triangles) {
    metrics = validation.metrics;
  }

  let storageOk = false;
  let dbOk = false;
  let reason = '';

  // 1. Upload para o bucket 'modelos' do Supabase Storage (se <= 48 MB)
  if (!isLargeFile) {
    try {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/modelos/${encodeURIComponent(SUPABASE_USER_ID)}/${encodeURIComponent(modelId)}/${encodeURIComponent(modelId)}.${format}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'apikey': apiKey,
          'Content-Type': format === '3mf' ? 'model/3mf' : 'model/stl',
          'x-upsert': 'true'
        },
        body: fileBuffer,
        signal: AbortSignal.timeout(60000)
      });

      if (uploadRes.ok) {
        storageOk = true;
      } else {
        const errTxt = await uploadRes.text();
        reason = `Falha no Storage (${uploadRes.status}): ${errTxt}`;
        console.error(`[STL Sync Error] Storage recusou ${modelId} (${uploadRes.status}): ${errTxt}`);
        return { success: false, storageOk: false, dbOk: false, reason };
      }
    } catch (err) {
      reason = `Falha de rede no Storage: ${err.message}`;
      console.error(`[STL Sync Error] Exceção Storage para ${modelId}:`, err.message);
      return { success: false, storageOk: false, dbOk: false, reason };
    }
  } else {
    console.log(`[STL Sync Híbrido] Modelo "${cleanName}" tem ${(fileBuffer.length / (1024*1024)).toFixed(1)} MB (> 48 MB). Roteando binário para Git Storage.`);
    storageOk = true; // Gerenciado via Git Storage
  }

  // 2. Upload da capa / miniatura (extraída do 3MF montado ou renderizada 3D)
  try {
    if (!thumbBuffer) {
      thumbBuffer = await generateThumbnailForModel(fileBuffer, format, cleanName);
    }
    if (thumbBuffer && thumbBuffer.length > 0) {
      const thumbUploadUrl = `${SUPABASE_URL}/storage/v1/object/modelos/${encodeURIComponent(SUPABASE_USER_ID)}/${encodeURIComponent(modelId)}/thumb.png`;
      const thumbRes = await fetch(thumbUploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'apikey': apiKey,
          'Content-Type': 'image/png',
          'x-upsert': 'true'
        },
        body: thumbBuffer,
        signal: AbortSignal.timeout(15000)
      });
      if (thumbRes.ok) {
        thumbPath = `${SUPABASE_USER_ID}/${modelId}/thumb.png`;
      }
    }
  } catch (err) {
    console.warn(`[STL Sync] Aviso capa para ${modelId}:`, err.message);
  }

  // 3. Registro no banco de dados (tabela public.models)
  try {
    const dbUrl = `${SUPABASE_URL}/rest/v1/models`;
    const record = {
      id: modelId,
      user_id: SUPABASE_USER_ID,
      author: authorName || SUPABASE_AUTHOR,
      name: cleanName,
      description: `Baixado automaticamente do WhatsApp (${groupName})`,
      format: format,
      tags: ['whatsapp', slugify(groupName)],
      file_path: filePath,
      thumb_path: thumbPath,
      size: fileBuffer.length,
      triangles: metrics.triangles || 0,
      dim_x: metrics.dim_x || 0,
      dim_y: metrics.dim_y || 0,
      dim_z: metrics.dim_z || 0,
      printer_id: '',
      weight_grams: metrics.weightGrams || 0,
      purge_grams: 0,
      print_seconds: 0,
      cost_brl: 0,
      price_brl: 0,
      weight_source: 'estimativa',
      filaments: [{ material: 'PLA', color: '#3b82f6', grams: metrics.weightGrams || 0 }],
      print_settings: { material: 'PLA', infill: '15%', layerHeight: '0.2' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const dbRes = await fetch(dbUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([record]),
      signal: AbortSignal.timeout(10000)
    });

    if (dbRes.ok) {
      dbOk = true;
    } else {
      const errTxt = await dbRes.text();
      reason += (reason ? ' | ' : '') + `Database: ${dbRes.status} - ${errTxt}`;
    }
  } catch (err) {
    reason += (reason ? ' | ' : '') + `Database falha: ${err.message}`;
  }

  return { success: storageOk && dbOk, storageOk, dbOk, thumbOk: !!thumbPath, reason };
}

/**
 * Re-sincroniza todos os modelos locais com o Supabase
 */
export async function syncPendingModelsToSupabase() {
  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  if (!fs.existsSync(catalogPath)) return { success: false, error: 'Catálogo não encontrado' };

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const results = [];

  for (const m of catalog.models) {
    const modelFilePath = path.join(PROJECT_ROOT, m.file);
    if (!fs.existsSync(modelFilePath)) continue;

    const fileBuffer = fs.readFileSync(modelFilePath);
    let thumbBuffer = null;
    const thumbFilePath = path.join(PROJECT_ROOT, 'models', m.id, 'thumb.png');
    if (fs.existsSync(thumbFilePath)) {
      thumbBuffer = fs.readFileSync(thumbFilePath);
    }

    const res = await syncToSupabase({
      modelId: m.id,
      cleanName: m.name,
      format: m.format,
      fileBuffer,
      thumbBuffer,
      metrics: {
        triangles: m.triangles,
        dim_x: m.dimensions?.x,
        dim_y: m.dimensions?.y,
        dim_z: m.dimensions?.z,
        weightGrams: m.weightGrams
      },
      groupName: 'Catálogo WhatsApp',
      authorName: m.author || SUPABASE_AUTHOR
    });

    results.push({ id: m.id, name: m.name, success: res.success, reason: res.reason });
  }

  return { success: true, count: results.length, results };
}

/**
 * Atualiza o catálogo local e salva arquivos no repositório git do 3D-Project
 */
function syncToLocalGitProject({ modelId, cleanName, format, fileBuffer, metrics, groupName, authorName, thumbBuffer = null }) {
  try {
    if (!fs.existsSync(PROJECT_ROOT)) return false;

    // Salva arquivo em models/<id>/<id>.<format>
    const modelDir = path.join(PROJECT_ROOT, 'models', modelId);
    fs.mkdirSync(modelDir, { recursive: true });
    const localFilePath = path.join(modelDir, `${modelId}.${format}`);
    fs.writeFileSync(localFilePath, fileBuffer);

    let thumbRelPath = '';
    if (thumbBuffer && thumbBuffer.length > 0) {
      const localThumbPath = path.join(modelDir, 'thumb.png');
      fs.writeFileSync(localThumbPath, thumbBuffer);
      thumbRelPath = `models/${modelId}/thumb.png`;
    }

    // Atualiza data/catalog.json
    const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
    let catalog = { version: 1, updated: null, models: [] };
    if (fs.existsSync(catalogPath)) {
      try {
        catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      } catch {
        catalog = { version: 1, updated: null, models: [] };
      }
    }

    const isLarge = fileBuffer.length > 48 * 1024 * 1024;
    const storageFilePath = `${SUPABASE_USER_ID}/${modelId}/${modelId}.${format}`;
    const storageThumbPath = thumbBuffer && thumbBuffer.length > 0 ? `${SUPABASE_USER_ID}/${modelId}/thumb.png` : '';

    const newEntry = {
      id: modelId,
      storage: isLarge ? 'git' : 'storage',
      name: cleanName,
      description: `Baixado automaticamente do WhatsApp (${groupName})`,
      format: format,
      file: isLarge ? `models/${modelId}/${modelId}.${format}` : storageFilePath,
      thumb: storageThumbPath || (thumbRelPath ? thumbRelPath : ''),
      size: fileBuffer.length,
      tags: ['whatsapp', slugify(groupName)],
      author: authorName || SUPABASE_AUTHOR,
      triangles: metrics.triangles || 0,
      dimensions: { x: metrics.dim_x || 0, y: metrics.dim_y || 0, z: metrics.dim_z || 0 },
      print: { material: 'PLA', layerHeight: '0.2', infill: '15%', supports: false, notes: '' },
      createdAt: new Date().toISOString(),
      printerId: '',
      weightGrams: metrics.weightGrams || 0,
      purgeGrams: 0,
      printSeconds: 0,
      costBRL: 0,
      priceBRL: 0,
      weightSource: 'estimativa',
      filaments: [{ material: 'PLA', color: '#3b82f6', grams: metrics.weightGrams || 0 }]
    };

    catalog.models = [newEntry, ...catalog.models.filter(m => m.id !== modelId)];
    catalog.updated = new Date().toISOString();
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

    pushCatalogToGitHub(modelId);

    return true;
  } catch (err) {
    console.warn('[Local Git Sync Warning]:', err.message);
    return false;
  }
}

let pushTimeout = null;
export function pushCatalogToGitHub() {
  if (pushTimeout) clearTimeout(pushTimeout);
  pushTimeout = setTimeout(() => {
    const cmd = 'git add data/catalog.json data/community_users.json && git commit -m "feat(catalog): auto-sync novo modelo do WhatsApp" && git push origin main';
    exec(cmd, { cwd: PROJECT_ROOT }, (err) => {
      if (err) console.warn('[Git Auto-Push Warning]:', err.message);
      else console.log('🚀 [Git Auto-Push] Catálogo sincronizado com o GitHub Pages com sucesso!');
    });
  }, 4000);
}

/**
 * Pré-análise de duplicatas antes de qualquer download, upload ou cadastro
 */
export function checkDuplicateModel(fileBuffer, format, cleanName) {
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const friendlyName = humanizeModelName(cleanName);
  const normSlug = slugify(friendlyName).replace(/[^a-z0-9]/g, '');

  const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      for (const existing of catalog.models) {
        // 1. Checagem por nome normalizado e tamanho de arquivo correspondente
        const existingSlug = slugify(existing.name).replace(/[^a-z0-9]/g, '');
        const sizeDiff = Math.abs((existing.size || 0) - fileBuffer.length);
        const isSameSize = sizeDiff === 0 || (existing.size && sizeDiff / existing.size < 0.01);

        if (existingSlug === normSlug && isSameSize) {
          return {
            isDuplicate: true,
            reason: `Modelo "${existing.name}" já existe no catálogo (ID: ${existing.id})`,
            existingId: existing.id
          };
        }

        // 2. Checagem por hash SHA-256 do arquivo original
        const localFilePath = path.join(PROJECT_ROOT, 'models', existing.id, `${existing.id}.${existing.format}`);
        if (fs.existsSync(localFilePath)) {
          const existingBuf = fs.readFileSync(localFilePath);
          const existingHash = crypto.createHash('sha256').update(existingBuf).digest('hex');
          if (existingHash === fileHash) {
            return {
              isDuplicate: true,
              reason: `Arquivo 100% idêntico (SHA-256) a "${existing.name}" (ID: ${existing.id})`,
              existingId: existing.id
            };
          }
        }
      }
    } catch {}
  }

  return { isDuplicate: false };
}

/**
 * Processa uma mensagem individual e faz o download se for modelo 3D
 */
export async function processMessageForSTL(sock, msg, groupSubject = '') {
  if (!msg || !msg.key) return null;

  const jid = msg.key.remoteJid;
  if (!isTargetGroup(jid, groupSubject)) return null;

  const msgId = msg.key.id;
  if (historyCache[msgId]?.processed) {
    return null; // Já baixado
  }

  // Procura por documento ou anexo
  const doc = msg.message?.documentMessage || msg.message?.documentWithCaptionMessage?.message?.documentMessage;
  if (!doc) return null;

  const rawFileName = doc.fileName || '';
  const mimetype = (doc.mimetype || '').toLowerCase();

  // Filtra por arquivos relevantes
  const isRelevant = 
    /\.(stl|3mf|zip|rar)$/i.test(rawFileName) || 
    mimetype.includes('zip') || 
    mimetype.includes('rar') || 
    mimetype.includes('octet-stream') || 
    mimetype.includes('stl') || 
    mimetype.includes('3mf');

  if (!isRelevant) return null;

  console.log(`[STL Sync] 🎯 Novo anexo detectado em ${getGroupName(jid, groupSubject)}: "${rawFileName}" (${doc.fileLength || 0} bytes)`);

  let fileBuffer = null;
  try {
    fileBuffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: { info: () => {}, error: console.error, warn: console.warn, debug: () => {} },
        reuploadRequest: sock?.updateMediaMessage ? sock.updateMediaMessage.bind(sock) : undefined
      }
    );
  } catch (err) {
    console.error(`[STL Sync Error] Falha ao baixar anexo "${rawFileName}":`, err.message);
    historyCache[msgId] = {
      processed: true,
      success: false,
      error: `Download: ${err.message}`,
      fileName: rawFileName,
      timestamp: Date.now()
    };
    saveTracking();
    return null;
  }

  if (!fileBuffer || fileBuffer.length === 0) return null;

  // Limpa o nome, descompacta .rar/.zip ou resolve extensões duplas
  const extractedModels = await cleanAndExtractAttachments(rawFileName, fileBuffer);
  if (!extractedModels || extractedModels.length === 0) {
    console.log(`[STL Sync] Anexo "${rawFileName}" não continha modelos STL ou 3MF válidos.`);
    historyCache[msgId] = {
      processed: true,
      success: false,
      error: 'Sem modelo STL/3MF válido',
      fileName: rawFileName,
      timestamp: Date.now()
    };
    saveTracking();
    return null;
  }

  const results = [];
  const groupName = getGroupName(jid, groupSubject);
  const senderName = msg.pushName || 'Membro do Grupo';

  for (const item of extractedModels) {
    // 0. PRÉ-ANÁLISE DE DUPLICATAS: Checa hash e metadados antes de qualquer upload ou cadastro
    const dupCheck = checkDuplicateModel(item.buffer, item.format, item.cleanName);
    if (dupCheck.isDuplicate) {
      console.log(`[STL Sync Pré-Análise] 🛑 Duplicata detectada: ${dupCheck.reason}. Ignorando envio repetido.`);
      continue;
    }

    // Validação preliminar rigorosa: tamanho máximo (45MB) e malha 3D íntegra
    const val = validate3DModel(item.buffer, item.format, item.cleanName);
    if (!val.valid) {
      console.warn(`⚠️ [STL Sync Rejeitado] Modelo "${item.cleanName}" descartado: ${val.reason}`);
      continue;
    }

    const friendlyName = humanizeModelName(item.cleanName);
    const modelId = generateModelId(friendlyName);
    const metrics = val.metrics || extractModelMetrics(item.buffer, item.format);
    const thumbBuffer = await generateThumbnailForModel(item.buffer, item.format, friendlyName);

    // 1. Salva no disco local do Flow (backup)
    const targetFolder = path.join(DOWNLOADS_DIR, slugify(groupName), modelId);
    fs.mkdirSync(targetFolder, { recursive: true });
    const localSavedPath = path.join(targetFolder, `${modelId}.${item.format}`);
    fs.writeFileSync(localSavedPath, item.buffer);
    if (thumbBuffer && thumbBuffer.length > 0) {
      fs.writeFileSync(path.join(targetFolder, 'thumb.png'), thumbBuffer);
    }

    // 2. Sincroniza com Supabase (arquivo + capa + metadados amigáveis)
    const supabaseRes = await syncToSupabase({
      modelId,
      cleanName: friendlyName,
      format: item.format,
      fileBuffer: item.buffer,
      metrics,
      groupName,
      authorName: senderName,
      thumbBuffer
    });

    if (!supabaseRes.success) {
      console.warn(`⚠️ [STL Sync Falhou] Upload para o Supabase rejeitado para "${friendlyName}": ${supabaseRes.reason}`);
      continue;
    }

    // 3. Sincroniza com o Git / Catálogo local APENAS se o Supabase aceitou
    const gitRes = syncToLocalGitProject({
      modelId,
      cleanName: friendlyName,
      format: item.format,
      fileBuffer: item.buffer,
      metrics,
      groupName,
      authorName: senderName,
      thumbBuffer
    });

    console.log(`✅ [STL Sync] Modelo salvo com sucesso: "${friendlyName}.${item.format}" | Triângulos: ${metrics.triangles} | Tam: ${metrics.dim_x}×${metrics.dim_y}×${metrics.dim_z}mm | Supabase: SIM | Capa: ${supabaseRes.thumbOk ? 'SIM' : 'NÃO'}`);

    results.push({
      modelId,
      cleanName: friendlyName,
      format: item.format,
      fileName: `${modelId}.${item.format}`,
      metrics,
      groupName,
      supabase: supabaseRes,
      gitSynced: gitRes,
      localPath: localSavedPath
    });
  }

  historyCache[msgId] = {
    processed: true,
    success: true,
    fileName: rawFileName,
    models: results.map(r => ({ modelId: r.modelId, name: r.cleanName, format: r.format })),
    timestamp: Date.now()
  };
  saveTracking();

  return results;
}

/**
 * Dispara requisições PDO (Peer Data Operation) para puxar histórico antigo dos grupos
 */
export async function syncHistoricalMessages(sock) {
  if (!sock) return { success: false, error: 'Socket WhatsApp desconectado' };

  console.log('[STL Sync] Solicitando sincronização de mensagens antigas dos grupos alvo...');
  const requests = [];

  for (const group of TARGET_GROUPS) {
    try {
      if (!sock) break;
      const dummyKey = { remoteJid: group.id, id: `HIST_REQ_${Date.now()}`, fromMe: false };
      // Pede 100 mensagens anteriores de cada grupo
      const res = await sock.fetchMessageHistory(100, dummyKey, Date.now()).catch(e => {
        console.warn(`[STL Sync Aviso] Falha ao pedir histórico para ${group.name}:`, e?.message || e);
        return null;
      });
      if (res) {
        requests.push({ group: group.name, jid: group.id, requestId: res, success: true });
        console.log(`[STL Sync] Solicitação de histórico enviada para ${group.name} (ID: ${res})`);
      }
    } catch (err) {
      requests.push({ group: group.name, jid: group.id, success: false, error: err.message });
      console.warn(`[STL Sync Aviso] Falha ao pedir histórico para ${group.name}:`, err.message);
    }
  }

  return { success: true, requests };
}

/**
 * Escaneia uma pasta local (ex: Downloads do usuário) e importa todos os modelos
 */
export async function importFromLocalDirectory(dirPath = '') {
  const targetDir = dirPath || path.join(process.env.USERPROFILE || 'C:\\Users\\bruno', 'Downloads');
  if (!fs.existsSync(targetDir)) {
    return { success: false, error: `Diretório não encontrado: ${targetDir}`, imported: [] };
  }

  const files = fs.readdirSync(targetDir);
  const modelFiles = files.filter(f => /\.(stl|3mf|zip|rar)$/i.test(f));
  const imported = [];

  console.log(`[STL Local Import] Encontrados ${modelFiles.length} arquivos candidatos em ${targetDir}`);

  for (const fileName of modelFiles) {
    const fullPath = path.join(targetDir, fileName);
    try {
      const stat = fs.statSync(fullPath);
      if (!stat.isFile() || stat.size === 0 || stat.size > 80 * 1024 * 1024) continue;

      const fileBuffer = fs.readFileSync(fullPath);
      const extracted = await cleanAndExtractAttachments(fileName, fileBuffer);

      for (const item of extracted) {
        // Validação rigorosa preliminar
        const val = validate3DModel(item.buffer, item.format, item.cleanName);
        if (!val.valid) {
          console.warn(`⚠️ [STL Import Rejeitado] Modelo "${item.cleanName}" descartado: ${val.reason}`);
          continue;
        }

        const friendlyName = humanizeModelName(item.cleanName);
        const modelId = generateModelId(friendlyName);
        const metrics = val.metrics || extractModelMetrics(item.buffer, item.format);
        const thumbBuffer = await generateThumbnailForModel(item.buffer, item.format, friendlyName);

        // Salva cópia
        const destFolder = path.join(DOWNLOADS_DIR, 'importados', modelId);
        fs.mkdirSync(destFolder, { recursive: true });
        fs.writeFileSync(path.join(destFolder, `${modelId}.${item.format}`), item.buffer);
        if (thumbBuffer && thumbBuffer.length > 0) {
          fs.writeFileSync(path.join(destFolder, 'thumb.png'), thumbBuffer);
        }

        // Envia ao Supabase
        const supabaseRes = await syncToSupabase({
          modelId,
          cleanName: friendlyName,
          format: item.format,
          fileBuffer: item.buffer,
          metrics,
          groupName: 'Importação Local',
          authorName: SUPABASE_AUTHOR,
          thumbBuffer
        });

        if (!supabaseRes.success) {
          console.warn(`⚠️ [STL Import Falhou] Upload Supabase falhou para "${friendlyName}": ${supabaseRes.reason}`);
          continue;
        }

        // Salva no Git local apenas se o Supabase aceitou
        syncToLocalGitProject({
          modelId,
          cleanName: friendlyName,
          format: item.format,
          fileBuffer: item.buffer,
          metrics,
          groupName: 'Importação Local',
          authorName: SUPABASE_AUTHOR,
          thumbBuffer
        });

        imported.push({
          modelId,
          name: friendlyName,
          format: item.format,
          metrics,
          supabase: supabaseRes.success,
          thumb: supabaseRes.thumbOk
        });
      }
    } catch (err) {
      console.warn(`[STL Import Error] ${fileName}:`, err.message);
    }
  }

  return { success: true, count: imported.length, imported };
}

/**
 * Retorna o status geral da sincronização de modelos STL/3MF
 */
export function getSTLServiceStatus() {
  const models = Object.values(historyCache)
    .filter(h => h.success && h.models)
    .flatMap(h => h.models);

  return {
    active: true,
    targetGroups: TARGET_GROUPS,
    stats: {
      totalDownloaded: models.length,
      supabaseConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
      serviceRoleConfigured: !!SUPABASE_SERVICE_ROLE,
      supabaseUrl: SUPABASE_URL,
      projectRoot: PROJECT_ROOT,
      downloadsDirectory: DOWNLOADS_DIR
    },
    recentModels: models.slice(-20).reverse()
  };
}

/**
 * Remove permanentemente do catálogo local e do Supabase modelos marcados com __DELETED__
 */
export async function purgeDeletedModels() {
  const k = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
  if (!k || !fs.existsSync(PROJECT_ROOT)) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/models?description=eq.__DELETED__`, {
      headers: { 'Authorization': `Bearer ${k}`, 'apikey': k }
    });
    if (!res.ok) return;
    const deletedList = await res.json();
    if (!Array.isArray(deletedList) || deletedList.length === 0) return;

    console.log(`[STL Purge] Limpando ${deletedList.length} modelos deletados...`);
    const catalogPath = path.join(PROJECT_ROOT, 'data', 'catalog.json');
    let catalogChanged = false;

    if (fs.existsSync(catalogPath)) {
      try {
        const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const idsToRemove = new Set(deletedList.map(d => d.id));
        const originalCount = cat.models.length;
        cat.models = cat.models.filter(m => !idsToRemove.has(m.id));
        if (cat.models.length !== originalCount) {
          cat.updated = new Date().toISOString();
          fs.writeFileSync(catalogPath, JSON.stringify(cat, null, 2));
          catalogChanged = true;
        }
      } catch {}
    }

    for (const d of deletedList) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/models?id=eq.${encodeURIComponent(d.id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${k}`, 'apikey': k }
        });
      } catch {}

      const localDir = path.join(PROJECT_ROOT, 'models', d.id);
      if (fs.existsSync(localDir)) {
        try { fs.rmSync(localDir, { recursive: true, force: true }); } catch {}
      }
    }

    if (catalogChanged) {
      pushCatalogToGitHub();
    }
  } catch (err) {
    console.warn('[STL Purge Warning]:', err.message);
  }
}

// Executa limpeza periódica
setInterval(purgeDeletedModels, 5 * 60 * 1000);
setTimeout(purgeDeletedModels, 10000);

