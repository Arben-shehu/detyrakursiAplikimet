import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [ddOpen, setDdOpen] = useState(false);
  const ddRef = useRef(null);

  // Mbyll dropdown-in kur klikon jashte
  useEffect(() => {
    if (!ddOpen) return;
    function onClick(e) {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [ddOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">IQ Tester</Link>
        <nav className="nav-links">
          <NavLink to="/" end>Kreu</NavLink>
          <NavLink to="/leaderboard">🏆</NavLink>
          {user && <NavLink to="/quiz">Test</NavLink>}
          {user && <NavLink to="/practice">Praktike</NavLink>}
          {user && <NavLink to="/profile">Profili</NavLink>}
          {user && <NavLink to="/history">Historia</NavLink>}
        </nav>
        {isAdmin && (
          <div className={`nav-dropdown ${ddOpen ? 'open' : ''}`} ref={ddRef}>
            <button
              type="button"
              className="nav-dropdown-trigger"
              onClick={() => setDdOpen((o) => !o)}
              aria-expanded={ddOpen}
            >
              Admin ▾
            </button>
            <div className="nav-dropdown-menu">
              <NavLink to="/admin/analytics" onClick={() => setDdOpen(false)}>📊 Analytics</NavLink>
              <NavLink to="/admin/categories" onClick={() => setDdOpen(false)}>📁 Kategorite</NavLink>
              <NavLink to="/admin/questions" onClick={() => setDdOpen(false)}>❓ Pyetjet</NavLink>
              <NavLink to="/admin/users" onClick={() => setDdOpen(false)}>👥 Perdoruesit</NavLink>
            </div>
          </div>
        )}
        <div className="nav-actions">
          <ThemeToggle />
          {user ? (
            <>
              <span className="who">Pershendetje, <b>{user.username}</b></span>
              <button className="btn btn-ghost" onClick={handleLogout}>Dil</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Hyr</Link>
              <Link to="/register" className="btn">Regjistrohu</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
