import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import BenchCard from './BenchCard.jsx'
import AuthTabs from './AuthTabs.jsx'
import './account.css'

export default function Login() {
  const { user, loading, isApproved, signIn, isSupabaseConfigured } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Pages that need an account (checkout, account pages) send the shopper here
  // with state.from, so they land back there after signing in.
  const from = location.state?.from || null
  const dest = from || '/products'
  if (!loading && user) {
    return <Navigate to={isApproved ? dest : '/account/pending'} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // The redirect above sends them on once their profile has loaded
      // (approved → where they were going; pending → the review notice).
      await signIn(email.trim(), password)
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
    <BenchCard as="form" pill="Account" onSubmit={onSubmit} noValidate>
      <AuthTabs active="login" from={from} />
      <h1 className="bench__title">Log in to Renew.</h1>
      <p className="bench__lede">
        {from === '/checkout'
          ? 'Sign in or create an account to check out. Your cart is saved.'
          : 'An account is required to check out. Log in to see your orders and check out faster.'}
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
        New to Renew?{' '}
        <Link to="/signup" state={from ? { from } : undefined}>Create an account</Link>
      </p>
    </BenchCard>
  )
}
