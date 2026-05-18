import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="not-found-icon">🤔</div>
      <h1 className="not-found-code">404</h1>
      <h2>Faqja nuk u gjet</h2>
      <p className="muted">URL-ja qe kerkove nuk ekziston ne kete sit.</p>
      <div className="cta-row">
        <Link to="/" className="btn btn-primary">Kthehu te Kreu</Link>
        <Link to="/leaderboard" className="btn">🏆 Shih Leaderboard</Link>
      </div>
    </section>
  );
}
