// CRUD i kufizuar per perdoruesit (admin-only).

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query } = require('../db/pool');

function generateTempPassword(len = 10) {
  // Karaktere te lexueshme, pa 0/O/1/l per te shmangur konfuzionin
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function list(req, res) {
  try {
    const r = await query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              (SELECT COUNT(*)::int FROM attempts a WHERE a.user_id = u.id) AS attempts_count
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json({ users: r.rows });
  } catch (err) {
    console.error('[users.list]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Nuk mund te fshish veten' });
  try {
    const r = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Perdoruesi nuk u gjet' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[users.remove]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function resetPassword(req, res) {
  const id = Number(req.params.id);
  try {
    const ur = await query('SELECT id, username FROM users WHERE id = $1', [id]);
    if (ur.rowCount === 0) return res.status(404).json({ error: 'Perdoruesi nuk u gjet' });

    const tempPassword = generateTempPassword(10);
    const password_hash = await bcrypt.hash(tempPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);

    res.json({
      ok: true,
      username: ur.rows[0].username,
      temp_password: tempPassword,
    });
  } catch (err) {
    console.error('[users.resetPassword]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { list, remove, resetPassword };
