import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function ResultPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result) return;
    api.get(`/api/attempts/${attemptId}`)
      .then((data) => {
        const a = data.attempt;
        setResult({
          attempt_id: a.id,
          score: a.score,
          total: a.total_questions,
          percentage: a.score != null ? Math.round((a.score / a.total_questions) * 100) : null,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [attemptId, result]);

  if (loading) return <div className="loading">Po llogaritet skori...</div>;
  if (error) return <div className="alert">{error}</div>;
  if (!result) return null;

  return (
    <section className="result">
      <h2>Rezultati i testit</h2>
      <div className="result-card">
        <div className="score-big">{result.score} / {result.total}</div>
        <div className="score-pct">{result.percentage}%</div>
        <p className="muted">{verdikt(result.percentage)}</p>
      </div>
      <div className="cta-row">
        <Link to={`/history/${result.attempt_id}`} className="btn">Shih pergjigjet</Link>
        <Link to="/quiz" className="btn btn-primary">Provo perseri</Link>
        <Link to="/history" className="btn btn-ghost">Historia</Link>
      </div>
    </section>
  );
}

function verdikt(pct) {
  if (pct == null) return '';
  if (pct >= 90) return 'Shkelqyer! Performance shume e larte.';
  if (pct >= 70) return 'Mire pune, rezultati eshte mbi mesatare.';
  if (pct >= 50) return 'Mire, mund te kalosh testin.';
  return 'Provo perseri me ushtrim shtese.';
}
