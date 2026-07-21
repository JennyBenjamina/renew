import { useEffect, useMemo, useState } from 'react'
import { adminListOrders, updateOrderStatus, ORDER_STATUSES } from '../../lib/orders.js'
import { money } from '../../lib/format.js'
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await adminListOrders())
    } catch (err) {
      setError(err.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onStatus = async (order, status) => {
    setBusyId(order.id)
    try {
      const updated = await updateOrderStatus(order.id, status)
      setOrders((list) => list.map((o) => (o.id === order.id ? updated : o)))
    } catch (err) {
      alert(err.message || 'Could not update status.')
    } finally {
      setBusyId(null)
    }
  }

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  )

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Orders</h1>
          <p>
            {orders.length} total
            {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
          </p>
        </div>
        <div className="admin__head-actions">
          <div className="admin__cats">
            {['all', ...ORDER_STATUSES].map((s) => (
              <button
                key={s}
                className={`chip ${filter === s ? 'is-active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button className="btn btn--outline" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <p className="admin__empty">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="admin__empty">
          {orders.length === 0 ? 'No orders yet.' : 'No orders match this filter.'}
        </p>
      ) : (
        <div className="orders-admin">
          {visible.map((o) => (
            <article
              className={`ordercard ${busyId === o.id ? 'is-busy' : ''}`}
              key={o.id}
            >
              <header className="ordercard__head">
                <div>
                  <strong className="ordercard__num">{o.order_number || o.id.slice(0, 8)}</strong>
                  <span className="ordercard__date">{formatDate(o.created_at)}</span>
                </div>
                <span className={`ordercard__badge status--${o.status}`}>{o.status}</span>
              </header>

              <div className="ordercard__body">
                <div className="ordercard__customer">
                  <div>
                    <span className="ordercard__label">Customer</span>
                    <span>{o.customer_name || '—'}</span>
                  </div>
                  <div>
                    <span className="ordercard__label">Email</span>
                    <a href={`mailto:${o.customer_email}`}>{o.customer_email || '—'}</a>
                  </div>
                  <div>
                    <span className="ordercard__label">Phone</span>
                    <a href={`tel:${o.customer_phone}`}>{o.customer_phone || '—'}</a>
                  </div>
                  {o.note && (
                    <div className="ordercard__note">
                      <span className="ordercard__label">Note</span>
                      <span>{o.note}</span>
                    </div>
                  )}
                </div>

                <div className="ordercard__items">
                  <span className="ordercard__label">Items</span>
                  <ul>
                    {(Array.isArray(o.items) ? o.items : []).map((i, idx) => (
                      <li key={idx}>
                        <span>{i.qty}× {i.name}</span>
                        <span>{money(i.price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="ordercard__total">
                    <span>Total</span>
                    <strong>{money(o.total)}</strong>
                  </div>
                </div>
              </div>

              <footer className="ordercard__foot">
                <label className="ordercard__status-label">
                  Status
                  <select
                    value={o.status}
                    disabled={busyId === o.id}
                    onChange={(e) => onStatus(o, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                {o.status !== 'delivered' && (
                  <button
                    className="btn btn--primary ordercard__deliver"
                    disabled={busyId === o.id}
                    onClick={() => onStatus(o, 'delivered')}
                  >
                    Mark delivered
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
