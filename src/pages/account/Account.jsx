import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import './account.css'

const fields = [
  ['address_street', 'Street Address', 'address-line1'],
  ['address_city', 'City', 'address-level2'],
  ['address_state', 'State / Province', 'address-level1'],
  ['address_postal', 'Postal / Zip Code', 'postal-code'],
  ['address_country', 'Country', 'country-name'],
]

export default function Account() {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth()
  const [form, setForm] = useState({})
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address_street: profile.address_street || '',
        address_city: profile.address_city || '',
        address_state: profile.address_state || '',
        address_postal: profile.address_postal || '',
        address_country: profile.address_country || '',
      })
    }
  }, [profile])

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  const onSave = async (e) => {
    e.preventDefault()
    setStatus('')
    setBusy(true)
    // Note: role is intentionally not sent; the DB guards against role changes.
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', user.id)
    if (error) setStatus('Could not save: ' + error.message)
    else {
      setStatus('Saved.')
      refreshProfile()
    }
    setBusy(false)
  }

  return (
    <div className="auth auth--wide">
      <div className="auth__card">
        <header className="auth__head auth__head--row">
          <div>
            <h1>My Account</h1>
            <p>{profile?.full_name || user?.email}</p>
          </div>
          <div className="account__head-actions">
            <Link to="/account/orders" className="btn btn--outline">
              Order history
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn btn--outline">
                Admin dashboard
              </Link>
            )}
            <button className="btn btn--ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <div className="account__meta">
          <div>
            <span className="account__label">Email</span>
            <span>{user?.email}</span>
          </div>
          <div>
            <span className="account__label">Account type</span>
            <span className="account__role">{profile?.role || 'customer'}</span>
          </div>
        </div>

        <form className="auth__section" onSubmit={onSave}>
          <h2 className="auth__section-title">Contact &amp; shipping</h2>
          <div className="auth__grid">
            <label>
              Full Name
              <input value={form.full_name || ''} onChange={set('full_name')}
                placeholder="Enter your full name" />
            </label>
            <label>
              Phone Number
              <input value={form.phone || ''} onChange={set('phone')}
                placeholder="(555) 123-4567" />
            </label>
            {fields.map(([key, label, ac]) => (
              <label
                key={key}
                className={key === 'address_street' ? 'auth__full' : ''}
              >
                {label}
                <input
                  value={form[key] || ''}
                  onChange={set(key)}
                  autoComplete={ac}
                />
              </label>
            ))}
          </div>

          <div className="account__save-row">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            {status && <span className="account__status">{status}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
