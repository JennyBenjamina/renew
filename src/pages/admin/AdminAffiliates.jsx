import { useEffect, useMemo, useState } from 'react'
import {
  adminListAffiliates,
  adminCreateAffiliate,
  adminUpdateAffiliate,
  referralLink,
} from '../../lib/affiliates.js'
import { adminListOrders } from '../../lib/orders.js'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import { money } from '../../lib/format.js'
import './admin.css'
import './blogadmin.css'

const emptyForm = { code: '', name: '', email: '', discount_percent: 10 }

export default function AdminAffiliates() {
  const [reps, setReps] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [r, o] = await Promise.all([adminListAffiliates(), adminListOrders()])
      setReps(r)
      setOrders(o)
    } catch (err) {
      setError(err.message || 'Could not load affiliates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSupabaseConfigured) load()
    else setLoading(false)
  }, [])

  // Tally orders + sales per affiliate id.
  const totals = useMemo(() => {
    const m = {}
    for (const o of orders) {
      if (!o.affiliate_id) continue
      const t = (m[o.affiliate_id] ||= { count: 0, sales: 0 })
      t.count += 1
      t.sales += Number(o.total || 0)
    }
    return m
  }, [orders])

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.code.trim()) return setError('A code is required.')
    setSaving(true)
    try {
      await adminCreateAffiliate(form)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.message || 'Could not create the rep.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (rep) => {
    try {
      await adminUpdateAffiliate(rep.id, { active: !rep.active })
      setReps((list) => list.map((r) => (r.id === rep.id ? { ...r, active: !r.active } : r)))
    } catch (err) {
      alert(err.message || 'Could not update.')
    }
  }

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Affiliates</h1>
          <p>{reps.length} sales rep{reps.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn--outline" onClick={load} disabled={loading || !isSupabaseConfigured}>
          Refresh
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert">
          Supabase isn’t configured. Add your keys and run <code>affiliates.sql</code>{' '}
          to manage sales reps.
        </div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {/* Add a rep */}
      <form className="blogform__grid" onSubmit={onCreate} style={{ marginBottom: 'var(--space-6)' }}>
        <label>
          Code (their link + discount code)
          <input value={form.code} onChange={set('code')} placeholder="jake" required />
        </label>
        <label>
          Name
          <input value={form.name} onChange={set('name')} placeholder="Jake Smith" />
        </label>
        <label>
          Email (they sign up with this)
          <input type="email" value={form.email} onChange={set('email')} placeholder="jake@example.com" />
        </label>
        <label>
          Discount %
          <input type="number" min="0" max="90" value={form.discount_percent} onChange={set('discount_percent')} />
        </label>
        <div className="blogform__full">
          <button className="btn btn--primary" disabled={saving}>
            {saving ? 'Adding…' : '+ Add rep'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="admin__empty">Loading…</p>
      ) : reps.length === 0 ? (
        <p className="admin__empty">No reps yet. Add one above.</p>
      ) : (
        <div className="blogadmin__list">
          {reps.map((r) => {
            const t = totals[r.id] || { count: 0, sales: 0 }
            return (
              <article className="blogadmin__row" key={r.id}>
                <div className="blogadmin__main">
                  <div className="blogadmin__titleline">
                    <strong>{r.name || r.code}</strong>
                    <span className={`blogadmin__badge ${r.active ? 'is-pub' : 'is-draft'}`}>
                      {r.active ? 'Active' : 'Paused'}
                    </span>
                    <span className={`blogadmin__badge ${r.user_id ? 'is-pub' : 'is-draft'}`}>
                      {r.user_id ? 'Signed up' : 'Awaiting signup'}
                    </span>
                  </div>
                  <span className="blogadmin__sub">
                    code <strong>{r.code}</strong> · {r.discount_percent}% off ·{' '}
                    {t.count} order{t.count === 1 ? '' : 's'} · {money(t.sales)} sales
                  </span>
                  <span className="blogadmin__sub" style={{ wordBreak: 'break-all' }}>
                    {referralLink(r.code)}
                  </span>
                </div>
                <div className="blogadmin__actions">
                  <button className="admin__link" onClick={() => navigator.clipboard?.writeText(referralLink(r.code))}>
                    Copy link
                  </button>
                  <button className="admin__link" onClick={() => toggleActive(r)}>
                    {r.active ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
