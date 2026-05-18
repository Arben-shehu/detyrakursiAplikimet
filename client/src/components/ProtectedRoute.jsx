import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="loading">Po ngarkohet...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
