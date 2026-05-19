// Analytics per admin: statistika te pergjithshme + serite per chart-et.

const { query } = require('../db/pool');

async function overview(req, res) {
  try {
    const [totals, scoreDist, perDay, hardest, perCategory] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM users) AS users,
          (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admins,
          (SELECT COUNT(*)::int FROM questions) AS questions,
          (SELECT COUNT(*)::int FROM categories) AS categories,
          (SELECT COUNT(*)::int FROM attempts WHERE finished_at IS NOT NULL AND COALESCE(mode,'real')='real') AS attempts_real,
          (SELECT COUNT(*)::int FROM attempts WHERE finished_at IS NOT NULL AND mode='practice') AS attempts_practice,
          (SELECT ROUND(AVG(score)::numeric, 1) FROM attempts WHERE finished_at IS NOT NULL AND COALESCE(mode,'real')='real') AS avg_score,
          (SELECT MAX(score) FROM attempts WHERE finished_at IS NOT NULL) AS max_score
      `),

      // Histogram rezultatesh ne grupe te 5 pyetjeve
      query(`
        SELECT
          FLOOR(score::numeric / 5) * 5 AS bucket,
          COUNT(*)::int AS n
        FROM attempts
        WHERE finished_at IS NOT NULL AND COALESCE(mode,'real')='real'
        GROUP BY bucket
        ORDER BY bucket
      `),

      // Attempts per dite, 14 ditet e fundit
      query(`
        SELECT
          to_char(d::date, 'YYYY-MM-DD') AS day,
          COALESCE(c.n, 0)::int AS n
        FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') d
        LEFT JOIN (
          SELECT date_trunc('day', started_at)::date AS day, COUNT(*) AS n
          FROM attempts
          GROUP BY day
        ) c ON c.day = d::date
        ORDER BY d
      `),

      // Top 5 pyetjet me te veshtira (rate me i ulet)
      query(`
        SELECT q.id, q.text,
               c.name AS category,
               COUNT(a.*) FILTER (WHERE a.selected_option_id IS NOT NULL)::int AS answered,
               COUNT(a.*) FILTER (WHERE a.is_correct = true)::int AS correct,
               CASE WHEN COUNT(a.*) FILTER (WHERE a.selected_option_id IS NOT NULL) > 0
                    THEN ROUND(100.0 * COUNT(a.*) FILTER (WHERE a.is_correct = true)
                               / COUNT(a.*) FILTER (WHERE a.selected_option_id IS NOT NULL))
                    ELSE NULL END AS correct_rate
        FROM questions q
        LEFT JOIN categories c ON c.id = q.category_id
        LEFT JOIN answers a ON a.question_id = q.id
        GROUP BY q.id, c.name
        HAVING COUNT(a.*) FILTER (WHERE a.selected_option_id IS NOT NULL) >= 1
        ORDER BY correct_rate ASC NULLS LAST, q.id
        LIMIT 5
      `),

      // Statistika per kategori
      query(`
        SELECT c.id, c.name,
               COUNT(q.id)::int AS question_count,
               COUNT(a.*) FILTER (WHERE a.is_correct = true)::int AS correct,
               COUNT(a.*) FILTER (WHERE a.selected_option_id IS NOT NULL)::int AS answered
        FROM categories c
        LEFT JOIN questions q ON q.category_id = c.id
        LEFT JOIN answers a ON a.question_id = q.id
        GROUP BY c.id, c.name
        ORDER BY c.name
      `),
    ]);

    res.json({
      totals: totals.rows[0],
      score_distribution: scoreDist.rows,
      attempts_per_day: perDay.rows,
      hardest_questions: hardest.rows,
      categories: perCategory.rows,
    });
  } catch (err) {
    console.error('[analytics.overview]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { overview };
