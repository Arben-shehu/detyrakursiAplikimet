import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../toast/ToastContext';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  async function load() {
    try {
      const d = await api.get('/api/users');
      setItems(d.users);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function doDelete() {
    const { id, username } = confirmDel;
    setConfirmDel(null);
    try {
      await api.del(`/api/users/${id}`);
      toast.success(`Perdoruesi "${username}" u fshi`);
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
        { label: 'Perdoruesit' },
      ]} />
      <h2>Perdoruesit</h2>
      {error && <div className="alert">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Username</th><th>Email</th><th>Roli</th>
            <th>Tentativa</th><th>Krijuar</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}{u.id === me?.id && <span className="muted"> (ti)</span>}</td>
              <td>{u.email}</td>
              <td><span className={`badge ${u.role}`}>{u.role}</span></td>
              <td>{u.attempts_count}</td>
              <td className="muted">{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-danger"
                  disabled={u.id === me?.id}
                  onClick={() => setConfirmDel(u)}
                >
                  Fshi
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={!!confirmDel}
        title="Fshirja e perdoruesit"
        message={confirmDel ? `Te fshish perdoruesin "${confirmDel.username}"? Te gjitha tentativat e tij do te humbasin.` : ''}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </section>
  );
}
