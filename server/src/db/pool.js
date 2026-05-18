// Lidhja me PostgreSQL nepermjet librarise `pg`.
// Konfigurimi merret nga variablat e ambjentit (server/.env).
//
// Suporton dy menyra:
//  - DATABASE_URL (postgresql://user:pass@host/db) - perdoret nga Neon, Render, Heroku
//  - PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE - format klasik
//
// Nese DATABASE_URL eshte caktuar, ka prioritet.

require('dotenv').config();
const { Pool } = require('pg');

const useUrl = !!process.env.DATABASE_URL;
const needsSsl = useUrl && /sslmode=require|neon\.tech|render\.com/.test(process.env.DATABASE_URL);

const pool = useUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'iq_tester',
    });

pool.on('error', (err) => {
  console.error('[pg] Gabim i papritur ne Pool:', err);
});

// query(sql, params) - shkurtore qe perdoret nga controllers
async function query(text, params) {
  return pool.query(text, params);
}

// withTransaction(cb) - ekzekuton callback brenda BEGIN/COMMIT
async function withTransaction(cb) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await cb(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
