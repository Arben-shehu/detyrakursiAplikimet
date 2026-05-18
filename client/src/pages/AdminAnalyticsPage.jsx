import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/analytics/overview')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Po ngarkohet...</div>;
  if (error) return <div className="alert">{error}</div>;
  if (!data) return null;

  const { totals, score_distribution, attempts_per_day, hardest_questions, categories } = data;

  return (
    <section>
      <Breadcrumbs items={[
        { label: 'Kreu', to: '/' },
        { label: 'Admin' },
        { label: 'Analytics' },
      ]} />
      <h2>📊 Analytics</h2>
      <p className="muted">Permbledhje e platformes.</p>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard label="Perdorues" value={totals.users} icon="👥" />
        <KpiCard label="Pyetje" value={totals.questions} icon="❓" />
        <KpiCard label="Kategori" value={totals.categories} icon="📁" />
        <KpiCard label="Teste te plota" value={totals.attempts_real} icon="✓" />
        <KpiCard label="Praktika" value={totals.attempts_practice} icon="📝" />
        <KpiCard label="Mesatarja" value={`${totals.avg_score ?? '—'}/20`} icon="📈" />
      </div>

      {/* Attempts per day */}
      <div className="chart-card">
        <h3>Testet per dite (14 ditet e fundit)</h3>
        <BarChart data={attempts_per_day} xKey="day" yKey="n" />
      </div>

      {/* Score distribution */}
      <div className="chart-card">
        <h3>Shperndarja e skoreve</h3>
        {score_distribution.length === 0 ? (
          <p className="muted">Ende pa te dhena.</p>
        ) : (
          <HorizontalBars
            data={score_distribution.map((d) => ({
              label: `${d.bucket}–${Number(d.bucket) + 4}`,
              value: d.n,
            }))}
          />
        )}
      </div>

      {/* Hardest questions */}
      <div className="chart-card">
        <h3>5 pyetjet me te veshtira</h3>
        {hardest_questions.length === 0 ? (
          <p className="muted">Ende pa te dhena.</p>
        ) : (
          <ul className="hardest-list">
            {hardest_questions.map((q) => (
              <li key={q.id}>
                <div className="hq-row">
                  <span className="qcat">{q.category}</span>
                  <span className="hq-rate">{q.correct_rate ?? '—'}% sakte</span>
                </div>
                <div className="hq-text">{q.text}</div>
                <div className="muted hq-meta">
                  {q.correct} / {q.answered} pergjigje te sakta
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Categories breakdown */}
      <div className="chart-card">
        <h3>Performanca sipas kategorise</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Kategoria</th>
              <th>Pyetje</th>
              <th>Pergjigje</th>
              <th>Te sakta</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const pct = c.answered > 0 ? Math.round((c.correct / c.answered) * 100) : null;
              return (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.question_count}</td>
                  <td>{c.answered}</td>
                  <td>{c.correct}</td>
                  <td>{pct == null ? '—' : `${pct}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="kpi">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function BarChart({ data, xKey, yKey }) {
  if (!data || data.length === 0) {
    return <p className="muted">Ende pa te dhena.</p>;
  }
  const max = Math.max(...data.map((d) => d[yKey]), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const h = (d[yKey] / max) * 140;
        const day = d[xKey].slice(5); // MM-DD
        return (
          <div key={i} className="bar-col" title={`${d[xKey]}: ${d[yKey]}`}>
            <div className="bar-value">{d[yKey] || ''}</div>
            <div className="bar" style={{ height: `${h}px` }} />
            <div className="bar-label">{day}</div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="hbar-chart">
      {data.map((d, i) => (
        <div key={i} className="hbar-row">
          <span className="hbar-label">{d.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%` }}>
              <span className="hbar-value">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
