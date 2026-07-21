import { useState } from 'react'
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './account.css'

export default function Login() {
  const { user, loading, signIn, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const dest = location.state?.from || '/account'
  if (!loading && user) return <Navigate to={dest} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card auth__card--narrow" onSubmit={onSubmit}>
        <header className="auth__head">
          <span className="auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5M15 12H3" />
            </svg>
          </span>
          <h1>Welcome back</h1>
          <p>Log in to your Renew account.</p>
        </header>

        {!isSupabaseConfigured && (
          <div className="auth__alert auth__alert--warn">
            Supabase isn’t configured. Add your keys to <code>.env</code> to
            enable login.
          </div>
        )}
        {error && <div className="auth__alert auth__alert--error">{error}</div>}

        <label>
          Email Address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password" autoComplete="current-password" required />
        </label>

        <button type="submit" className="btn btn--primary btn--block auth__submit"
          disabled={busy || !isSupabaseConfigured}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>

        <p className="auth__foot">
          Don’t have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </form>
    </div>
  )
}
