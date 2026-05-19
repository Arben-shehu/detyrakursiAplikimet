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
  const [confirmReset, setConfirmReset] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [resetting, setResetting] = useState(false);

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

  async function doResetPassword() {
    const target = confirmReset;
    setConfirmReset(null);
    setResetting(true);
    try {
      const r = await api.post(`/api/users/${target.id}/reset-password`);
      setResetResult({ username: r.username, tempPassword: r.temp_password });
      toast.success(`Password u resetua per "${r.username}"`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  }

  function copyTempPassword() {
    if (!resetResult) return;
    navigator.clipboard.writeText(resetResult.tempPassword)
      .then(() => toast.success('Password i kopjuar ne clipboard'))
      .catch(() => toast.error('Nuk u kopjua'));
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
              <td className="actions">
                <button
                  className="btn btn-ghost"
                  disabled={u.id === me?.id || resetting}
                  onClick={() => setConfirmReset(u)}
                  title="Resetoj password-in e ketij perdoruesi"
                >
                  🔑 Reset
                </button>
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

      <Modal
        open={!!confirmReset}
        title="Reset password"
        message={confirmReset ? `Te resetosh password-in per "${confirmReset.username}"? Do gjenerohet nje password i ri i perkohshem.` : ''}
        onConfirm={doResetPassword}
        onCancel={() => setConfirmReset(null)}
      />

      {resetResult && (
        <div className="modal-backdrop" onClick={() => setResetResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔑 Password i ri</h3>
            <p className="modal-msg">
              Password u resetua per <b>{resetResult.username}</b>.
              <br />
              Kopjoje dhe jepia perdoruesit. <b>Nuk do shfaqet me</b> pas ketij momenti.
            </p>
            <div className="temp-password-box">
              <code>{resetResult.tempPassword}</code>
              <button className="btn" onClick={copyTempPassword}>📋 Kopjo</button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setResetResult(null)}>Mbaroi</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
