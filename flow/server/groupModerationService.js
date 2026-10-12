// Serviço de Moderação Automática de Grupos de STL do WhatsApp
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MODERATION_FILE = path.join(DATA_DIR, 'stl_moderation.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Mensagem oficial de regras que deve ser disparada a cada 5 mensagens apagadas.
 */
export const RULES_MESSAGE = `Um espaço para compartilhar os STLs que citamos nos outros grupos e aqueles modelos bacanas que queremos dividir com nossos irmãos Calangos! 🦎

📌 REGRAS DO GRUPO:

✅ Envie somente arquivos STL. Para facilitar, acompanhe o arquivo com o nome do modelo e, se possível, uma foto da peça.`;

/**
 * IDs conhecidos dos grupos dedicados a STL.
 */
export const STL_GROUP_IDS = [
  '120363429333134994@g.us', // STL dos Calangos
  '120363429327299826@g.us'  // STL 🟠🦎
];

// Cache persistido de contagem de mensagens apagadas
let moderationData = {};
if (fs.existsSync(MODERATION_FILE)) {
  try {
    moderationData = JSON.parse(fs.readFileSync(MODERATION_FILE, 'utf8'));
  } catch {
    moderationData = {};
  }
}

function saveModerationData() {
  try {
    fs.writeFileSync(MODERATION_FILE, JSON.stringify(moderationData, null, 2));
  } catch (err) {
    console.error('[Moderação STL] Erro ao salvar dados de moderação:', err.message);
  }
}

/**
 * Cache em memória dos administradores dos grupos (TTL: 3 minutos)
 */
const groupAdminsCache = new Map();

/**
 * Verifica se o chat é exclusivamente um grupo de STL
 */
export function isSTLOnlyGroup(jid, groupName = '') {
  if (!jid || !jid.endsWith('@g.us')) return false;
  if (STL_GROUP_IDS.includes(jid)) return true;
  const name = String(groupName || '').toLowerCase();
  return name.includes('stl');
}

/**
 * Normaliza qualquer JID para o número base
 */
function normalizeJid(jid) {
  if (!jid) return '';
  return String(jid).split('@')[0].split(':')[0];
}

const SUPER_ADMIN_NUMBERS = new Set(['5521983110332', '229871095668885']);

/**
 * Obtém ou atualiza os administradores de um grupo
 */
export async function getGroupAdmins(sock, groupJid) {
  const now = Date.now();
  const cached = groupAdminsCache.get(groupJid);
  if (cached && (now - cached.timestamp < 3 * 60 * 1000)) {
    return cached;
  }

  try {
    const meta = await sock.groupMetadata(groupJid);
    const admins = new Set();
    let botIsAdmin = false;
    const botNum = normalizeJid(sock.user?.id || sock.authState?.creds?.me?.id || '5521983110332');
    const botLid = normalizeJid(sock.user?.lid || sock.authState?.creds?.me?.lid || '229871095668885');

    for (const p of meta.participants || []) {
      if (p.admin === 'admin' || p.admin === 'superadmin') {
        admins.add(p.id);
        const pNum = normalizeJid(p.id);
        admins.add(pNum);

        if (p.lid) {
          admins.add(p.lid);
          admins.add(normalizeJid(p.lid));
        }

        if (pNum === botNum || (botLid && (pNum === botLid || normalizeJid(p.lid) === botLid))) {
          botIsAdmin = true;
        }
      }
    }

    const result = {
      timestamp: now,
      subject: meta.subject || '',
      admins,
      botIsAdmin
    };
    groupAdminsCache.set(groupJid, result);
    return result;
  } catch (err) {
    console.warn(`[Moderação STL] Falha ao consultar administradores de ${groupJid}:`, err.message);
    return cached || { timestamp: 0, subject: '', admins: new Set(), botIsAdmin: false };
  }
}

/**
 * Desembrulha mensagens efêmeras, visualização única, etc.
 */
function unwrapMessage(msg) {
  let m = msg?.message;
  if (!m) return null;
  if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
  if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
  if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
  return m;
}

/**
 * Detecta se a mensagem é um arquivo 3D legítimo enviado (.stl, .3mf, .zip, .rar, etc.)
 * Somente arquivos 3D e arquivos compactados de modelos NÃO são apagados.
 */
export function isFileAttachment(msg) {
  const m = unwrapMessage(msg);
  if (!m) return false;

  // Documentos (arquivos .stl, .3mf, .zip, .rar, .7z, .obj, .step, .stp)
  const doc = m.documentMessage || m.documentWithCaptionMessage?.message?.documentMessage;
  if (doc) {
    const rawFileName = (doc.fileName || '').toLowerCase();
    const mimetype = (doc.mimetype || '').toLowerCase();

    const is3d = 
      /\.(stl|3mf|zip|rar|7z|obj|step|stp)$/i.test(rawFileName) ||
      mimetype.includes('stl') ||
      mimetype.includes('3mf') ||
      mimetype.includes('zip') ||
      mimetype.includes('rar') ||
      mimetype.includes('7z') ||
      (mimetype.includes('octet-stream') && !/\.(exe|apk|pdf|doc|docx|mp3|mp4|ogg)$/i.test(rawFileName));

    if (is3d) return true;
  }

  return false;
}

/**
 * Detecta se a mensagem é conversa, texto, foto, áudio ou figurinha
 * que deve ser apagada caso enviada por usuário que não seja Administrador.
 */
export function isPureTextMessage(msg) {
  const m = unwrapMessage(msg);
  if (!m) return false;

  // Ignora mensagens de protocolo técnico (reações com emoji, revogação prévia, chaves)
  if (m.protocolMessage || m.reactionMessage || m.senderKeyDistributionMessage) {
    return false;
  }

  // Se for anexo de arquivo 3D legítimo (STL, 3MF, ZIP, RAR), NÃO deve ser apagada
  if (isFileAttachment(msg)) {
    return false;
  }

  // Qualquer outra mensagem no grupo de STL é texto/conversa não-autorizada
  // (inclui fotos, prints, memes, perguntas, áudios, vídeos, figurinhas ou texto puro)
  return true;
}

/**
 * Processa a moderação de mensagens nos grupos de STL:
 * 1. Confere se é um grupo de STL.
 * 2. Confere se é uma mensagem recente (< 2h) e não é do bot ou superadmin.
 * 3. Confere se o remetente é administrador. Se for, mantém.
 * 4. Confere se é arquivo 3D legítimo (.stl, .3mf, .zip, .rar). Se for, mantém.
 * 5. Se for conversa/foto/texto de não-admin: apaga para todos como administrador.
 * 6. A cada 5 mensagens apagadas no grupo, envia as regras oficiais.
 */
export async function handleGroupModeration(sock, msg, groupSubject = '') {
  if (!msg || !msg.key) return { handled: false };

  const jid = msg.key.remoteJid;
  let isSTL = isSTLOnlyGroup(jid, groupSubject);
  if (!isSTL) {
    const cached = groupAdminsCache.get(jid);
    if (cached && isSTLOnlyGroup(jid, cached.subject)) {
      isSTL = true;
    }
  }

  if (!isSTL) {
    return { handled: false, reason: 'not_stl_group' };
  }

  // Mensagens enviadas pelo próprio bot ou por Bruno nunca são apagadas
  const sender = msg.key.participant || msg.participant;
  const senderNum = normalizeJid(sender);

  if (msg.key.fromMe || SUPER_ADMIN_NUMBERS.has(senderNum)) {
    return { handled: false, reason: 'from_admin_or_me' };
  }

  // Tratamento seguro de timestamp (suporta number ou protobuf Long)
  const rawTs = msg.messageTimestamp;
  const msgTimeMs = typeof rawTs === 'number'
    ? rawTs * 1000
    : (typeof rawTs === 'object' && rawTs?.low ? rawTs.low * 1000 : (Number(rawTs) * 1000 || Date.now()));
  const ageMs = Date.now() - msgTimeMs;
  // Permite mensagens de até 2 horas (evita apenas apagamento em massa de dias anteriores)
  if (ageMs > 2 * 60 * 60 * 1000) {
    return { handled: false, reason: 'historical_message' };
  }

  // Se for arquivo 3D legítimo enviado (STL, 3MF, ZIP, RAR), NÃO apaga
  if (isFileAttachment(msg)) {
    console.log(`[Moderação STL] 📎 Arquivo 3D preservado de +${senderNum} no grupo.`);
    return { handled: false, reason: 'is_file_attachment' };
  }

  // Confere se é mensagem moderável (texto, foto com pergunta, áudio, figurinha, etc.)
  if (!isPureTextMessage(msg)) {
    return { handled: false, reason: 'not_moderable' };
  }

  if (!sender) return { handled: false, reason: 'unknown_sender' };

  // Obtém lista de administradores do grupo
  const groupInfo = await getGroupAdmins(sock, jid);
  const isAdmin = groupInfo.admins.has(sender) || groupInfo.admins.has(senderNum);

  if (isAdmin) {
    console.log(`[Moderação STL] Mensagem de texto mantida: +${senderNum} é Administrador no grupo.`);
    return { handled: false, reason: 'sender_is_admin' };
  }

  // Remetente NÃO é administrador e enviou mensagem não-arquivo no grupo de STL -> APAGAR!
  const groupName = groupInfo.subject || groupSubject || jid;

  try {
    const deleteKey = {
      remoteJid: jid,
      fromMe: false,
      id: msg.key.id,
      participant: msg.key.participant || msg.participant || sender
    };

    console.log(`[Moderação STL] 🗑️ Apagando mensagem de texto de +${senderNum} no grupo "${groupName}"...`);
    await sock.sendMessage(jid, { delete: deleteKey });

    // Atualiza contadores do grupo
    if (!moderationData[jid]) {
      moderationData[jid] = {
        deletedCount: 0,
        totalDeleted: 0,
        groupName,
        lastDeletedAt: null,
        lastRulesSentAt: null
      };
    }

    moderationData[jid].deletedCount = (moderationData[jid].deletedCount || 0) + 1;
    moderationData[jid].totalDeleted = (moderationData[jid].totalDeleted || 0) + 1;
    moderationData[jid].lastDeletedAt = new Date().toISOString();
    moderationData[jid].groupName = groupName;

    const currentCount = moderationData[jid].deletedCount;
    console.log(`[Moderação STL] ✅ Mensagem apagada com sucesso! (${currentCount}/5 para disparo das regras | Total acumulado: ${moderationData[jid].totalDeleted})`);

    // A cada 5 mensagens apagadas, dispara a mensagem com as regras
    if (currentCount >= 5) {
      moderationData[jid].deletedCount = 0;
      moderationData[jid].lastRulesSentAt = new Date().toISOString();
      saveModerationData();

      // Pequeno intervalo para a deleção processar no WhatsApp antes de postar as regras
      setTimeout(async () => {
        try {
          console.log(`[Moderação STL] 📢 Enviando aviso com REGRAS DO GRUPO para "${groupName}"...`);
          await sock.sendMessage(jid, { text: RULES_MESSAGE });
          console.log(`[Moderação STL] 📢 Regras enviadas com sucesso no grupo "${groupName}"!`);
        } catch (ruleErr) {
          console.error(`[Moderação STL Erro] Falha ao enviar regras no grupo "${groupName}":`, ruleErr.message);
        }
      }, 1500);
    } else {
      saveModerationData();
    }

    return {
      handled: true,
      deleted: true,
      sender: senderNum,
      deletedCount: moderationData[jid].deletedCount,
      totalDeleted: moderationData[jid].totalDeleted
    };
  } catch (deleteErr) {
    console.error(`[Moderação STL Erro] Não foi possível apagar mensagem de +${senderNum} em "${groupName}":`, deleteErr.message);
    if (!groupInfo.botIsAdmin) {
      console.warn(`[Moderação STL Aviso] ⚠️ O bot NÃO está com status de Administrador em "${groupName}". Promova o número do bot a Administrador para que a remoção para todos funcione!`);
    }
    return { handled: false, error: deleteErr.message };
  }
}

/**
 * Retorna as estatísticas atuais de moderação dos grupos
 */
export function getModerationStats() {
  return {
    success: true,
    groups: moderationData,
    rulesTemplate: RULES_MESSAGE,
    stlGroupIds: STL_GROUP_IDS
  };
}
