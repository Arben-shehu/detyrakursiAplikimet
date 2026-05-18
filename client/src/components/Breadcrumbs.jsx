import { Link } from 'react-router-dom';

// Breadcrumbs i thjeshte: jep nje array [{ label, to? }]. Elementi i fundit nuk eshte link.

export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="bc-item">
            {it.to && !last ? (
              <Link to={it.to}>{it.label}</Link>
            ) : (
              <span className={last ? 'bc-current' : ''}>{it.label}</span>
            )}
            {!last && <span className="bc-sep">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
