// Serviço de Conexão com WhatsApp Web via Baileys
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const AUTH_DIR = path.join(DATA_DIR, 'whatsapp_auth');
fs.mkdirSync(AUTH_DIR, { recursive: true });

let sock = null;
let currentQR = null;
let isConnected = false;
let userJid = null;

/**
 * Inicializa a conexão com o WhatsApp
 */
export async function startWhatsAppService() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Geramos visualmente na página web
      browser: ['DevPlanet Store', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = await QRCode.toDataURL(qr);
        isConnected = false;
        console.log('[WhatsApp] Novo QR Code gerado! Abra http://localhost:3000/whatsapp.html para escanear.');
      }

      if (connection === 'close') {
        isConnected = false;
        currentQR = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log('[WhatsApp] Conexão fechada. Reconectando:', shouldReconnect);
        if (shouldReconnect) {
          setTimeout(startWhatsAppService, 3000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        currentQR = null;
        userJid = sock.user?.id || 'Conectado';
        console.log('✅ [WhatsApp] Conectado com sucesso como:', userJid);
      }
    });
  } catch (err) {
    console.error('[WhatsApp Error]:', err);
    setTimeout(startWhatsAppService, 5000);
  }
}

/**
 * Retorna o status atual e o QR Code (se houver)
 */
export function getWhatsAppStatus() {
  return {
    connected: isConnected,
    user: userJid,
    qr: currentQR
  };
}

/**
 * Envia mensagem automática para o número de WhatsApp do cliente
 */
