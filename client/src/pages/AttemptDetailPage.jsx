import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function AttemptDetailPage() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/attempts/${attemptId}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <div className="loading">Po ngarkohet...</div>;
  if (error) return <div className="alert">{error}</div>;
  if (!data) return null;

  const { attempt, details } = data;

  return (
    <section>
      <Link to="/history" className="back-link">&larr; Kthehu te historia</Link>
      <h2>Tentativa #{attempt.id}</h2>
      <p className="muted">
        Filluar: {fmt(attempt.started_at)} &middot; Mbaruar: {fmt(attempt.finished_at)} &middot;
        Skori: <b>{attempt.score ?? '—'} / {attempt.total_questions}</b>
      </p>

      <ol className="review">
        {details.map((d, i) => (
          <li key={d.question_id} className={`review-item ${d.is_correct === true ? 'ok' : d.is_correct === false ? 'bad' : ''}`}>
            <div className="review-q">
              <span className="num">{i + 1}.</span> {d.question_text}
              {d.category_name && <span className="qcat">{d.category_name}</span>}
            </div>
            <div className="review-row">
              <span className="lbl">Pergjigja juaj:</span>
              <span>{d.selected_text || <em className="muted">e palidhur</em>}</span>
            </div>
            {!d.is_correct && (
              <div className="review-row">
                <span className="lbl">E sakta:</span>
                <span>{d.correct_text || '—'}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}
