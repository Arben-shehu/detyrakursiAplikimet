// Skript "one-shot" qe ekzekuton schema.sql ne databazen e konfiguruar.
//
// Suporton dy menyra:
//  - DATABASE_URL (per Neon/Render/prod): lidhet direkt; nuk krijon DB sepse
//    sherbimi e ka krijuar paraprakisht.
//  - PGHOST/PGPORT/... (per lokal me pgAdmin): lidhet ne `postgres`, krijon
//    database `PGDATABASE` nese mungon, pastaj ekzekuton schema.sql.
//
// Pas tij mund te besh `npm run seed` per te shtuar admin + pyetje shembull.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const schemaPath = path.join(__dirname, 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

async function runRemote() {
  const url = process.env.DATABASE_URL;
  const needsSsl = /sslmode=require|neon\.tech|render\.com/.test(url);
  const client = new Client({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  console.log('[setup] Lidhur me databaze remote (DATABASE_URL).');
  console.log('[setup] Po ekzekutohet schema.sql...');
  await client.query(sql);
  console.log('[setup] Skema u krijua me sukses.');
  await client.end();
}

async function runLocal() {
  const TARGET_DB = process.env.PGDATABASE || 'iq_tester';
  const baseCfg = {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
  };

  const adminClient = new Client({ ...baseCfg, database: 'postgres' });
  try {
    await adminClient.connect();
  } catch (e) {
    console.error('[setup] Deshtoi lidhja me PostgreSQL ne database `postgres`.');
    console.error('        Kontrollo PGUSER/PGPASSWORD ne .env');
    console.error('        Detaji:', e.message);
    process.exit(1);
  }

  const r = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [TARGET_DB]);
  if (r.rowCount === 0) {
    console.log(`[setup] Po krijoj database "${TARGET_DB}"...`);
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(TARGET_DB)) {
      console.error('[setup] Emer i pavlefshem database:', TARGET_DB);
      process.exit(1);
    }
    await adminClient.query(`CREATE DATABASE "${TARGET_DB}"`);
    console.log('[setup] Database u krijua.');
  } else {
    console.log(`[setup] Database "${TARGET_DB}" ekziston, po vazhdohet.`);
  }
  await adminClient.end();

  const dbClient = new Client({ ...baseCfg, database: TARGET_DB });
  await dbClient.connect();
  console.log('[setup] Po ekzekutohet schema.sql...');
  await dbClient.query(sql);
  console.log('[setup] Skema u krijua me sukses.');
  await dbClient.end();
}

(async () => {
  if (process.env.DATABASE_URL) {
    await runRemote();
  } else {
    await runLocal();
  }
})().catch((err) => {
  console.error('[setup] DESHTOI:', err);
  process.exit(1);
});
