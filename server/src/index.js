// Entry-point i serverit: nis Express ne portin e konfiguruar.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { pool } = require('./db/pool');

const PORT = Number(process.env.PORT) || 4000;

// Ekzekuton schema.sql kur niset serveri (idempotent: migrations te sigurta).
// Aplikon edhe riemertime kategorish (p.sh. 'Verbale' -> 'Gjuhesore') automatikisht
// si lokal ashtu edhe ne deploy (Render).
async function runMigrations() {
  if (process.env.SKIP_MIGRATIONS === '1') {
    console.log('[db] Migrations u kapercyen (SKIP_MIGRATIONS=1).');
    return;
  }
  try {
    const sqlPath = path.join(__dirname, 'db', 'schema.sql');
    if (!fs.existsSync(sqlPath)) return;
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('[db] Migrations u aplikuan (schema.sql).');
  } catch (err) {
    console.error('[db] Migrations deshtuan:', err.message);
    // Nuk e bllokojme serverin — tabelat mund te ekzistojne tashme.
  }
}

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('[db] Lidhja me PostgreSQL OK');
  } catch (err) {
    console.error('[db] Deshtoi lidhja me PostgreSQL. Kontrollo .env dhe pgAdmin.', err.message);
    process.exit(1);
  }

  await runMigrations();

  app.listen(PORT, () => {
    console.log(`[server] Po degjon ne http://localhost:${PORT}`);
  });
}

start();
