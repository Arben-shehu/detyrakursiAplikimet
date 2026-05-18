import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
          {user && <NavLink to="/quiz">Fillo Testin</NavLink>}
          {user && <NavLink to="/history">Historia ime</NavLink>}
          {isAdmin && <NavLink to="/admin/categories">Kategorite</NavLink>}
          {isAdmin && <NavLink to="/admin/questions">Pyetjet</NavLink>}
          {isAdmin && <NavLink to="/admin/users">Perdoruesit</NavLink>}
        </nav>
        <div className="nav-actions">
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
