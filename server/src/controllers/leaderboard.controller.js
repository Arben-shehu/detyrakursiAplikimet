// Leaderboard publik: top 10 rezultatet me te larta nga te gjitha tentativat e mbaruara.
// Vetem `mode = 'real'` (jo practice).

const { query } = require('../db/pool');

async function top(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  try {
    const r = await query(
      `SELECT a.id, a.score, a.total_questions, a.finished_at,
              ROUND((a.score::numeric / a.total_questions) * 100) AS percentage,
              EXTRACT(EPOCH FROM (a.finished_at - a.started_at))::int AS duration_sec,
              u.username
       FROM attempts a
       JOIN users u ON u.id = a.user_id
       WHERE a.finished_at IS NOT NULL
         AND a.score IS NOT NULL
         AND COALESCE(a.mode, 'real') = 'real'
       ORDER BY a.score DESC, duration_sec ASC, a.finished_at ASC
       LIMIT $1`,
      [limit]
    );
    res.json({ leaderboard: r.rows });
  } catch (err) {
    console.error('[leaderboard.top]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { top };
