import { useEffect, useState } from 'react'
import { adminListSubscribers, subscribersToCsv } from '../../lib/subscribers.js'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import './admin.css'
import './blogadmin.css'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function AdminSubscribers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await adminListSubscribers())
    } catch (err) {
      setError(err.message || 'Could not load subscribers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSupabaseConfigured) load()
    else setLoading(false)
  }, [])

  const exportCsv = () => {
    const csv = subscribersToCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `renew-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Subscribers</h1>
          <p>{rows.length} newsletter subscriber{rows.length === 1 ? '' : 's'}</p>
        </div>
        <div className="admin__head-actions">
          <button className="btn btn--outline" onClick={load} disabled={loading || !isSupabaseConfigured}>
            Refresh
          </button>
          <button className="btn btn--primary" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert">
          Supabase isn’t configured. Add your keys and run <code>subscribers.sql</code>{' '}
          to collect and view signups here.
        </div>
      )}

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <p className="admin__empty">Loading subscribers…</p>
      ) : rows.length === 0 ? (
        <p className="admin__empty">No subscribers yet.</p>
      ) : (
        <div className="blogadmin__list">
          {rows.map((r) => (
            <article className="blogadmin__row" key={r.id || r.email}>
              <div className="blogadmin__main">
                <div className="blogadmin__titleline">
                  <strong>{r.email}</strong>
                </div>
                <span className="blogadmin__sub">
                  {r.source || 'footer'} · joined {fmtDate(r.created_at)}
                </span>
              </div>
              <div className="blogadmin__actions">
                <a href={`mailto:${r.email}`} className="admin__link">
                  Email ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
