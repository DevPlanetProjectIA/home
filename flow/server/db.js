import initSqlJs from 'sql.js';
import fs from 'node:fs';

/**
 * Inicializa um banco de dados SQLite puro em WebAssembly (sem compilação C++, compatível com qualquer servidor).
 */
export async function initDatabase(dbFilePath) {
  const SQL = await initSqlJs();
  let rawDb;

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      rawDb = new SQL.Database(fileBuffer);
    } catch {
      rawDb = new SQL.Database();
    }
  } else {
    rawDb = new SQL.Database();
  }

  const save = () => {
    try {
      const data = Buffer.from(rawDb.export());
      fs.writeFileSync(dbFilePath, data);
    } catch (err) {
      console.error('[Database Save Error]:', err.message);
    }
  };

  return {
    exec(sql) {
      rawDb.exec(sql);
      save();
    },
    prepare(sql) {
      return {
        get(...params) {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params.flat());
          if (!stmt.step()) {
            stmt.free();
            return undefined;
          }
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        },
        all(...params) {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params.flat());
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        },
        run(...params) {
          rawDb.run(sql, params.flat());
          const info = rawDb.exec('SELECT last_insert_rowid() AS id, changes() AS ch');
          const lastInsertRowid = info[0]?.values[0][0] ?? 0;
          const changes = info[0]?.values[0][1] ?? 0;
          save();
          return { lastInsertRowid, changes };
        }
      };
    }
  };
}
