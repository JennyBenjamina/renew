import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/Logo.jsx'
import './admin.css'

export default function AdminLogin() {
  const { user, loading, signIn, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in → go straight to the dashboard.
  if (!loading && user) return <Navigate to="/admin" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adminlogin">
      <form className="adminlogin__card" onSubmit={onSubmit}>
        <div className="adminlogin__brand">
          <Logo />
          <span className="adminlogin__tag">Admin</span>
        </div>
        <h1>Sign in</h1>
        <p className="adminlogin__sub">
          Manage the Renew product catalog. Authorized admins only.
        </p>

        {!isSupabaseConfigured && (
          <div className="admin-alert admin-alert--warn">
            Supabase isn’t configured. Add your keys to <code>.env</code> and
            restart the dev server to enable admin login.
          </div>
        )}

        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@renew.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={busy || !isSupabaseConfigured}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <Link to="/" className="adminlogin__back">
          ← Back to store
        </Link>
      </form>
    </div>
  )
}
