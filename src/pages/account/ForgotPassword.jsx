import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './account.css'

export default function ForgotPassword() {
  const { resetPassword, isSupabaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send the reset email.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="auth">
        <div className="auth__card auth__card--narrow auth__confirm">
          <span className="auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </span>
          <h1>Check your email</h1>
          <p>
            If an account exists for <strong>{email}</strong>, we’ve sent a link
            to reset your password. It expires after a short while.
          </p>
          <Link to="/login" className="btn btn--primary btn--block">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      <form className="auth__card auth__card--narrow" onSubmit={onSubmit}>
        <header className="auth__head">
          <span className="auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <h1>Reset your password</h1>
          <p>Enter your account email and we’ll send you a reset link.</p>
        </header>

        {!isSupabaseConfigured && (
          <div className="auth__alert auth__alert--warn">
            Supabase isn’t configured. Add your keys to <code>.env</code> to
            enable password reset.
          </div>
        )}
        {error && <div className="auth__alert auth__alert--error">{error}</div>}

        <label>
          Email Address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com" autoComplete="email" required />
        </label>

        <button type="submit" className="btn btn--primary btn--block auth__submit"
          disabled={busy || !isSupabaseConfigured}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>

        <p className="auth__foot">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  )
}