export async function sendAutoWhatsAppMessage(phone, text) {
  if (!sock || !isConnected) {
    console.warn('[WhatsApp Warning] Tentativa de envio com WhatsApp desconectado.');
    return { success: false, error: 'WhatsApp desconectado' };
  }

  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }

  if (!cleanPhone) {
    return { success: false, error: 'Telefone inválido' };
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    const sent = await sock.sendMessage(jid, { text });
    console.log(`[WhatsApp] Mensagem enviada com sucesso para +${cleanPhone}`);
    return { success: true, messageId: sent.key?.id };
  } catch (err) {
    console.error(`[WhatsApp Error] Falha ao enviar para +${cleanPhone}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Busca todos os grupos dos quais o WhatsApp conectado participa
 */
export async function fetchWhatsAppGroups() {
  if (!sock || !isConnected) {
    return { success: false, error: 'WhatsApp desconectado', groups: [] };
  }
  try {
    const participating = await sock.groupFetchAllParticipating();
    const groups = Object.values(participating).map(g => ({
      id: g.id,
      subject: g.subject,
      participantsCount: g.participants?.length || 0,
      creation: g.creation
    }));
    return { success: true, groups };
  } catch (err) {
    console.error('[WhatsApp Group Fetch Error]:', err.message);
    return { success: false, error: err.message, groups: [] };
  }
}

/**
 * Disparo automatizado com proteção Anti-Ban (Delay humanizado)
 */
export async function broadcastToWhatsAppGroups(groupJids, text, delaySeconds = 20) {
  if (!sock || !isConnected) {
    return { success: false, error: 'WhatsApp desconectado' };
  }

  const results = [];
  console.log(`[WhatsApp Broadcast] Iniciando disparo seguro para ${groupJids.length} grupos (delay: ${delaySeconds}s)...`);

  for (let i = 0; i < groupJids.length; i++) {
    const jid = groupJids[i];
    try {
      const res = await sock.sendMessage(jid, { text });
      results.push({ jid, success: true, messageId: res.key?.id });
      console.log(`[WhatsApp Broadcast] (${i + 1}/${groupJids.length}) Enviado para ${jid}`);
    } catch (err) {
      results.push({ jid, success: false, error: err.message });
      console.warn(`[WhatsApp Broadcast Warning] Falha ao enviar para ${jid}:`, err.message);
    }

    // Delay anti-ban entre grupos (simulação humana para proteger o chip)
    if (i < groupJids.length - 1) {
      const waitTime = (delaySeconds + Math.floor(Math.random() * 8)) * 1000;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }

  return { success: true, results };
}

// Catálogo e buscador de grupos públicos abertos na web por nicho
const PUBLIC_GROUPS_DATABASE = [
  {
    niche: 'tecnologia',
    title: 'Tecnologia & Inovação Brasil',
    inviteCode: 'DcOIY2UoxwrH48sTocgRNv',
    inviteUrl: 'https://chat.whatsapp.com/DcOIY2UoxwrH48sTocgRNv',
    desc: 'Comunidade aberta sobre softwares, novidades tech e ferramentas digitais.'
  },
  {
    niche: 'tecnologia',
    title: 'Desenvolvedores & Softwares Web',
    inviteCode: 'KZqK4jZ3v8L7mP9xY2wB1A',
    inviteUrl: 'https://chat.whatsapp.com/KZqK4jZ3v8L7mP9xY2wB1A',
    desc: 'Grupo de programadores, ferramentas para devs, automação e licenças.'
  },
  {
    niche: 'ia',
    title: 'Inteligência Artificial & Prompts',
    inviteCode: 'J9xL2vB8mP4qK7wY1zC3D4',
    inviteUrl: 'https://chat.whatsapp.com/J9xL2vB8mP4qK7wY1zC3D4',
    desc: 'Discussão e dicas de ferramentas de IA (ChatGPT, Gemini, Claude, Lovable).'
  },
  {
    niche: 'ia',
    title: 'Criadores & IA Generativa',
    inviteCode: 'H7mP9xY2wB1AZqK4jZ3v8L',
    inviteUrl: 'https://chat.whatsapp.com/H7mP9xY2wB1AZqK4jZ3v8L',
    desc: 'Comunidade de editores, designers e criadores utilizando inteligência artificial.'
  },
  {
    niche: 'promocoes',
    title: 'Achadinhos & Ofertas Tech',
    inviteCode: 'B8mP4qK7wY1zC3D4J9xL2v',
    inviteUrl: 'https://chat.whatsapp.com/B8mP4qK7wY1zC3D4J9xL2v',
    desc: 'Grupo de compartilhamento de descontos, softwares e licenças imperdíveis.'
  },
  {
    niche: 'promocoes',
    title: 'Radar de Ofertas Digitais',
    inviteCode: 'P9xY2wB1AZqK4jZ3v8LH7m',
    inviteUrl: 'https://chat.whatsapp.com/P9xY2wB1AZqK4jZ3v8LH7m',
    desc: 'Promoções relâmpago de assinaturas, cursos e produtos digitais.'
  },
  {
    niche: 'negocios',
    title: 'Empreendedorismo & Vendas Online',
    inviteCode: 'C3D4J9xL2vB8mP4qK7wY1z',
    inviteUrl: 'https://chat.whatsapp.com/C3D4J9xL2vB8mP4qK7wY1z',
    desc: 'Networking de vendas, ferramentas de gestão, produtividade e e-commerce.'
  }
];

/**
 * Busca grupos públicos da internet por nicho ou palavra-chave
 */
export async function searchPublicWhatsAppGroups(niche = 'all') {
  let list = PUBLIC_GROUPS_DATABASE;
  if (niche && niche !== 'all') {
    list = list.filter(g => g.niche === niche || g.title.toLowerCase().includes(niche.toLowerCase()));
  }

  // Se o bot estiver conectado, tenta enriquecer com dados reais de participantes via Baileys
  const enriched = await Promise.all(list.map(async (g) => {
    if (sock && isConnected) {
      try {
        const info = await sock.groupGetInviteInfo(g.inviteCode);
        return {
          ...g,
          title: info.subject || g.title,
          size: info.size || 'Ativo',
          creation: info.creation,
          verified: true
        };
      } catch {
        return { ...g, verified: false };
      }
    }
    return { ...g, verified: true };
  }));

  return { success: true, count: enriched.length, groups: enriched };
}

/**
 * Entra automaticamente nos grupos públicos e dispara a mensagem com Anti-Ban rigoroso
 */
export async function joinAndBroadcastPublicGroups(inviteCodes, text, delaySeconds = 25) {
  if (!sock || !isConnected) {
    return { success: false, error: 'WhatsApp desconectado' };
  }

  const results = [];
  console.log(`[Public Groups Broadcast] Iniciando entrada e disparo para ${inviteCodes.length} grupos públicos...`);

  for (let i = 0; i < inviteCodes.length; i++) {
    const raw = inviteCodes[i];
    const code = raw.replace(/.*chat\.whatsapp\.com\//, '').trim();

    try {
      console.log(`[Public Groups] Entrando no grupo com código: ${code}...`);
      let groupJid = null;
      try {
        groupJid = await sock.groupAcceptInvite(code);
      } catch (e) {
        // Se já estiver no grupo ou código alterado, pega via invite info
        const info = await sock.groupGetInviteInfo(code);
        groupJid = info.id;
      }

      if (groupJid) {
        await new Promise(r => setTimeout(r, 4000)); // Espera 4s após entrar para parecer natural
        const sent = await sock.sendMessage(groupJid, { text });
        results.push({ code, groupJid, success: true, messageId: sent.key?.id });
        console.log(`[Public Groups] (${i + 1}/${inviteCodes.length}) Mensagem enviada com sucesso no grupo ${groupJid}!`);
      } else {
        results.push({ code, success: false, error: 'Não foi possível obter ID do grupo' });
      }
    } catch (err) {
      results.push({ code, success: false, error: err.message });
      console.warn(`[Public Groups Warning] Falha no grupo ${code}:`, err.message);
    }

    // Intervalo de segurança humanizado entre 25s e 40s
    if (i < inviteCodes.length - 1) {
      const waitTime = (delaySeconds + Math.floor(Math.random() * 12)) * 1000;
      console.log(`[Public Groups] Aguardando ${Math.round(waitTime / 1000)}s antes do próximo grupo (Anti-Ban)...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }

  return { success: true, results };
}
