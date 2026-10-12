import { initDatabase } from './db.js';
import { checkAndFulfillMLOrders, getValidAccessToken } from './mlAutopilotService.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('🧪 Testando serviço de Piloto Automático...');
  const db = await initDatabase(path.join(__dirname, 'data', 'app.db'));
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS ml_delivered_orders (
      order_id TEXT PRIMARY KEY,
      pack_id TEXT,
      buyer_id TEXT,
      buyer_nickname TEXT,
      item_id TEXT,
      item_title TEXT,
      amount REAL,
      license_key TEXT,
      license_instructions TEXT,
      delivered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      message_status TEXT
    );
  `);

  console.log('1. Testando obtenção de token válido...');
  const token = await getValidAccessToken();
  console.log('Token obtido:', token ? token.substring(0, 15) + '...' : 'FALHA');

  console.log('2. Testando checagem de pedidos no ML...');
  await checkAndFulfillMLOrders(db);
  console.log('✅ Ciclo de verificação de pedidos concluído com sucesso!');
}

run();
