import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import Breadcrumbs from '../components/Breadcrumbs';
import { useToast } from '../toast/ToastContext';

const EMPTY = { id: null, name: '', description: '' };

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  async function load() {
    try {
      const d = await api.get('/api/categories');
      setItems(d.categories);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  function startEdit(c) { setEditing({ id: c.id, name: c.name, description: c.description || '' }); }
  function startNew()   { setEditing(EMPTY); }

  async function save(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = { name: editing.name, description: editing.description };
      if (editing.id) {
        await api.put(`/api/categories/${editing.id}`, body);
        toast.success(`Kategoria "${body.name}" u perditesua`);
      } else {
        await api.post('/api/categories', body);
        toast.success(`Kategoria "${body.name}" u shtua`);
      }
      setEditing(EMPTY);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    const { id, name } = confirmDel;
    setConfirmDel(null);
    try {
      await api.del(`/api/categories/${id}`);
      toast.success(`Kategoria "${name}" u fshi`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <section>
      <Breadcrumbs items={[
        { label: 'Kreu', to: '/' },
        { label: 'Admin' },
        { label: 'Kategorite' },
      ]} />
      <h2>Menaxho Kategorite</h2>
      {error && <div className="alert">{error}</div>}

      <form className="card form-inline" onSubmit={save}>
        <h3>{editing.id ? `Modifiko #${editing.id}` : 'Shto kategori te re'}</h3>
        <label>
          Emri
          <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
        </label>
        <label>
          Pershkrim
          <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        </label>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>{editing.id ? 'Ruaj' : 'Shto'}</button>
          {editing.id && <button type="button" className="btn btn-ghost" onClick={startNew}>Anulo</button>}
        </div>
      </form>

      <table className="table">
        <thead>
          <tr><th>ID</th><th>Emri</th><th>Pershkrimi</th><th>Pyetje</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td className="muted">{c.description}</td>
              <td>{c.question_count}</td>
              <td className="actions">
                <button className="btn btn-ghost" onClick={() => startEdit(c)}>Modifiko</button>
                <button className="btn btn-danger" onClick={() => setConfirmDel(c)}>Fshi</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={!!confirmDel}
        title="Fshirja e kategorise"
        message={confirmDel ? `Te fshish kategorine "${confirmDel.name}"? Te gjitha pyetjet e saj do te fshihen gjithashtu.` : ''}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </section>
  );
}
