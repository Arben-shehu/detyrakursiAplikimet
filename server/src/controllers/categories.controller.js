// CRUD per kategorite. Listimi eshte publik, ndryshimet vetem per admin.

const { query } = require('../db/pool');

async function list(req, res) {
  try {
    const r = await query(
      `SELECT c.id, c.name, c.description,
              (SELECT COUNT(*)::int FROM questions q WHERE q.category_id = c.id) AS question_count
       FROM categories c
       ORDER BY c.name ASC`
    );
    res.json({ categories: r.rows });
  } catch (err) {
    console.error('[categories.list]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function getOne(req, res) {
  try {
    const r = await query('SELECT id, name, description FROM categories WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Kategoria nuk u gjet' });
    res.json({ category: r.rows[0] });
  } catch (err) {
    console.error('[categories.getOne]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function create(req, res) {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Emri eshte i detyrueshem' });
  try {
    const r = await query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name.trim(), description || null]
    );
    res.status(201).json({ category: r.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Emri ekziston' });
    console.error('[categories.create]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function update(req, res) {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Emri eshte i detyrueshem' });
  try {
    const r = await query(
      `UPDATE categories SET name = $1, description = $2
       WHERE id = $3 RETURNING id, name, description`,
      [name.trim(), description || null, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Kategoria nuk u gjet' });
    res.json({ category: r.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Emri ekziston' });
    console.error('[categories.update]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function remove(req, res) {
  try {
    const r = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Kategoria nuk u gjet' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[categories.remove]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { list, getOne, create, update, remove };
