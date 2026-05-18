import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import QuestionCard from '../components/QuestionCard';

// Practice mode: pa timer, sheh pergjigjet menjehere pas zgjedhjes.
// 10 pyetje random. Nuk shfaqet ne leaderboard.

export default function PracticePage() {
  const [phase, setPhase] = useState('intro');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState({}); // { [qId]: { selectedId, correctId, isCorrect } }

  async function startPractice() {
    setPhase('loading');
    setError('');
    try {
      const data = await api.post('/api/attempts/start', { mode: 'practice' });
      setAttempt(data);
      setCurrent(0);
      setFeedback({});
      setPhase('in_progress');
    } catch (err) {
      setError(err.message);
      setPhase('intro');
    }
  }

  async function pickOption(qId, oId) {
    if (feedback[qId]) return;
    try {
      const r = await api.post(`/api/attempts/${attempt.attempt_id}/answer`, {
        question_id: qId,
        option_id: oId,
      });
      setFeedback((prev) => ({
        ...prev,
        [qId]: {
          selectedId: oId,
          correctId: r.correct_option_id,
          isCorrect: r.is_correct,
        },
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function finish() {
    try {
      await api.post(`/api/attempts/${attempt.attempt_id}/finish`);
      setPhase('done');
    } catch (err) {
      setError(err.message);
    }
  }

  if (phase === 'intro') {
    return (
      <section className="quiz-intro">
        <h2>Mode Praktike</h2>
        <p className="muted">
          10 pyetje · pa kohë limit · sheh pergjigjen e sakte menjëherë.
          <br />Nuk shfaqet ne leaderboard.
        </p>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-primary" onClick={startPractice}>Fillo Praktiken</button>
      </section>
    );
  }

  if (phase === 'loading') return <div className="loading">Po pergatitet...</div>;

  if (phase === 'done') {
    const correct = Object.values(feedback).filter((f) => f.isCorrect).length;
    return (
      <section className="quiz-intro">
        <h2>Mbarove praktiken!</h2>
        <p className="muted">Te sakta: <b>{correct} / {attempt.questions.length}</b></p>
        <div className="cta-row">
          <button className="btn btn-primary" onClick={() => setPhase('intro')}>Provo perseri</button>
          <Link to="/" className="btn">Kreu</Link>
        </div>
      </section>
    );
  }

  if (!attempt) return null;
  const q = attempt.questions[current];
  const fb = feedback[q.id];
  const total = attempt.questions.length;
  const answered = Object.keys(feedback).length;

  return (
    <section className="quiz">
      <div className="quiz-header">
        <div className="progress">
          <span>Praktike · {answered} / {total} te bera</span>
          <div className="bar">
            <div className="fill" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        </div>
        <span className="badge">PA TIMER</span>
      </div>

      <article className="qcard">
        <div className="qcard-head">
          <span className="qbadge">Pyetja {current + 1} / {total}</span>
          {q.category_name && <span className="qcat">{q.category_name}</span>}
        </div>
        <h3 className="qtext">{q.text}</h3>
        <ul className="qopts">
          {q.options.map((o) => {
            let cls = '';
            if (fb) {
              if (o.id === fb.correctId) cls = 'qopt-correct';
              else if (o.id === fb.selectedId) cls = 'qopt-wrong';
            }
            return (
              <li key={o.id}>
                <label className={`qopt ${cls}`}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={fb?.selectedId === o.id}
                    disabled={!!fb}
                    onChange={() => pickOption(q.id, o.id)}
                  />
                  <span>{o.text}</span>
                  {fb && o.id === fb.correctId && <span className="ok-tag">✓ E sakte</span>}
                </label>
              </li>
            );
          })}
        </ul>
        {fb && (
          <div className={`fb-row ${fb.isCorrect ? 'fb-ok' : 'fb-bad'}`}>
            {fb.isCorrect ? 'Bravo! 🎉' : 'Pergjigja e sakte eshte e theksuar me jeshil.'}
          </div>
        )}
      </article>

      <div className="quiz-nav">
        <button className="btn btn-ghost" disabled={current === 0} onClick={() => setCurrent((i) => i - 1)}>
          &larr; Prapa
        </button>
        {current < total - 1 ? (
          <button className="btn" onClick={() => setCurrent((i) => i + 1)}>Tjetra &rarr;</button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>Mbaro</button>
        )}
      </div>
    </section>
  );
}
