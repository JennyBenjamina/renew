import { useState } from 'react'
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import BenchCard from './BenchCard.jsx'
import './account.css'

export default function Login() {
  const { user, loading, signIn, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Restricted pages send unapproved accounts on to the pending notice.
  const dest = location.state?.from || '/products'
  if (!loading && user) return <Navigate to={dest} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate(dest, { replace: true })
    } catch (err) {
      setError(
        /email not confirmed/i.test(err.message || '')
          ? 'Confirm your email first: click the link we sent when you registered.'
          : err.message || 'Sign-in failed.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <BenchCard as="form" pill="Members only" onSubmit={onSubmit} noValidate>
      <h1 className="bench__title">Log in to Renew.</h1>
      <p className="bench__lede">
        The catalog is available to approved researcher accounts only.
      </p>

      {!isSupabaseConfigured && (
        <div className="auth__alert auth__alert--warn">
          Supabase isn’t configured. Add your keys to <code>.env</code> to enable login.
        </div>
      )}
      {error && <div className="auth__alert auth__alert--error" role="alert">{error}</div>}

      <div className="bench__field">
        <label htmlFor="login-email" className="bench__label">Email</label>
        <input id="login-email" className="bench__input" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="lab@university.edu" autoComplete="email" required />
      </div>
      <div className="bench__field">
        <label htmlFor="login-password" className="bench__label">Password</label>
        <input id="login-password" className="bench__input" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password" required />
        <Link to="/forgot-password" className="bench__help bench__help--link">
          Forgot your password?
        </Link>
      </div>

      <button type="submit" className="bench__submit"
        disabled={busy || !isSupabaseConfigured || !email || !password}>
        {busy ? 'Logging in…' : 'Log in'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="bench__foot">
        New to Renew? <Link to="/signup">Create a researcher account</Link>
      </p>
    </BenchCard>
  )
}
