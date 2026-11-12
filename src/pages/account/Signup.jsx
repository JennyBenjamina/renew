import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { TERMS_VERSION } from '../../lib/compliance.js'
import { validateReferral } from '../../lib/affiliates.js'
import { getStoredReferral } from '../../lib/referral.js'
import {
  ENTITY_TYPES,
  composeEmail,
  validateRegistration,
} from '../../lib/researcher.jsx'
import BenchCard, { PendingNotice } from './BenchCard.jsx'
import AuthTabs from './AuthTabs.jsx'
import './account.css'

const initialForm = () => ({
  emailLocal: '',
  emailDomain: '',
  institution: '',
  password: '',
  fullName: '',
  entityType: '',
  attestAge: false,
  attestQualified: false,
  signature: '',
  referralCode: getStoredReferral() || '',
})

export default function Signup() {
  const { user, loading, signUp, isSupabaseConfigured } = useAuth()
  const location = useLocation()
  const from = location.state?.from || null
  const [form, setForm] = useState(initialForm)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [referralError, setReferralError] = useState('')
  const [busy, setBusy] = useState(false)
  const [doneEmail, setDoneEmail] = useState(null)

  // Straight after registering: ask them to confirm their email.
  if (doneEmail) {
    return (
      <BenchCard pill="Under review">
        <PendingNotice email={doneEmail} />
        <p className="bench__foot">
          <Link to="/products">Continue browsing</Link> ·{' '}
          <Link to="/login">Log in</Link>
        </p>
      </BenchCard>
    )
  }
  if (!loading && user) return <Navigate to="/account/pending" replace />

  const errors = validateRegistration(form)
  const show = (f) => (submitted || touched[f]) && errors[f]
  const setText = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))
  const blur = (f) => () => setTouched((t) => ({ ...t, [f]: true }))
  const toggle = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.checked }))
  const email = composeEmail(form)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setReferralError('')
    setSubmitted(true)
    if (Object.keys(errors).length) return

    setBusy(true)
    try {
      // An optional referral code must belong to an active sales rep.
      let referral = form.referralCode.trim()
      if (referral) {
        const check = await validateReferral(referral)
        if (!check?.valid) {
          setReferralError('That referral code isn’t valid. Check it or leave it blank.')
          return
        }
        referral = (check.code || referral).toLowerCase()
      }

      const fullName = form.fullName.trim().replace(/\s+/g, ' ')
      await signUp({
        email,
        password: form.password,
        full_name: fullName,
        institution: form.institution.trim(),
        entity_type: form.entityType,
        attest_age_21: true,
        attest_researcher: true,
        attest_research_only: true,
        attest_terms: true,
        terms_version: TERMS_VERSION,
        signature_name: form.signature.trim().replace(/\s+/g, ' '),
        referral_code: referral || null,
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
      <AuthTabs active="signup" from={from} />

      <h1 className="bench__title">Create qualified researcher account.</h1>
      <p className="bench__lede">
        All fields are required unless marked optional. Account creation is
        restricted to qualified research professionals age 21+. Accounts are
        reviewed before checkout access is granted.
      </p>

      {!isSupabaseConfigured && (
        <div className="auth__alert auth__alert--warn">
          Supabase isn’t configured. Add your keys to <code>.env</code> to enable sign-up.
        </div>
      )}
      {error && <div className="auth__alert auth__alert--error" role="alert">{error}</div>}

      {/* Business email: name @ domain */}
      <div className="bench__field">
        <label htmlFor="signup-email-local" className="bench__label">Business email *</label>
        <div className="bench__email">
          <input id="signup-email-local"
            className={`bench__input ${show('email') ? 'is-invalid' : ''}`}
            value={form.emailLocal} onChange={setText('emailLocal')} onBlur={blur('email')}
            placeholder="name" autoComplete="username" autoCapitalize="none"
            spellCheck={false} aria-label="Email name"
            aria-invalid={Boolean(show('email'))} aria-describedby="signup-email-help" />
          <span className="bench__at" aria-hidden="true">@</span>
          <input id="signup-email-domain"
            className={`bench__input ${show('email') ? 'is-invalid' : ''}`}
            value={form.emailDomain}
            onChange={setText('emailDomain')} onBlur={blur('email')}
            placeholder="organization.com" autoCapitalize="none" spellCheck={false}
            aria-label="Email domain" aria-invalid={Boolean(show('email'))} />
        </div>
        {show('email') && <span className="bench__error">{errors.email}</span>}
        <span id="signup-email-help" className="bench__help">
          Email: {email || 'name@organization.com'}. We’ll send a confirmation
          link to this address.
        </span>
      </div>

      <div className="bench__field">
        <label htmlFor="signup-institution" className="bench__label">
          Registered business / institution *
        </label>
        <input id="signup-institution"
          className={`bench__input ${show('institution') ? 'is-invalid' : ''}`}
          value={form.institution} onChange={setText('institution')} onBlur={blur('institution')}
          placeholder="e.g. University of Nevada, Las Vegas — School of Life Sciences"
          autoComplete="organization" required
          aria-invalid={Boolean(show('institution'))} aria-describedby="signup-inst-help" />
        {show('institution') && <span className="bench__error">{errors.institution}</span>}
        <span id="signup-inst-help" className="bench__help">
          Use the registered name, as listed in the Research Organization Registry
          (<a href="https://ror.org" target="_blank" rel="noreferrer">ror.org</a>) where applicable.
        </span>
      </div>

      <div className="bench__field">
        <label htmlFor="signup-password" className="bench__label">Password *</label>
        <div className="bench__password">
          <input id="signup-password"
            className={`bench__input ${show('password') ? 'is-invalid' : ''}`}
            type={showPassword ? 'text' : 'password'}
            value={form.password} onChange={setText('password')} onBlur={blur('password')}
            placeholder="At least 8 characters" autoComplete="new-password" required
            aria-invalid={Boolean(show('password'))} />
          <button type="button" className="bench__reveal"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M3 3l18 18" />}
            </svg>
          </button>
        </div>
        {show('password') && <span className="bench__error">{errors.password}</span>}
      </div>

      <div className="bench__field">
        <label htmlFor="signup-name" className="bench__label">Legal name *</label>
        <input id="signup-name"
          className={`bench__input ${show('fullName') ? 'is-invalid' : ''}`}
          value={form.fullName} onChange={setText('fullName')} onBlur={blur('fullName')}
          autoComplete="name" required aria-invalid={Boolean(show('fullName'))} />
        {show('fullName') && <span className="bench__error">{errors.fullName}</span>}
      </div>

      <div className="bench__field">
        <label htmlFor="signup-entity" className="bench__label">Business / entity type *</label>
        <select id="signup-entity"
          className={`bench__input bench__select ${show('entityType') ? 'is-invalid' : ''}`}
          value={form.entityType} onChange={setText('entityType')} onBlur={blur('entityType')}
          required aria-invalid={Boolean(show('entityType'))}>
          <option value="" disabled>Select entity type</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {show('entityType') && <span className="bench__error">{errors.entityType}</span>}
      </div>

      <fieldset className="bench__checks">
        <legend className="visually-hidden">Compliance statements</legend>
        <label className={`bench__check ${form.attestAge ? 'is-checked' : ''}`}>
          <input id="signup-attest-age" type="checkbox" checked={form.attestAge}
            onChange={toggle('attestAge')} />
          <span>
            I confirm I am <strong>21 years of age or older</strong> (government-issued
            age verification may be requested).
          </span>
        </label>
        <label className={`bench__check ${form.attestQualified ? 'is-checked' : ''}`}>
          <input id="signup-attest-qualified" type="checkbox" checked={form.attestQualified}
            onChange={toggle('attestQualified')} />
          <span>
            I certify that I am acting on behalf of a <strong>qualified entity engaged
            in lawful research</strong>, and understand that all products are sold
            strictly for research and laboratory use only, not for human or animal
            consumption, and not for diagnostic or therapeutic use.
          </span>
        </label>
        {submitted && errors.attestations && (
          <span className="bench__error">{errors.attestations}</span>
        )}
      </fieldset>

      <div className="bench__sign">
        <label htmlFor="signup-signature" className="bench__label">
          Electronic signature — agreement to terms and conditions *
        </label>
        <p className="bench__help">
          By typing your legal full name below, you electronically sign and
          affirmatively agree to the complete{' '}
          <Link to="/terms-of-service">Terms of Service</Link> and{' '}
          <Link to="/research-use-terms">Research Use Terms</Link>, and acknowledge the{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>,{' '}
          <Link to="/delivery">Shipping</Link>, and{' '}
          <Link to="/refund-policy">Refund Policy</Link>. No account may be created
          without this signature.
        </p>
        <input id="signup-signature"
          className={`bench__input bench__signature ${show('signature') ? 'is-invalid' : ''}`}
          value={form.signature} onChange={setText('signature')} onBlur={blur('signature')}
          placeholder="Type your legal full name exactly as entered above"
          autoComplete="off" spellCheck={false} required
          aria-invalid={Boolean(show('signature'))} />
        {show('signature') && <span className="bench__error">{errors.signature}</span>}
      </div>

      <div className="bench__field">
        <label htmlFor="signup-referral" className="bench__label">Referral code (optional)</label>
        <input id="signup-referral"
          className={`bench__input ${referralError ? 'is-invalid' : ''}`}
          value={form.referralCode}
          onChange={(e) => { setReferralError(''); setText('referralCode')(e) }}
          placeholder="e.g. RENEW15" autoCapitalize="characters" spellCheck={false}
          aria-invalid={Boolean(referralError)} />
        {referralError && <span className="bench__error">{referralError}</span>}
      </div>

      <button type="submit" className="bench__submit" disabled={busy || !isSupabaseConfigured}>
        {busy ? 'Submitting…' : 'Create account'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="bench__foot">
        <Link to="/products">← Back to site</Link>
      </p>
    </BenchCard>
  )
}
