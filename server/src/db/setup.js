// Skript "one-shot" qe:
//  1) lidhet me database-n `postgres` (default)
//  2) krijon database-n e konfiguruar (PGDATABASE) nese nuk ekziston
//  3) ekzekuton schema.sql ne te
//
// Pas tij mund te besh `npm run seed` per te shtuar admin + pyetje shembull.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const TARGET_DB = process.env.PGDATABASE || 'iq_tester';

const baseCfg = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
};

(async () => {
  // 1) Lidhu me postgres dhe krijo DB-n nese mungon
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
    // identifier sanity
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

  // 2) Lidhu me DB-n e re dhe ekzekuto schema.sql
  const dbClient = new Client({ ...baseCfg, database: TARGET_DB });
  await dbClient.connect();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('[setup] Po ekzekutohet schema.sql...');
  await dbClient.query(sql);
  console.log('[setup] Skema u krijua me sukses.');

  await dbClient.end();
})().catch((err) => {
  console.error('[setup] DESHTOI:', err);
  process.exit(1);
});
