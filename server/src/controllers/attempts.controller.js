// Logjika e tentativave te testit IQ.
// start  : zgjedh N pyetje random, krijon nje attempt, kthen pyetjet pa is_correct
// answer : upsert i nje pergjigjeje (kontrollon kohen 15 min)
// finish : llogarit skorin dhe vendos finished_at
// listMine : tentativat e userit aktual
// getOne : detajet e nje tentative (rishikim)

const { query, withTransaction } = require('../db/pool');

const N = Number(process.env.QUIZ_QUESTIONS_PER_ATTEMPT) || 20;
const TIME_LIMIT_MIN = Number(process.env.QUIZ_TIME_LIMIT_MINUTES) || 15;

function isExpired(startedAt) {
  const ms = TIME_LIMIT_MIN * 60 * 1000;
  return Date.now() - new Date(startedAt).getTime() > ms;
}

async function start(req, res) {
  try {
    const userId = req.user.id;
    const mode = req.body?.mode === 'practice' ? 'practice' : 'real';
    const total = mode === 'practice' ? 10 : N;

    // Verifiko qe ka mjaft pyetje
    const cnt = await query('SELECT COUNT(*)::int AS n FROM questions');
    if (cnt.rows[0].n < total) {
      return res.status(400).json({ error: `Sistemi nuk ka mjaft pyetje (${cnt.rows[0].n}/${total})` });
    }

    const result = await withTransaction(async (client) => {
      const ar = await client.query(
        `INSERT INTO attempts (user_id, total_questions, mode)
         VALUES ($1, $2, $3)
         RETURNING id, started_at, total_questions, mode`,
        [userId, total, mode]
      );
      const attempt = ar.rows[0];

      // Zgjedh pyetje random
      const qr = await client.query(
        `SELECT q.id, q.text, q.difficulty, q.image_svg, c.name AS category_name
         FROM questions q
         LEFT JOIN categories c ON c.id = q.category_id
         ORDER BY random() LIMIT $1`,
        [total]
      );
      const questions = qr.rows;

      // Per cdo pyetje, merr opsionet (pa is_correct!)
      const ids = questions.map((q) => q.id);
      const or = await client.query(
        `SELECT id, question_id, text, image_svg FROM options
         WHERE question_id = ANY($1::int[])
         ORDER BY question_id, id`,
        [ids]
      );
      const optsByQ = new Map();
      for (const o of or.rows) {
        if (!optsByQ.has(o.question_id)) optsByQ.set(o.question_id, []);
        optsByQ.get(o.question_id).push({ id: o.id, text: o.text, image_svg: o.image_svg });
      }
      for (const q of questions) q.options = optsByQ.get(q.id) || [];

      for (const q of questions) {
        await client.query(
          `INSERT INTO answers (attempt_id, question_id, selected_option_id, is_correct)
           VALUES ($1, $2, NULL, NULL)`,
          [attempt.id, q.id]
        );
      }

      return { attempt, questions };
    });

    res.status(201).json({
      attempt_id: result.attempt.id,
      started_at: result.attempt.started_at,
      time_limit_minutes: mode === 'practice' ? null : TIME_LIMIT_MIN,
      mode: result.attempt.mode,
      questions: result.questions,
    });
  } catch (err) {
    console.error('[attempts.start]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function answer(req, res) {
  const attemptId = req.params.id;
  const { question_id, option_id } = req.body || {};
  if (!question_id) return res.status(400).json({ error: 'question_id i detyrueshem' });

  try {
    const ar = await query(
      'SELECT id, user_id, started_at, finished_at, mode FROM attempts WHERE id = $1',
      [attemptId]
    );
    if (ar.rowCount === 0) return res.status(404).json({ error: 'Tentativa nuk u gjet' });
    const attempt = ar.rows[0];
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Tentative e perdoruesit tjeter' });
    if (attempt.finished_at) return res.status(400).json({ error: 'Tentativa eshte mbyllur' });
    const isPractice = attempt.mode === 'practice';
    if (!isPractice && isExpired(attempt.started_at)) {
      return res.status(400).json({ error: 'Koha ka skaduar' });
    }

    // Validimi i opsionit (nese eshte dhene)
    let isCorrect = null;
    let correctOptionId = null;
    if (option_id) {
      const or = await query(
        'SELECT id, question_id, is_correct FROM options WHERE id = $1',
        [option_id]
      );
      if (or.rowCount === 0) return res.status(400).json({ error: 'option_id i pavlefshem' });
      if (or.rows[0].question_id !== question_id) {
        return res.status(400).json({ error: 'Opsioni nuk i perket pyetjes' });
      }
      isCorrect = or.rows[0].is_correct;
    }

    // Upsert i pergjigjes
    await query(
      `INSERT INTO answers (attempt_id, question_id, selected_option_id, is_correct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (attempt_id, question_id) DO UPDATE
       SET selected_option_id = EXCLUDED.selected_option_id,
           is_correct = EXCLUDED.is_correct`,
      [attemptId, question_id, option_id || null, isCorrect]
    );

    // Ne practice mode, kthen feedback te menjehershem
    if (isPractice) {
      const cr = await query(
        'SELECT id FROM options WHERE question_id = $1 AND is_correct = true LIMIT 1',
        [question_id]
      );
      correctOptionId = cr.rows[0]?.id || null;
      return res.json({ ok: true, is_correct: isCorrect, correct_option_id: correctOptionId });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[attempts.answer]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function finish(req, res) {
  const attemptId = req.params.id;
  try {
    const ar = await query(
      'SELECT id, user_id, started_at, finished_at, total_questions FROM attempts WHERE id = $1',
      [attemptId]
    );
    if (ar.rowCount === 0) return res.status(404).json({ error: 'Tentativa nuk u gjet' });
    const attempt = ar.rows[0];
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Tentative e perdoruesit tjeter' });
    if (attempt.finished_at) {
      return res.json({
        attempt_id: attempt.id,
        score: attempt.score,
        total: attempt.total_questions,
        already_finished: true,
      });
    }

    const sr = await query(
      `SELECT COUNT(*) FILTER (WHERE is_correct = true)::int AS correct
       FROM answers WHERE attempt_id = $1`,
      [attemptId]
    );
    const score = sr.rows[0].correct;

    await query(
      'UPDATE attempts SET finished_at = NOW(), score = $1 WHERE id = $2',
      [score, attemptId]
    );

    res.json({
      attempt_id: attempt.id,
      score,
      total: attempt.total_questions,
      percentage: Math.round((score / attempt.total_questions) * 100),
    });
  } catch (err) {
    console.error('[attempts.finish]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function listMine(req, res) {
  try {
    const r = await query(
      `SELECT id, started_at, finished_at, score, total_questions
       FROM attempts WHERE user_id = $1
       ORDER BY started_at DESC`,
      [req.user.id]
    );
    res.json({ attempts: r.rows });
  } catch (err) {
    console.error('[attempts.listMine]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

async function getOne(req, res) {
  const attemptId = req.params.id;
  try {
    const ar = await query(
      `SELECT id, user_id, started_at, finished_at, score, total_questions
       FROM attempts WHERE id = $1`,
      [attemptId]
    );
    if (ar.rowCount === 0) return res.status(404).json({ error: 'Tentativa nuk u gjet' });
    const attempt = ar.rows[0];
    if (attempt.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Pa akses ne kete tentative' });
    }

    const dr = await query(
      `SELECT a.question_id, a.selected_option_id, a.is_correct,
              q.text AS question_text,
              c.name AS category_name,
              o_sel.text AS selected_text,
              o_corr.id AS correct_option_id,
              o_corr.text AS correct_text
       FROM answers a
       LEFT JOIN questions q ON q.id = a.question_id
       LEFT JOIN categories c ON c.id = q.category_id
       LEFT JOIN options o_sel ON o_sel.id = a.selected_option_id
       LEFT JOIN LATERAL (
         SELECT id, text FROM options
         WHERE question_id = a.question_id AND is_correct = true
         LIMIT 1
       ) o_corr ON true
       WHERE a.attempt_id = $1
       ORDER BY a.id`,
      [attemptId]
    );

    // Mos shfaq pergjigjet e sakta nese tentativa nuk eshte mbaruar
    const details = attempt.finished_at
      ? dr.rows
      : dr.rows.map((r) => ({
          ...r,
          correct_option_id: null,
          correct_text: null,
          is_correct: null,
        }));

    res.json({ attempt, details });
  } catch (err) {
    console.error('[attempts.getOne]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { start, answer, finish, listMine, getOne };
