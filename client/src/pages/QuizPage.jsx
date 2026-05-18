import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import { useToast } from '../toast/ToastContext';

export default function QuizPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [phase, setPhase] = useState('intro');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const finishingRef = useRef(false);

  async function startQuiz() {
    setPhase('loading');
    setError('');
    try {
      const data = await api.post('/api/attempts/start');
      setAttempt(data);
      setAnswers({});
      setCurrent(0);
      setPhase('in_progress');
    } catch (err) {
      setError(err.message);
      setPhase('intro');
    }
  }

  async function selectOption(qId, oId) {
    setAnswers((prev) => ({ ...prev, [qId]: oId }));
    try {
      await api.post(`/api/attempts/${attempt.attempt_id}/answer`, {
        question_id: qId,
        option_id: oId,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 800);
    } catch (err) {
      toast.error('S\'u ruajt pergjigja: ' + err.message);
    }
  }

  async function finishQuiz() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase('submitting');
    try {
      const result = await api.post(`/api/attempts/${attempt.attempt_id}/finish`);
      navigate(`/result/${result.attempt_id}`, { state: result, replace: true });
    } catch (err) {
      setError(err.message);
      setPhase('in_progress');
      finishingRef.current = false;
    }
  }

  // Keyboard shortcuts gjate testit: shigjetat per navigim, 1-4 zgjedh opsion, Enter mbaron
  useEffect(() => {
    if (phase !== 'in_progress' || !attempt) return;

    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const total = attempt.questions.length;
      if (e.key === 'ArrowRight') {
        if (current < total - 1) setCurrent((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        if (current > 0) setCurrent((i) => i - 1);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const q = attempt.questions[current];
        if (q.options[idx]) {
          selectOption(q.id, q.options[idx].id);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, attempt, current]);

  if (phase === 'intro') {
    return (
      <section className="quiz-intro">
        <h2>Gati per testin?</h2>
        <p>20 pyetje &middot; 15 minuta &middot; pa pause</p>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-primary" onClick={startQuiz}>Fillo</button>
      </section>
    );
  }

  if (phase === 'loading') {
    return <div className="loading">Po pergatitet testi...</div>;
  }

  if (!attempt) return null;

  const q = attempt.questions[current];
  const answered = Object.keys(answers).length;
  const total = attempt.questions.length;

  return (
    <section className="quiz">
      <div className="quiz-header">
        <div className="progress">
          <span>
            {answered} / {total} te pergjigjura
            {savedFlash && <span className="saved-tag">✓ Ruajtur</span>}
          </span>
          <div className="bar"><div className="fill" style={{ width: `${(answered / total) * 100}%` }} /></div>
        </div>
        <Timer
          startedAt={attempt.started_at}
          limitMinutes={attempt.time_limit_minutes}
          onTimeUp={finishQuiz}
        />
      </div>

      <div className="kbd-hint muted">
        Tipa shpejt: <kbd>←</kbd> <kbd>→</kbd> levizja · <kbd>1</kbd>–<kbd>4</kbd> zgjedh opsionin
      </div>

      <QuestionCard
        index={current}
        total={total}
        question={q}
        selectedOptionId={answers[q.id]}
        onSelect={(oid) => selectOption(q.id, oid)}
      />

      <div className="quiz-nav">
        <button className="btn btn-ghost" disabled={current === 0} onClick={() => setCurrent((i) => i - 1)}>
          &larr; Prapa
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {current < total - 1 && (
            <button className="btn" onClick={() => setCurrent((i) => i + 1)}>Tjetra &rarr;</button>
          )}
          <button
            className="btn btn-primary"
            onClick={finishQuiz}
            disabled={phase === 'submitting'}
          >
            {phase === 'submitting' ? 'Po ruhet...' : 'Mbaro Testin'}
          </button>
        </div>
      </div>

      <div className="quiz-grid">
        {attempt.questions.map((qq, i) => (
          <button
            key={qq.id}
            className={`grid-cell ${i === current ? 'active' : ''} ${answers[qq.id] ? 'done' : ''}`}
            onClick={() => setCurrent(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
