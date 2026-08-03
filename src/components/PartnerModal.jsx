import { useEffect, useState } from 'react'
import { submitPartner } from '../lib/partner.js'
import './PartnerModal.css'

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@yourhandle' },
  { key: 'youtube', label: 'YouTube', placeholder: 'Channel name or link' },
  { key: 'website', label: 'Website', placeholder: 'https://…' },
]

const empty = {
  first_name: '',
  last_name: '',
  email: '',
  message: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  website: '',
}

export default function PartnerModal({ open, onClose }) {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setForm(empty)
      setError('')
      setDone(false)
    }
  }, [open])

  if (!open) return null

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.first_name.trim() || !form.email.trim()) {
      return setError('Please enter your first name and email.')
    }
    setBusy(true)
    try {
      await submitPartner({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        socials: {
          instagram: form.instagram.trim(),
          tiktok: form.tiktok.trim(),
          youtube: form.youtube.trim(),
          website: form.website.trim(),
        },
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pmodal" role="dialog" aria-modal="true" aria-labelledby="pmodal-title">
      <div className="pmodal__scrim" onClick={onClose} />
      <div className="pmodal__card">
        <button className="pmodal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {done ? (
          <div className="pmodal__done">
            <span className="pmodal__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <h2>Application received</h2>
            <p>
              Thanks for your interest in partnering with Renew. We’ll review your
              application and reach out by email.
            </p>
            <button className="btn btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="pmodal__form" onSubmit={onSubmit}>
            <header className="pmodal__head">
              <span className="eyebrow">Partner with Renew</span>
              <h2 id="pmodal-title">Apply for partnership</h2>
              <p>Tell us a bit about you and we’ll be in touch.</p>
            </header>

            {error && <div className="auth__alert auth__alert--error">{error}</div>}

            <div className="pmodal__row">
              <label>
                First Name
                <input value={form.first_name} onChange={set('first_name')}
                  placeholder="Jane" autoComplete="given-name" required />
              </label>
              <label>
                Last Name
                <input value={form.last_name} onChange={set('last_name')}
                  placeholder="Doe" autoComplete="family-name" />
              </label>
            </div>

            <label>
              Email Address
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" autoComplete="email" required />
            </label>

            <label>
              Message
              <textarea rows={4} value={form.message} onChange={set('message')}
                placeholder="Tell us about your audience and why you’d like to partner." />
            </label>

            <div className="pmodal__socials">
              <span className="pmodal__socials-title">
                Social links <span className="pmodal__optional">Optional</span>
              </span>
              <div className="pmodal__row">
                {SOCIALS.map((s) => (
                  <label key={s.key}>
                    {s.label}
                    <input value={form[s.key]} onChange={set(s.key)}
                      placeholder={s.placeholder} />
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
