import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  return (
    <section className="home">
      <h1>Testi IQ</h1>
      <p className="lead">
        Mire se vini ne IQ Tester &mdash; nje pyetesor i shkurter qe mat aftesite tuaja logjike,
        matematikore dhe gjuhesore.
      </p>

      <div className="home-card">
        <h3>Si funksionon?</h3>
        <ul>
          <li>Te jepen <b>20 pyetje</b> te zgjedhura ne menyre random</li>
          <li>Keni <b>15 minuta</b> kohe per ti perfunduar</li>
          <li>Ne fund shihni rezultatin dhe pergjigjet e sakta</li>
        </ul>
      </div>

      {!user && (
        <div className="cta-row">
          <Link to="/login" className="btn">Hyr</Link>
          <Link to="/register" className="btn btn-primary">Regjistrohu</Link>
        </div>
      )}
      {user && !isAdmin && (
        <div className="cta-row">
          <Link to="/quiz" className="btn btn-primary">Fillo Testin</Link>
          <Link to="/practice" className="btn">Mode Praktike</Link>
          <Link to="/leaderboard" className="btn btn-ghost">🏆 Leaderboard</Link>
          <Link to="/history" className="btn btn-ghost">Historia</Link>
        </div>
      )}
      {isAdmin && (
        <div className="cta-row">
          <Link to="/admin/questions" className="btn btn-primary">Menaxho Pyetjet</Link>
          <Link to="/admin/categories" className="btn">Menaxho Kategorite</Link>
        </div>
      )}
    </section>
  );
}
