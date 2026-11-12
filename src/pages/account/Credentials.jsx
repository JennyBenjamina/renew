import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient'
import { TERMS_VERSION } from '../../lib/compliance.js'
import { ENTITY_TYPES, validateCredentials } from '../../lib/researcher.jsx'
import BenchCard from './BenchCard.jsx'
import './account.css'

/** Institutional credentials for accounts that don't have them on file yet
 *  (accounts created before the full researcher form). Checkout sends them here.
 *  Submitting puts the account back under review until an admin verifies it. */
export default function Credentials() {
  const { user, profile, loading, hasCredentials, refreshProfile, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({
    fullName: profile?.full_name || '',
    institution: profile?.institution || '',
    entityType: profile?.entity_type || '',
    attestAge: false,
    attestQualified: false,
    signature: '',
  }))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="admin-loading">Checking access…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: '/checkout' }} />
  if (hasCredentials && !busy) return <Navigate to="/account/pending" replace />

  const errors = validateCredentials(form)
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
      const { error: rpcError } = await supabase.rpc('submit_credentials', {
        p_full_name: form.fullName.trim().replace(/\s+/g, ' '),
        p_institution: form.institution.trim(),
        p_entity_type: form.entityType,
        p_signature: form.signature.trim().replace(/\s+/g, ' '),
        p_attest_age_21: form.attestAge,
        p_attest_qualified: form.attestQualified,
        p_terms_version: TERMS_VERSION,
      })
      if (rpcError) throw rpcError
      // Let the store owners know there's an account to verify.
      fetch('/.netlify/functions/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      }).catch(() => {})
      await refreshProfile()
      navigate('/account/pending', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not submit your credentials.')
      setBusy(false)
    }
  }

  return (
    <BenchCard as="form" pill="Verification required" onSubmit={onSubmit} noValidate>
      <h1 className="bench__title">Verify your institutional credentials.</h1>
      <p className="bench__lede">
        Before checkout, every account must provide institutional credentials and
        be verified by our team. Submit the details below. Checkout opens once
        your account has been reviewed and approved, and we’ll email you at{' '}
        <strong>{user.email}</strong>.
      </p>

      {!isSupabaseConfigured && (
        <div className="auth__alert auth__alert--warn">
          Supabase isn’t configured. Add your keys to <code>.env</code>.
        </div>
      )}
      {error && <div className="auth__alert auth__alert--error" role="alert">{error}</div>}

      <div className="bench__field">
        <label htmlFor="cred-institution" className="bench__label">
          Registered business / institution *
        </label>
        <input id="cred-institution"
          className={`bench__input ${show('institution') ? 'is-invalid' : ''}`}
          value={form.institution} onChange={setText('institution')} onBlur={blur('institution')}
          placeholder="e.g. University of Nevada, Las Vegas — School of Life Sciences"
          autoComplete="organization" required
          aria-invalid={Boolean(show('institution'))} aria-describedby="cred-inst-help" />
        {show('institution') && <span className="bench__error">{errors.institution}</span>}
        <span id="cred-inst-help" className="bench__help">
          Use the registered name, as listed in the Research Organization Registry
          (<a href="https://ror.org" target="_blank" rel="noreferrer">ror.org</a>) where applicable.
        </span>
      </div>

      <div className="bench__field">
        <label htmlFor="cred-name" className="bench__label">Legal name *</label>
        <input id="cred-name"
          className={`bench__input ${show('fullName') ? 'is-invalid' : ''}`}
          value={form.fullName} onChange={setText('fullName')} onBlur={blur('fullName')}
          autoComplete="name" required aria-invalid={Boolean(show('fullName'))} />
        {show('fullName') && <span className="bench__error">{errors.fullName}</span>}
      </div>

      <div className="bench__field">
        <label htmlFor="cred-entity" className="bench__label">Business / entity type *</label>
        <select id="cred-entity"
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
          <input id="cred-attest-age" type="checkbox" checked={form.attestAge}
            onChange={toggle('attestAge')} />
          <span>
            I confirm I am <strong>21 years of age or older</strong> (government-issued
            age verification may be requested).
          </span>
        </label>
        <label className={`bench__check ${form.attestQualified ? 'is-checked' : ''}`}>
          <input id="cred-attest-qualified" type="checkbox" checked={form.attestQualified}
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
        <label htmlFor="cred-signature" className="bench__label">
          Electronic signature — agreement to terms and conditions *
        </label>
        <p className="bench__help">
          By typing your legal full name below, you electronically sign and
          affirmatively agree to the complete{' '}
          <Link to="/terms-of-service">Terms of Service</Link> and{' '}
          <Link to="/research-use-terms">Research Use Terms</Link>, and acknowledge the{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>,{' '}
          <Link to="/delivery">Shipping</Link>, and{' '}
          <Link to="/refund-policy">Refund Policy</Link>.
        </p>
        <input id="cred-signature"
          className={`bench__input bench__signature ${show('signature') ? 'is-invalid' : ''}`}
          value={form.signature} onChange={setText('signature')} onBlur={blur('signature')}
          placeholder="Type your legal full name exactly as entered above"
          autoComplete="off" spellCheck={false} required
          aria-invalid={Boolean(show('signature'))} />
        {show('signature') && <span className="bench__error">{errors.signature}</span>}
      </div>

      <button type="submit" className="bench__submit" disabled={busy || !isSupabaseConfigured}>
        {busy ? 'Submitting…' : 'Submit for verification'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="bench__foot">
        <Link to="/products">← Back to site</Link>
      </p>
    </BenchCard>
  )
}
