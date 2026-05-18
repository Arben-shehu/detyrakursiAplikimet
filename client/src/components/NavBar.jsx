import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

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
          <NavLink to="/leaderboard">🏆 Top 10</NavLink>
          {user && <NavLink to="/quiz">Fillo Testin</NavLink>}
          {user && <NavLink to="/practice">Praktike</NavLink>}
          {user && <NavLink to="/profile">Profili</NavLink>}
          {user && <NavLink to="/history">Historia</NavLink>}
          {isAdmin && <NavLink to="/admin/analytics">Analytics</NavLink>}
          {isAdmin && <NavLink to="/admin/categories">Kategorite</NavLink>}
          {isAdmin && <NavLink to="/admin/questions">Pyetjet</NavLink>}
          {isAdmin && <NavLink to="/admin/users">Perdoruesit</NavLink>}
        </nav>
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
