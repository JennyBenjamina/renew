import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './account.css'

const empty = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_postal: '',
  address_country: '',
}

export default function Signup() {
  const { user, loading, signUp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null) // null | 'confirm'

  if (!loading && user) return <Navigate to="/account" replace />

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  // Live, per-field validation (only shown once the user has typed something).
  const passwordError =
    form.password.length > 0 && form.password.length < 8
      ? 'Password must be at least 8 characters.'
      : ''
  const confirmError =
    form.confirm.length > 0 && form.confirm !== form.password
      ? 'Passwords do not match.'
      : ''
  const canSubmit =
    form.password.length >= 8 && form.password === form.confirm

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSubmit) return // inline messages already explain what's wrong

    setBusy(true)
    try {
      const { needsConfirmation } = await signUp({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_street: form.address_street.trim(),
        address_city: form.address_city.trim(),
        address_state: form.address_state.trim(),
        address_postal: form.address_postal.trim(),
        address_country: form.address_country.trim(),
      })
      if (needsConfirmation) setDone('confirm')
      else navigate('/account', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-up failed.')
    } finally {
      setBusy(false)
    }
  }

  if (done === 'confirm') {
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
            We sent a confirmation link to <strong>{form.email}</strong>. Click it
            to activate your account, then log in.
          </p>
          <Link to="/login" className="btn btn--primary btn--block">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={onSubmit}>
        <header className="auth__head">
          <span className="auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
          </span>
          <h1>Create Account</h1>
          <p>Join Renew to access premium research compounds.</p>
        </header>

        {!isSupabaseConfigured && (
          <div className="auth__alert auth__alert--warn">
            Supabase isn’t configured. Add your keys to <code>.env</code> to
            enable sign-up.
          </div>
        )}
        {error && <div className="auth__alert auth__alert--error">{error}</div>}

        <section className="auth__section">
          <h2 className="auth__section-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            Account Details
          </h2>
          <div className="auth__grid">
            <label>
              Full Name
              <input value={form.full_name} onChange={set('full_name')}
                placeholder="Enter your full name" required />
            </label>
            <label>
              Email Address
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="your.email@example.com" autoComplete="email" required />
            </label>
            <label>
              Phone Number <span className="auth__optional">Optional</span>
              <input value={form.phone} onChange={set('phone')}
                placeholder="(555) 123-4567" autoComplete="tel" />
            </label>
            <span className="auth__spacer" aria-hidden="true" />
            <label>
              Password
              <input type="password" value={form.password} onChange={set('password')}
                className={passwordError ? 'is-invalid' : ''}
                aria-invalid={Boolean(passwordError)}
                placeholder="At least 8 characters" autoComplete="new-password" required />
              {passwordError && (
                <span className="auth__field-error">{passwordError}</span>
              )}
            </label>
            <label>
              Confirm Password
              <input type="password" value={form.confirm} onChange={set('confirm')}
                className={confirmError ? 'is-invalid' : ''}
                aria-invalid={Boolean(confirmError)}
                placeholder="Re-enter your password" autoComplete="new-password" required />
              {confirmError && (
                <span className="auth__field-error">{confirmError}</span>
              )}
            </label>
          </div>
        </section>

        <section className="auth__section">
          <h2 className="auth__section-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Shipping Address
          </h2>
          <div className="auth__grid">
            <label className="auth__full">
              Street Address
              <input value={form.address_street} onChange={set('address_street')}
                placeholder="123 Science Blvd, Suite 400" autoComplete="address-line1" />
            </label>
            <label>
              City
              <input value={form.address_city} onChange={set('address_city')}
                placeholder="San Diego" autoComplete="address-level2" />
            </label>
            <label>
              State / Province
              <input value={form.address_state} onChange={set('address_state')}
                placeholder="CA" autoComplete="address-level1" />
            </label>
            <label>
              Postal / Zip Code
              <input value={form.address_postal} onChange={set('address_postal')}
                placeholder="92101" autoComplete="postal-code" />
            </label>
            <label>
              Country
              <input value={form.address_country} onChange={set('address_country')}
                placeholder="United States" autoComplete="country-name" />
            </label>
          </div>
        </section>

        <div className="auth__consent">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>
            By creating an account, you verify that you will use products strictly
            for research purposes and agree to our{' '}
            <Link to="/research-use-terms">Terms of Service</Link>.
          </span>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block auth__submit"
          disabled={busy || !isSupabaseConfigured || !canSubmit}
        >
          {busy ? 'Creating account…' : 'Create Account'}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        <p className="auth__foot">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </div>
  )
}
