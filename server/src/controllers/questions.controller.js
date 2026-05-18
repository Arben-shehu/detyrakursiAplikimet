// CRUD per pyetjet. Pyetja menaxhohet bashke me opsionet e saj
// (krijim/perditesim ne nje transaksion te vetem).

const { query, withTransaction } = require('../db/pool');

// Helper: zhgrupon pyetjet me opsionet e tyre nga nje rezultat query
function groupQuestionsWithOptions(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.q_id)) {
      map.set(row.q_id, {
        id: row.q_id,
        category_id: row.category_id,
        category_name: row.category_name,
        text: row.q_text,
        difficulty: row.difficulty,
        options: [],
      });
    }
    if (row.o_id) {
      map.get(row.q_id).options.push({
        id: row.o_id,
        text: row.o_text,
        is_correct: row.is_correct,
      });
    }
  }
  return Array.from(map.values());
}

async function list(req, res) {
  try {
    const r = await query(
      `SELECT q.id AS q_id, q.text AS q_text, q.difficulty, q.category_id,
              c.name AS category_name,
              o.id AS o_id, o.text AS o_text, o.is_correct
       FROM questions q
       LEFT JOIN categories c ON c.id = q.category_id
       LEFT JOIN options o ON o.question_id = q.id
       ORDER BY q.id ASC, o.id ASC`
    );
    res.json({ questions: groupQuestionsWithOptions(r.rows) });
  } catch (err) {
    console.error('[questions.list]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function getOne(req, res) {
  try {
    const r = await query(
      `SELECT q.id AS q_id, q.text AS q_text, q.difficulty, q.category_id,
              c.name AS category_name,
              o.id AS o_id, o.text AS o_text, o.is_correct
       FROM questions q
       LEFT JOIN categories c ON c.id = q.category_id
       LEFT JOIN options o ON o.question_id = q.id
       WHERE q.id = $1
       ORDER BY o.id ASC`,
      [req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Pyetja nuk u gjet' });
    const [question] = groupQuestionsWithOptions(r.rows);
    res.json({ question });
  } catch (err) {
    console.error('[questions.getOne]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

function validateBody(body) {
  const { category_id, text, difficulty, options } = body || {};
  if (!category_id) return 'category_id i detyrueshem';
  if (!text || !text.trim()) return 'text i detyrueshem';
  if (!Array.isArray(options) || options.length < 2) return 'duhen te pakten 2 opsione';
  if (!options.some((o) => o.is_correct)) return 'duhet te pakten 1 opsion i sakte';
  if (options.some((o) => !o.text || !o.text.trim())) return 'cdo opsion duhet text';
  if (difficulty != null && (difficulty < 1 || difficulty > 5)) return 'difficulty 1..5';
  return null;
}

async function create(req, res) {
  const err = validateBody(req.body);
  if (err) return res.status(400).json({ error: err });

  const { category_id, text, difficulty, options } = req.body;
  try {
    const created = await withTransaction(async (client) => {
      const qr = await client.query(
        `INSERT INTO questions (category_id, text, difficulty)
         VALUES ($1, $2, $3) RETURNING id, category_id, text, difficulty`,
        [category_id, text.trim(), difficulty || 1]
      );
      const question = qr.rows[0];
      question.options = [];
      for (const o of options) {
        const or = await client.query(
          `INSERT INTO options (question_id, text, is_correct)
           VALUES ($1, $2, $3) RETURNING id, text, is_correct`,
          [question.id, o.text.trim(), !!o.is_correct]
        );
        question.options.push(or.rows[0]);
      }
      return question;
    });
    res.status(201).json({ question: created });
  } catch (e) {
    console.error('[questions.create]', e);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function update(req, res) {
  const err = validateBody(req.body);
  if (err) return res.status(400).json({ error: err });

  const { category_id, text, difficulty, options } = req.body;
  const id = req.params.id;
  try {
    const updated = await withTransaction(async (client) => {
      const qr = await client.query(
        `UPDATE questions
         SET category_id = $1, text = $2, difficulty = $3
         WHERE id = $4
         RETURNING id, category_id, text, difficulty`,
        [category_id, text.trim(), difficulty || 1, id]
      );
      if (qr.rowCount === 0) return null;

      // Strategjia me e thjeshte: fshij opsionet e vjetra, fut te rejat
      await client.query('DELETE FROM options WHERE question_id = $1', [id]);

      const question = qr.rows[0];
      question.options = [];
      for (const o of options) {
        const or = await client.query(
          `INSERT INTO options (question_id, text, is_correct)
           VALUES ($1, $2, $3) RETURNING id, text, is_correct`,
          [id, o.text.trim(), !!o.is_correct]
        );
        question.options.push(or.rows[0]);
      }
      return question;
    });
    if (!updated) return res.status(404).json({ error: 'Pyetja nuk u gjet' });
    res.json({ question: updated });
  } catch (e) {
    console.error('[questions.update]', e);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function remove(req, res) {
  try {
    const r = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Pyetja nuk u gjet' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[questions.remove]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { list, getOne, create, update, remove };
