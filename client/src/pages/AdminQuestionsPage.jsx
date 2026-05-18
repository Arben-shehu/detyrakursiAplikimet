import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import Breadcrumbs from '../components/Breadcrumbs';
import { useToast } from '../toast/ToastContext';

const EMPTY_OPT = () => ({ text: '', is_correct: false });
const EMPTY_Q = () => ({
  id: null,
  category_id: '',
  text: '',
  difficulty: 1,
  options: [EMPTY_OPT(), EMPTY_OPT(), EMPTY_OPT(), EMPTY_OPT()],
});

const PAGE_SIZE = 10;

export default function AdminQuestionsPage() {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(EMPTY_Q());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    try {
      const [qs, cs] = await Promise.all([
        api.get('/api/questions'),
        api.get('/api/categories'),
      ]);
      setQuestions(qs.questions);
      setCategories(cs.categories);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  function startEdit(q) {
    setEditing({
      id: q.id,
      category_id: q.category_id,
      text: q.text,
      difficulty: q.difficulty,
      options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
    });
  }
  function startNew() { setEditing(EMPTY_Q()); }

  function updateOption(i, patch) {
    setEditing((prev) => ({
      ...prev,
      options: prev.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    }));
  }

  function setCorrect(i) {
    setEditing((prev) => ({
      ...prev,
      options: prev.options.map((o, idx) => ({ ...o, is_correct: idx === i })),
    }));
  }

  function addOption() {
    setEditing((prev) => ({ ...prev, options: [...prev.options, EMPTY_OPT()] }));
  }
  function removeOption(i) {
    setEditing((prev) => ({ ...prev, options: prev.options.filter((_, idx) => idx !== i) }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!editing.options.some((o) => o.is_correct)) {
      toast.error('Zgjidh nje opsion si te sakte');
      return;
    }
    setBusy(true);
    try {
      const body = {
        category_id: Number(editing.category_id),
        text: editing.text,
        difficulty: Number(editing.difficulty) || 1,
        options: editing.options.map((o) => ({ text: o.text, is_correct: !!o.is_correct })),
      };
      if (editing.id) {
        await api.put(`/api/questions/${editing.id}`, body);
        toast.success(`Pyetja u perditesua`);
      } else {
        await api.post('/api/questions', body);
        toast.success(`Pyetja u shtua`);
      }
      setEditing(EMPTY_Q());
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    const id = confirmDel.id;
    setConfirmDel(null);
    try {
      await api.del(`/api/questions/${id}`);
      toast.success('Pyetja u fshi');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  // Filter + paginate
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (categoryFilter && String(q.category_id) !== String(categoryFilter)) return false;
      if (s && !q.text.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [questions, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section>
      <Breadcrumbs items={[
        { label: 'Kreu', to: '/' },
        { label: 'Admin' },
        { label: 'Pyetjet' },
      ]} />
      <h2>Menaxho Pyetjet</h2>
      {error && <div className="alert">{error}</div>}

      <form className="card form" onSubmit={save}>
        <h3>{editing.id ? `Modifiko pyetjen #${editing.id}` : 'Shto pyetje te re'}</h3>
        <label>
          Kategoria
          <select
            value={editing.category_id}
            onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
            required
          >
            <option value="">— zgjidh —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          Pyetja
          <textarea
            rows={2}
            value={editing.text}
            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
            required
          />
        </label>
        <label>
          Veshtiresi (1..5)
          <input
            type="number"
            min={1}
            max={5}
            value={editing.difficulty}
            onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
          />
        </label>

        <fieldset className="opts-edit">
          <legend>Opsionet (zgjidh nje si te sakte)</legend>
          {editing.options.map((o, i) => (
            <div key={i} className="opt-row">
              <input
                type="radio"
                name="correct"
                checked={!!o.is_correct}
                onChange={() => setCorrect(i)}
              />
              <input
                className="opt-text"
                placeholder={`Opsioni ${i + 1}`}
                value={o.text}
                onChange={(e) => updateOption(i, { text: e.target.value })}
                required
              />
              <button type="button" className="btn btn-ghost" onClick={() => removeOption(i)} disabled={editing.options.length <= 2}>
                Hiq
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={addOption}>+ Shto opsion</button>
        </fieldset>

        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>{editing.id ? 'Ruaj ndryshimet' : 'Shto pyetjen'}</button>
          {editing.id && <button type="button" className="btn btn-ghost" onClick={startNew}>Anulo</button>}
        </div>
      </form>

      <h3>Lista e pyetjeve ({filtered.length} / {questions.length})</h3>
      <div className="filter-row">
        <input
          type="search"
          placeholder="🔍 Kerko ne pyetje..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">Te gjitha kategorite</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <ul className="qlist">
        {paged.map((q) => (
          <li key={q.id} className="qlist-item">
            <div className="qlist-head">
              <span className="qcat">{q.category_name}</span>
              <span className="muted">#{q.id}</span>
            </div>
            <div className="qlist-text">{q.text}</div>
            <ul className="qlist-opts">
              {q.options.map((o) => (
                <li key={o.id} className={o.is_correct ? 'is-correct' : ''}>
                  {o.is_correct ? '✓ ' : '• '}{o.text}
                </li>
              ))}
            </ul>
            <div className="qlist-actions">
              <button className="btn btn-ghost" onClick={() => startEdit(q)}>Modifiko</button>
              <button className="btn btn-danger" onClick={() => setConfirmDel(q)}>Fshi</button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            &larr; Prapa
          </button>
          <span className="page-info">Faqja {currentPage} / {totalPages}</span>
          <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Tjetra &rarr;
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Asnje pyetje s'perputhet</h3>
          <p className="muted">Provo te ndryshosh kerkimin ose filterin.</p>
        </div>
      )}

      <Modal
        open={!!confirmDel}
        title="Fshirja e pyetjes"
        message={confirmDel ? `Te fshish pyetjen #${confirmDel.id}?` : ''}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </section>
  );
}
