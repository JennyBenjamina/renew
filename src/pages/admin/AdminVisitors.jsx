import { useEffect, useState } from 'react'
import { adminGetEntryStats, formatPacific } from '../../lib/analytics.js'
import './admin.css'

export default function AdminVisitors() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setStats(await adminGetEntryStats())
    } catch (err) {
      setError(err.message || 'Could not load visitor stats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const cards = stats
    ? [
        { label: 'Total entries', value: stats.total, sub: 'All time' },
        {
          label: 'Today',
          value: stats.today,
          sub: `Since ${formatPacific(stats.todayCutoff, { hour: undefined, minute: undefined })}`,
        },
        {
          label: 'Last 7 days',
          value: stats.week,
          sub: `Since ${formatPacific(stats.weekCutoff, { hour: undefined, minute: undefined })}`,
        },
        {
          label: 'Last 30 days',
          value: stats.month,
          sub: `Since ${formatPacific(stats.monthCutoff, { hour: undefined, minute: undefined })}`,
        },
      ]
    : []

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Visitors</h1>
          <p>People who accepted the compliance notice and entered the site.</p>
        </div>
        <div className="admin__head-actions">
          <button className="btn btn--outline" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <p className="admin__empty">Loading stats…</p>
      ) : (
        <>
          <div className="statcards">
            {cards.map((c) => (
              <div className="statcard" key={c.label}>
                <span className="statcard__label">{c.label}</span>
                <span className="statcard__value">{c.value.toLocaleString()}</span>
                <span className="statcard__sub">{c.sub}</span>
              </div>
            ))}
          </div>
          <p className="statcards__note">
            Day cutoffs are in Pacific time. As of {formatPacific(stats.asOf)}.
            Each entry is one acceptance of the compliance gate; returning
            visitors who chose “remember this device” are not re-counted for 14
            days.
          </p>
        </>
      )}
    </>
  )
}
