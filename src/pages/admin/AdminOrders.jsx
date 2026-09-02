import { useEffect, useMemo, useState } from 'react'
import {
  adminListOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  notifyShipment,
  trackingUrl,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  CARRIERS,
} from '../../lib/orders.js'
import { money } from '../../lib/format.js'
import './admin.css'

const carrierKey = (name) =>
  CARRIERS.find((c) => c.name.toLowerCase() === String(name || '').toLowerCase())?.key || 'usps'

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

const payLabel = (ps) =>
  ps === 'paid' ? 'Paid' : ps === 'cancelled' ? 'Payment cancelled' : 'Unpaid'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [ship, setShip] = useState({ carrier: 'usps', tracking: '' })
  const [shipBusy, setShipBusy] = useState(false)

  // Prefill the shipment form from the expanded order.
  useEffect(() => {
    const o = orders.find((x) => x.id === openId)
    setShip({
      carrier: o ? carrierKey(o.carrier) : 'usps',
      tracking: o?.tracking_number || '',
    })
  }, [openId, orders])

  const onShip = async (order) => {
    const tracking = ship.tracking.trim()
    if (!tracking) return
    setShipBusy(true)
    try {
      const r = await notifyShipment({
        orderId: order.id,
        carrier: ship.carrier,
        trackingNumber: tracking,
      })
      setOrders((list) =>
        list.map((o) =>
          o.id === order.id
            ? { ...o, carrier: r.carrier, tracking_number: r.tracking_number, status: 'shipped' }
            : o
        )
      )
      alert('Shipped — tracking email sent to the customer.')
    } catch (e) {
      alert(e.message || 'Could not send the tracking email.')
    } finally {
      setShipBusy(false)
    }
  }

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

  const onPayment = async (order, payment_status) => {
    setBusyId(order.id)
    try {
      const updated = await updateOrderPaymentStatus(order.id, payment_status)
      setOrders((list) => list.map((o) => (o.id === order.id ? updated : o)))
    } catch (err) {
      alert(err.message || 'Could not update payment status.')
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
        <div className="ordertable">
          <div className="orderrow orderrow--head">
            <span>Order</span>
            <span>Customer</span>
            <span>Payment</span>
            <span>Delivery</span>
            <span className="orderrow__total">Total</span>
            <span aria-hidden="true" />
          </div>

          {visible.map((o) => {
            const open = openId === o.id
            const ps = o.payment_status || 'unpaid'
            return (
              <div
                className={`orderrow-wrap ${open ? 'is-open' : ''} ${busyId === o.id ? 'is-busy' : ''}`}
                key={o.id}
              >
                <button
                  className="orderrow orderrow--summary"
                  onClick={() => setOpenId(open ? null : o.id)}
                  aria-expanded={open}
                >
                  <span className="orderrow__num">
                    <strong>{o.order_number || o.id.slice(0, 8)}</strong>
                    <span className="orderrow__date">{formatDate(o.created_at)}</span>
                  </span>
                  <span className="orderrow__cust">
                    <span className="orderrow__custname">{o.customer_name || '—'}</span>
                    {o.referral_code && (
                      <span className="orderrow__ref">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none"
                          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                          strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 3v18h18" />
                          <path d="M7 14l4-4 3 3 5-6" />
                        </svg>
                        Affiliate · {o.referral_code}
                      </span>
                    )}
                  </span>
                  <span className={`ordercard__badge pay--${ps}`}>{payLabel(ps)}</span>
                  <span className={`ordercard__badge status--${o.status}`}>{o.status}</span>
                  <span className="orderrow__total">{money(o.total)}</span>
                  <svg className="orderrow__chev" viewBox="0 0 24 24" width="18" height="18"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {open && (
                  <div className="orderrow__detail">
                    <div className="orderrow__cols">
                      <div className="orderrow__customer">
                        <div>
                          <span className="ordercard__label">Email</span>
                          <a href={`mailto:${o.customer_email}`}>{o.customer_email || '—'}</a>
                        </div>
                        <div>
                          <span className="ordercard__label">Phone</span>
                          <a href={`tel:${o.customer_phone}`}>{o.customer_phone || '—'}</a>
                        </div>
                        {o.referral_code && (
                          <div>
                            <span className="ordercard__label">Referred by</span>
                            <span>{o.referral_code}</span>
                          </div>
                        )}
                        {o.note && (
                          <div className="ordercard__note">
                            <span className="ordercard__label">Note</span>
                            <span>{o.note}</span>
                          </div>
                        )}
                      </div>

                      <div className="orderrow__items">
                        <span className="ordercard__label">Items</span>
                        <ul>
                          {(Array.isArray(o.items) ? o.items : []).map((i, idx) => (
                            <li key={idx}>
                              <span>{i.qty}× {i.name}</span>
                              <span>{money(i.price * i.qty)}</span>
                            </li>
                          ))}
                        </ul>
                        {Number(o.discount) > 0 && (
                          <div className="orderrow__line">
                            <span>Discount{o.referral_code ? ` (${o.referral_code})` : ''}</span>
                            <span>−{money(o.discount)}</span>
                          </div>
                        )}
                        {Number(o.shipping) > 0 && (
                          <div className="orderrow__line orderrow__line--muted">
                            <span>Shipping</span>
                            <span>{money(o.shipping)}</span>
                          </div>
                        )}
                        <div className="ordercard__total">
                          <span>Total</span>
                          <strong>{money(o.total)}</strong>
                        </div>
                        <p className="orderrow__fulfill">
                          {o.fulfillment === 'ship' ? 'Ship to customer' : 'Local delivery (Las Vegas)'}
                        </p>
                      </div>
                    </div>

                    <div className="orderrow__controls">
                      <label className="ordercard__status-label">
                        Payment
                        <select
                          value={ps}
                          disabled={busyId === o.id}
                          onChange={(e) => onPayment(o, e.target.value)}
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label className="ordercard__status-label">
                        Delivery
                        <select
                          value={o.status}
                          disabled={busyId === o.id}
                          onChange={(e) => onStatus(o, e.target.value)}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="orderrow__ship">
                      <span className="ordercard__label">Shipment tracking</span>
                      {o.tracking_number && (
                        <p className="orderrow__track">
                          Shipped via {o.carrier} ·{' '}
                          <span className="affdrill__mono">{o.tracking_number}</span>
                          {trackingUrl(o.carrier, o.tracking_number) && (
                            <>
                              {' · '}
                              <a href={trackingUrl(o.carrier, o.tracking_number)}
                                target="_blank" rel="noreferrer">Track ↗</a>
                            </>
                          )}
                        </p>
                      )}
                      <div className="orderrow__shipform">
                        <select
                          value={ship.carrier}
                          onChange={(e) => setShip((s) => ({ ...s, carrier: e.target.value }))}
                        >
                          {CARRIERS.map((c) => (
                            <option key={c.key} value={c.key}>{c.name}</option>
                          ))}
                        </select>
                        <input
                          value={ship.tracking}
                          onChange={(e) => setShip((s) => ({ ...s, tracking: e.target.value }))}
                          placeholder="Tracking number"
                        />
                        <button
                          className="btn btn--primary"
                          disabled={shipBusy || !ship.tracking.trim()}
                          onClick={() => onShip(o)}
                        >
                          {shipBusy
                            ? 'Sending…'
                            : o.tracking_number
                              ? 'Update & email'
                              : 'Save & email tracking'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
