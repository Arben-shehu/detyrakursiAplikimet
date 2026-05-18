// CRUD i kufizuar per perdoruesit (admin-only).

const { query } = require('../db/pool');

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

module.exports = { list, remove };
