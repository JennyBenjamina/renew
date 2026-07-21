import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/** Guards routes by auth state.
 *  - requireAdmin: also requires the user's profile role to be 'admin'.
 *  Non-admins hitting an admin route are sent to the storefront; logged-out
 *  users are sent to the appropriate login page. */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="admin-loading">Checking access…</div>
  }
  if (!user) {
    const to = requireAdmin ? '/admin/login' : '/login'
    return <Navigate to={to} replace state={{ from: location.pathname }} />
  }
  if (requireAdmin && !isAdmin) {
    // Signed in but not an admin — no access to the dashboard.
    return <Navigate to="/" replace />
  }
  return children
}
