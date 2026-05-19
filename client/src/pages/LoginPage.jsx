import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../toast/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const slowWarn = setTimeout(() => {
      toast.info('Po lidhem me serverin, prisni pak...');
    }, 4000);
    try {
      const user = await login(username.trim(), password);
      clearTimeout(slowWarn);
      toast.success(`Mire se erdhe, ${user.username}!`);
      const to = location.state?.from || '/';
      navigate(to, { replace: true });
    } catch (err) {
      clearTimeout(slowWarn);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-wrap">
      <h2>Hyrja</h2>
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Po hyn...' : 'Hyr'}
        </button>
        <p className="muted">
          Nuk ke llogari? <Link to="/register">Regjistrohu</Link>
        </p>
      </form>
    </section>
  );
}
