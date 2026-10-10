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
