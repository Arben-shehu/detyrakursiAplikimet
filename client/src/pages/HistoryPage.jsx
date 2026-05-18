import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/attempts/me')
      .then((d) => setItems(d.attempts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Po ngarkohet...</div>;
  if (error) return <div className="alert">{error}</div>;

  return (
    <section>
      <h2>Historia juaj</h2>
      {items.length === 0 ? (
        <p className="muted">Akoma nuk keni bere asnje tentative. <Link to="/quiz">Filloni testin</Link>.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Filluar</th>
              <th>Mbaruar</th>
              <th>Skori</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{fmt(a.started_at)}</td>
                <td>{a.finished_at ? fmt(a.finished_at) : <em>jo i mbaruar</em>}</td>
                <td>{a.score != null ? `${a.score}/${a.total_questions}` : '—'}</td>
                <td><Link to={`/history/${a.id}`}>Detaje</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}
