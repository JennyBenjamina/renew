import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './account.css'

export default function ResetPassword() {
  // When the user clicks the email link, supabase-js parses the URL and
  // establishes a temporary recovery session, so `user` becomes set here.
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const passwordError =
    password.length > 0 && password.length < 8
      ? 'Password must be at least 8 characters.'
      : ''
  const confirmError =
    confirm.length > 0 && confirm !== password ? 'Passwords do not match.' : ''
  const canSubmit = password.length >= 8 && password === confirm

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSubmit) return
    setBusy(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/account', { replace: true }), 1600)
    } catch (err) {
      setError(err.message || 'Could not update your password.')
      setBusy(false)
    }
  }

  // No recovery session → the link is missing, invalid, or expired.
  if (!loading && !user) {
    return (
      <div className="auth">
        <div className="auth__card auth__card--narrow auth__confirm">
          <span className="auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <h1>Link expired or invalid</h1>
          <p>This password reset link isn’t valid anymore. Request a new one.</p>
          <Link to="/forgot-password" className="btn btn--primary btn--block">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="auth">
        <div className="auth__card auth__card--narrow auth__confirm">
          <span className="auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h1>Password updated</h1>
          <p>Your password has been changed. Taking you to your account…</p>
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
          <h1>Choose a new password</h1>
          <p>Enter and confirm your new password below.</p>
        </header>

        {error && <div className="auth__alert auth__alert--error">{error}</div>}

        <label>
          New Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className={passwordError ? 'is-invalid' : ''}
            aria-invalid={Boolean(passwordError)}
            placeholder="At least 8 characters" autoComplete="new-password" required />
          {passwordError && (
            <span className="auth__field-error">{passwordError}</span>
          )}
        </label>
        <label>
          Confirm New Password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className={confirmError ? 'is-invalid' : ''}
            aria-invalid={Boolean(confirmError)}
            placeholder="Re-enter your password" autoComplete="new-password" required />
          {confirmError && (
            <span className="auth__field-error">{confirmError}</span>
          )}
        </label>

        <button type="submit" className="btn btn--primary btn--block auth__submit"
          disabled={busy || !canSubmit}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
