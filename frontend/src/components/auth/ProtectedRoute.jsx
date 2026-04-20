// frontend/src/components/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector(s => s.auth);
  if (!initialized) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
