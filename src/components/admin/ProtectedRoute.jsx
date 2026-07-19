import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/** Guards admin routes: redirects to the login page when not signed in. */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="admin-loading">Checking access…</div>
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}
