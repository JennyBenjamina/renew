import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { TERMS_VERSION } from '../../lib/compliance.js'
import { ATTESTATIONS, validateRegistration } from '../../lib/researcher.jsx'
import BenchCard from './BenchCard.jsx'
import './account.css'

const empty = {
  email: '',
  institution: '',
  password: '',
  attest_age_21: false,
  attest_researcher: false,
  attest_research_only: false,
  attest_terms: false,
}

const termsLabel = (
  <>
    I agree to the Renew <Link to="/terms-of-service">Terms of Service</Link>,{' '}
    <Link to="/research-use-terms">Research Use Terms</Link>,{' '}
    <Link to="/privacy-policy">Privacy Policy</Link>, and applicable compliance
    requirements.
  </>
)

export default function Signup() {
  const { user, loading, signUp, isSupabaseConfigured } = useAuth()
  const [form, setForm] = useState(empty)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [doneEmail, setDoneEmail] = useState(null)

  // Straight after registering: ask them to confirm their email.
  if (doneEmail) {
    return (
      <BenchCard pill="Almost done">
        <div className="bench__notice" role="status">
          <h1 className="bench__title">Check your email.</h1>
          <p className="bench__lede">
            We sent a confirmation link to <strong>{doneEmail}</strong>. Click it,
            then log in. You can keep shopping in the meantime.
          </p>
        </div>
        <p className="bench__foot">
          <Link to="/products">Continue shopping</Link> · <Link to="/login">Log in</Link>
        </p>
      </BenchCard>
    )
  }
  if (!loading && user) return <Navigate to="/products" replace />

  const errors = validateRegistration(form)
  const show = (f) => (submitted || touched[f]) && errors[f]
  const setText = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))
  const blur = (f) => () => setTouched((t) => ({ ...t, [f]: true }))
  const toggle = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.checked }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitted(true)
    if (Object.keys(errors).length) return

    setBusy(true)
    try {
      const email = form.email.trim().toLowerCase()
      await signUp({
        email,
        password: form.password,
        institution: form.institution.trim(),
        attest_age_21: true,
        attest_researcher: true,
        attest_research_only: true,
        attest_terms: true,
        terms_version: TERMS_VERSION,
      })
      setDoneEmail(email)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BenchCard as="form" pill="21+ · Lab use" onSubmit={onSubmit} noValidate>
      <h1 className="bench__title">Create your account.</h1>
      <p className="bench__lede">
        An account is optional. It saves your address and lets you see your
        order history. You can also check out as a guest.
      </p>

      {!isSupabaseConfigured && (
        <div className="auth__alert auth__alert--warn">
          Supabase isn’t configured. Add your keys to <code>.env</code> to enable sign-up.
        </div>
      )}
      {error && <div className="auth__alert auth__alert--error" role="alert">{error}</div>}

      <div className="bench__field">
        <label htmlFor="signup-email" className="bench__label">Email</label>
        <input id="signup-email" className={`bench__input ${show('email') ? 'is-invalid' : ''}`}
          type="email" value={form.email} onChange={setText('email')} onBlur={blur('email')}
          placeholder="you@example.com" autoComplete="email" required
          aria-invalid={Boolean(show('email'))} aria-describedby="signup-email-help" />
        {show('email') && <span className="bench__error">{errors.email}</span>}
        <span id="signup-email-help" className="bench__help">
          A confirmation link will be sent to this address. The account can’t be
          used until it’s verified.
        </span>
      </div>

      <div className="bench__field">
        <label htmlFor="signup-institution" className="bench__label">
          Business / institution <span className="bench__help">(optional)</span>
        </label>
        <input id="signup-institution"
          className={`bench__input ${show('institution') ? 'is-invalid' : ''}`}
          value={form.institution} onChange={setText('institution')} onBlur={blur('institution')}
          placeholder="e.g. University of Nevada, Las Vegas — School of Life Sciences"
          autoComplete="organization"
          aria-invalid={Boolean(show('institution'))} />
        {show('institution') && <span className="bench__error">{errors.institution}</span>}
      </div>

      <div className="bench__field">
        <label htmlFor="signup-password" className="bench__label">Password</label>
        <input id="signup-password" className={`bench__input ${show('password') ? 'is-invalid' : ''}`}
          type="password" value={form.password} onChange={setText('password')} onBlur={blur('password')}
          placeholder="At least 8 characters" autoComplete="new-password" required
          aria-invalid={Boolean(show('password'))} />
        {show('password') && <span className="bench__error">{errors.password}</span>}
      </div>

      <fieldset className="bench__checks">
        <legend className="visually-hidden">Compliance statements</legend>
        {ATTESTATIONS.map((a) => (
          <label key={a.key} className={`bench__check ${form[a.key] ? 'is-checked' : ''}`}>
            <input id={`signup-${a.key}`} type="checkbox" checked={form[a.key]}
              onChange={toggle(a.key)} />
            <span>{a.label || termsLabel}</span>
          </label>
        ))}
        {submitted && errors.attestations && (
          <span className="bench__error">{errors.attestations}</span>
        )}
      </fieldset>

      <button type="submit" className="bench__submit" disabled={busy || !isSupabaseConfigured}>
        {busy ? 'Submitting…' : 'Submit for review'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="bench__note">
        New accounts are reviewed by our team before the catalog unlocks.
      </p>
      <p className="bench__foot">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </BenchCard>
  )
}
