import { useEffect, useState } from 'react'
import { adminListApplications } from '../../lib/partner.js'
import './admin.css'

function formatDate(d) {
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

export default function AdminApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setApps(await adminListApplications())
    } catch (err) {
      setError(
        err.message?.includes('does not exist')
          ? 'The partner_applications table does not exist yet. Run supabase/partner_applications.sql.'
          : err.message || 'Could not load applications.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Applications</h1>
          <p>{apps.length} partnership application{apps.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="admin__head-actions">
          <button className="btn btn--outline" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <p className="admin__empty">Loading applications…</p>
      ) : apps.length === 0 ? (
        <p className="admin__empty">No applications yet.</p>
      ) : (
        <div className="orders-admin">
          {apps.map((a) => {
            const socials = a.socials || {}
            const socialEntries = Object.entries(socials).filter(
              ([, v]) => v && String(v).trim()
            )
            return (
              <article className="ordercard" key={a.id}>
                <header className="ordercard__head">
                  <div>
                    <strong className="ordercard__num">
                      {a.first_name} {a.last_name}
                    </strong>
                    <span className="ordercard__date">{formatDate(a.created_at)}</span>
                  </div>
                </header>
                <div className="ordercard__body">
                  <div className="ordercard__customer">
                    <div>
                      <span className="ordercard__label">Email</span>
                      <a href={`mailto:${a.email}`}>{a.email}</a>
                    </div>
                    {socialEntries.map(([k, v]) => (
                      <div key={k}>
                        <span className="ordercard__label">{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                  {a.message && (
                    <div className="ordercard__items">
                      <span className="ordercard__label">Message</span>
                      <p className="appcard__message">{a.message}</p>
                    </div>
                  )}
                </div>
                <footer className="ordercard__foot">
                  <a className="btn btn--primary ordercard__deliver" href={`mailto:${a.email}`}>
                    Reply by email
                  </a>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
