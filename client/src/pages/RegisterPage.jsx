import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../toast/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password duhet te kete te pakten 6 karaktere');
      toast.warn('Password duhet te kete te pakten 6 karaktere');
      return;
    }
    setBusy(true);
    const infoId = toast.info('Po regjistrohet llogaria...');
    const slowWarn = setTimeout(() => {
      toast.info('Serveri po zgjohet, prit pak (~30s)...');
    }, 4000);
    try {
      const user = await register(username.trim(), email.trim(), password);
      clearTimeout(slowWarn);
      toast.dismiss(infoId);
      toast.success(`Mire se erdhe, ${user.username}! Llogaria u krijua.`);
      navigate('/', { replace: true });
    } catch (err) {
      clearTimeout(slowWarn);
      toast.dismiss(infoId);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-wrap">
      <h2>Regjistrimi</h2>
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password (min 6)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Po regjistrohet...' : 'Regjistrohu'}
        </button>
        <p className="muted">
          Ke nje llogari? <Link to="/login">Hyr</Link>
        </p>
      </form>
    </section>
  );
}
