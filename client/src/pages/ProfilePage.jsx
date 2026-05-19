import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/attempts/me')
      .then((d) => setAttempts(d.attempts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProfileSkeleton />;

  const real = attempts.filter((a) => a.finished_at && (a.mode === 'real' || !a.mode));
  const total = real.length;
  const best = real.reduce((m, a) => Math.max(m, a.score || 0), 0);
  const avg = total > 0
    ? Math.round(real.reduce((s, a) => s + (a.score || 0), 0) / total * 10) / 10
    : 0;
  const totalCorrect = real.reduce((s, a) => s + (a.score || 0), 0);
  const possibleMax = real.reduce((s, a) => s + (a.total_questions || 0), 0);
  const accuracy = possibleMax > 0 ? Math.round((totalCorrect / possibleMax) * 100) : 0;
  const lastAttempt = real[0];

  const badges = computeBadges({ total, best, avg });

  return (
    <section className="profile">
      <header className="profile-header">
        <div className="avatar-large">{(user?.username || '?')[0].toUpperCase()}</div>
        <div>
          <h1>{user?.username}</h1>
          <p className="muted">{user?.email}</p>
          <p className="muted profile-since">Anetar qe nga {fmtDate(user?.created_at)}</p>
        </div>
      </header>

      <div className="kpi-grid">
        <KpiCard label="Teste te plota" value={total} icon="🎯" />
        <KpiCard label="Rezultati me i larte" value={best ? `${best}/20` : '—'} icon="🏆" />
        <KpiCard label="Mesatare" value={avg ? `${avg}/20` : '—'} icon="📊" />
        <KpiCard label="Saktesi total" value={`${accuracy}%`} icon="🎯" />
      </div>

      {real.length > 0 && (
        <div className="chart-card">
          <h3>Progresi yt ne kohe</h3>
          <ProgressLineChart attempts={real} />
        </div>
      )}

      {badges.length > 0 && (
        <div className="chart-card">
          <h3>🏅 Badges</h3>
          <div className="badges-row">
            {badges.map((b) => (
              <div key={b.key} className={`badge-card ${b.color}`}>
                <div className="badge-icon">{b.icon}</div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-desc muted">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastAttempt && (
        <div className="chart-card">
          <h3>Tentativa e fundit</h3>
          <p>
            Rezultati: <b>{lastAttempt.score}/{lastAttempt.total_questions}</b> &middot;{' '}
            {fmtDate(lastAttempt.finished_at)}
          </p>
          <Link to={`/history/${lastAttempt.id}`} className="btn">Shih detajet</Link>
        </div>
      )}

      {real.length === 0 && (
        <EmptyState
          icon="📝"
          title="Asnje tentative ende"
          desc="Filloni testin tuaj te pare per te pare statistikat ketu."
          action={<Link to="/quiz" className="btn btn-primary">Fillo Testin</Link>}
        />
      )}
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

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p className="muted">{desc}</p>
      {action}
    </div>
  );
}

function ProgressLineChart({ attempts }) {
  // attempts vijne ne renditje DESC; per chart kthejme ne ASC
  const data = [...attempts].reverse().slice(-15); // 15 e fundit (kronologjike)
  const w = 600, h = 200, pad = 30;
  const max = Math.max(...data.map((a) => a.total_questions), 20);
  const xStep = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const points = data.map((a, i) => ({
    x: pad + i * xStep,
    y: pad + (1 - (a.score || 0) / max) * (h - pad * 2),
    score: a.score,
    total: a.total_questions,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x},${h - pad} L ${pad},${h - pad} Z`;

  return (
    <div className="line-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="line-chart">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--border)" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--border)" />
        <path d={areaD} fill="var(--primary-bg)" />
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--primary)" />
            <title>{`${p.score}/${p.total}`}</title>
          </g>
        ))}
        <text x={pad - 6} y={pad + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{max}</text>
        <text x={pad - 6} y={h - pad + 4} textAnchor="end" fontSize="10" fill="var(--muted)">0</text>
      </svg>
    </div>
  );
}

function computeBadges({ total, best, avg }) {
  const out = [];
  if (total >= 1) out.push({ key: 'first', icon: '🌱', name: 'Hapi i Pare', desc: 'Beje testin e pare', color: 'badge-green' });
  if (total >= 5) out.push({ key: 'persistent', icon: '🔥', name: 'Kembengulja', desc: '5+ tentativa', color: 'badge-orange' });
  if (total >= 10) out.push({ key: 'master', icon: '🎓', name: 'Master', desc: '10+ tentativa', color: 'badge-purple' });
  if (best >= 15) out.push({ key: 'high', icon: '⭐', name: 'I Larte', desc: 'Rezultati 15+/20', color: 'badge-yellow' });
  if (best === 20) out.push({ key: 'perfect', icon: '💎', name: 'Perfeksionist', desc: 'Rezultati 20/20!', color: 'badge-pink' });
  if (avg >= 14) out.push({ key: 'consistent', icon: '📈', name: 'Konsistent', desc: 'Mesatarja > 14', color: 'badge-blue' });
  return out;
}

function ProfileSkeleton() {
  return (
    <section className="profile">
      <div className="skeleton skel-header" />
      <div className="kpi-grid">
        {[1,2,3,4].map((i) => <div key={i} className="skeleton skel-kpi" />)}
      </div>
      <div className="skeleton skel-chart" />
    </section>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}
