import { useEffect, useMemo, useState } from 'react'
import { adminListAccounts, reviewAccount, APPROVAL_STATUSES } from '../../lib/accounts.js'
import { emailDomain, isPersonalEmail } from '../../lib/researcher.jsx'
import './admin.css'

function formatDate(d) {
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const CHECKS = [
  ['attest_age_21', '21 or older'],
  ['attest_researcher', 'Qualified researcher'],
  ['attest_research_only', 'Research use only'],
  ['attest_terms', 'Agreed to terms'],
]

/** Compliance gate: review researcher registrations and approve or reject them.
 *  Only approved accounts (and admins) can see the catalog or check out. */
export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [flash, setFlash] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setAccounts(await adminListAccounts())
    } catch (err) {
      setError(err.message || 'Could not load accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const reviewable = useMemo(() => accounts.filter((a) => a.role !== 'admin'), [accounts])
  const counts = useMemo(() => {
    const c = { all: reviewable.length }
    APPROVAL_STATUSES.forEach((s) => (c[s] = reviewable.filter((a) => a.approval_status === s).length))
    return c
  }, [reviewable])
  const visible = filter === 'all' ? reviewable : reviewable.filter((a) => a.approval_status === filter)
  const migrationMissing = !loading && accounts.length > 0 && accounts.every((a) => a.approval_status === undefined)

  const decide = async (a, decision) => {
    setBusyId(a.id)
    setError('')
    setFlash('')
    try {
      const res = await reviewAccount({ userId: a.id, decision, note: notes[a.id] })
      setAccounts((list) =>
        list.map((x) =>
          x.id === a.id
            ? { ...x, approval_status: decision, review_note: notes[a.id] || null, reviewed_at: new Date().toISOString() }
            : x
        )
      )
      const verb = decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Moved back to pending:'
      setFlash(`${verb} ${a.email}${decision !== 'pending' ? (res.emailed ? '. They’ve been emailed.' : '. The email didn’t send; let them know yourself.') : '.'}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Accounts</h1>
          <p>
            {counts.pending || 0} awaiting review. New registrations can’t see the
            catalog or check out until you approve them.
          </p>
        </div>
        <div className="admin__head-actions">
          <div className="admin__cats">
            {[...APPROVAL_STATUSES, 'all'].map((s) => (
              <button key={s} className={`chip ${filter === s ? 'is-active' : ''}`} onClick={() => setFilter(s)}>
                {s} ({counts[s] || 0})
              </button>
            ))}
          </div>
          <button className="btn btn--outline" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {migrationMissing && (
        <div className="admin-alert admin-alert--error">
          Approval isn’t set up in the database yet. Run supabase/researcher_approval.sql in the Supabase SQL editor.
        </div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {flash && <div className="admin-alert">{flash}</div>}

      {loading ? (
        <p className="admin__empty">Loading accounts…</p>
      ) : visible.length === 0 ? (
        <p className="admin__empty">
          {filter === 'pending' ? 'No accounts waiting for review.' : 'No accounts match this filter.'}
        </p>
      ) : (
        <div className="orders-admin">
          {visible.map((a) => {
            const busy = busyId === a.id
            const personal = isPersonalEmail(a.email)
            return (
              <article className="ordercard" key={a.id}>
                <header className="ordercard__head">
                  <div>
                    <strong className="ordercard__num">{a.institution || 'No institution given'}</strong>
                    <span className="ordercard__date">Registered {formatDate(a.created_at)}</span>
                  </div>
                  <span className={`ordercard__badge acctstatus--${a.approval_status}`}>
                    {a.approval_status}
                  </span>
                </header>
                <div className="ordercard__body">
                  <div className="ordercard__customer">
                    <div>
                      <span className="ordercard__label">Email</span>
                      <a href={`mailto:${a.email}`}>{a.email}</a>
                      {personal && <span className="acct__flag">Personal email domain</span>}
                    </div>
                    <div>
                      <span className="ordercard__label">Domain</span>
                      <a href={`https://${emailDomain(a.email)}`} target="_blank" rel="noreferrer">
                        {emailDomain(a.email)} ↗
                      </a>
                    </div>
                    {a.institution && (
                      <div>
                        <span className="ordercard__label">Registry check</span>
                        <a href={`https://ror.org/search?query=${encodeURIComponent(a.institution)}`}
                          target="_blank" rel="noreferrer">
                          Search ror.org ↗
                        </a>
                      </div>
                    )}
                    {a.full_name && (
                      <div>
                        <span className="ordercard__label">Name</span>
                        <span>{a.full_name}</span>
                      </div>
                    )}
                    {a.role && a.role !== 'customer' && (
                      <div>
                        <span className="ordercard__label">Role</span>
                        <span>{a.role}</span>
                      </div>
                    )}
                  </div>
                  <div className="ordercard__items">
                    <span className="ordercard__label">
                      Statements confirmed{a.terms_version ? ` (terms ${a.terms_version})` : ''}
                    </span>
                    <ul className="acct__checks">
                      {CHECKS.map(([k, label]) => (
                        <li key={k} className={a[k] ? 'is-yes' : 'is-no'}>
                          {a[k] ? '✓' : '✗'} {label}
                        </li>
                      ))}
                    </ul>
                    {a.reviewed_at && a.approval_status !== 'pending' && (
                      <span className="ordercard__date">
                        Reviewed {formatDate(a.reviewed_at)}
                        {a.review_note ? ` · “${a.review_note}”` : ''}
                      </span>
                    )}
                  </div>
                  <label className="acct__note">
                    <span className="ordercard__label">Note to the applicant (optional, included in the email)</span>
                    <textarea id={`note-${a.id}`} rows={2} value={notes[a.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                      placeholder="e.g. Couldn’t find this institution on ror.org" />
                  </label>
                </div>
                <footer className="ordercard__foot acct__actions">
                  {a.approval_status !== 'approved' && (
                    <button className="btn btn--primary" disabled={busy} onClick={() => decide(a, 'approved')}>
                      {busy ? 'Saving…' : 'Approve'}
                    </button>
                  )}
                  {a.approval_status !== 'rejected' && (
                    <button className="btn btn--outline acct__reject" disabled={busy} onClick={() => decide(a, 'rejected')}>
                      {a.approval_status === 'approved' ? 'Revoke access' : 'Reject'}
                    </button>
                  )}
                  {a.approval_status !== 'pending' && (
                    <button className="admin__link" disabled={busy} onClick={() => decide(a, 'pending')}>
                      Move back to pending
                    </button>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
