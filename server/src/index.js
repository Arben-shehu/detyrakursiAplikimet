// Entry-point i serverit: nis Express ne portin e konfiguruar.

require('dotenv').config();
const app = require('./app');
const { pool } = require('./db/pool');

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('[db] Lidhja me PostgreSQL OK');
  } catch (err) {
    console.error('[db] Deshtoi lidhja me PostgreSQL. Kontrollo .env dhe pgAdmin.', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] Po degjon ne http://localhost:${PORT}`);
  });
}

start();
