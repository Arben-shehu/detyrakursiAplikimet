import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function LeaderboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/leaderboard?limit=10')
      .then((d) => setItems(d.leaderboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Po ngarkohet...</div>;
  if (error) return <div className="alert">{error}</div>;

  return (
    <section>
      <h2>🏆 Leaderboard - Top 10</h2>
      <p className="muted">Skoret me te larta nga te gjitha tentativat e mbaruara.</p>

      {items.length === 0 ? (
        <p className="muted">Ende askush nuk ka mbaruar nje test. Bej te paren!</p>
      ) : (
        <ol className="lb-list">
          {items.map((it, i) => (
            <li key={it.id} className={`lb-item rank-${i + 1}`}>
              <div className="lb-rank">{medal(i + 1)}</div>
              <div className="lb-user">
                <div className="lb-username">{it.username}</div>
                <div className="lb-meta">
                  {fmtDate(it.finished_at)}
                  {it.duration_sec != null && ` · ${fmtDuration(it.duration_sec)}`}
                </div>
              </div>
              <div className="lb-score">
                <div className="lb-score-big">{it.score}/{it.total_questions}</div>
                <div className="lb-score-pct">{it.percentage}%</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
