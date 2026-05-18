import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Confetti from '../components/Confetti';
import AnimatedCounter from '../components/AnimatedCounter';
import ScoreCircle from '../components/ScoreCircle';

export default function ResultPage() {
  const { user } = useAuth();
  const { attemptId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState('');

  function handlePrint() {
    window.print();
  }

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

  const celebrate = (result.percentage ?? 0) >= 70;

  return (
    <section className="result">
      <Confetti active={celebrate} />
      <h2 className="no-print">Rezultati i testit</h2>
      <div className="result-card">
        <ScoreCircle percentage={result.percentage || 0} label="skor i pergjithshem" />
        <div className="score-big">
          <AnimatedCounter to={result.score} />
          <span className="score-total"> / {result.total}</span>
        </div>
        <p className="muted verdikt">{verdikt(result.percentage)}</p>
      </div>
      <div className="cta-row no-print">
        <Link to={`/history/${result.attempt_id}`} className="btn">Shih pergjigjet</Link>
        <Link to="/quiz" className="btn btn-primary">Provo perseri</Link>
        <button className="btn" onClick={handlePrint}>🖨️ Printo Certifikate</button>
        <Link to="/history" className="btn btn-ghost">Historia</Link>
      </div>

      {/* Certifikate (e dukshme vetem ne print) */}
      <div className="certificate print-only">
        <div className="cert-border">
          <div className="cert-header">
            <div className="cert-logo">IQ TESTER</div>
            <div className="cert-subtitle">Certifikate Pjesemarrjeje</div>
          </div>
          <div className="cert-body">
            <p className="cert-intro">Kjo certifikate i jepet</p>
            <h2 className="cert-name">{user?.username || '—'}</h2>
            <p className="cert-text">
              per perfundimin me sukses te testit IQ me skorin
            </p>
            <div className="cert-score">
              <div className="cert-score-num">{result.score} / {result.total}</div>
              <div className="cert-score-pct">{result.percentage}%</div>
            </div>
            <p className="cert-verdikt">{verdikt(result.percentage)}</p>
          </div>
          <div className="cert-footer">
            <div className="cert-date">
              <div className="cert-line"></div>
              <div>{new Date().toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="cert-label-small">Data</div>
            </div>
            <div className="cert-seal">★</div>
            <div className="cert-id">
              <div className="cert-line"></div>
              <div>#{result.attempt_id}</div>
              <div className="cert-label-small">ID e Tentatives</div>
            </div>
          </div>
        </div>
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
