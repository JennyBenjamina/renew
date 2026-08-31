import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  affiliateGetSelf,
  affiliateListOrders,
  referralLink,
} from '../../lib/affiliates.js'
import { money } from '../../lib/format.js'
import './affiliate.css'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function AffiliateDashboard() {
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([affiliateGetSelf(), affiliateListOrders()])
      .then(([a, o]) => {
        setMe(a)
        setOrders(Array.isArray(o) ? o : [])
      })
      .catch((e) => setError(e.message || 'Could not load your dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const sales = orders.reduce((s, o) => s + Number(o.total || 0), 0)
    return { count: orders.length, sales }
  }, [orders])

  const copyLink = async () => {
    if (!me) return
    try {
      await navigator.clipboard.writeText(referralLink(me.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="container aff__status">
        <p>Loading your dashboard…</p>
      </div>
    )
  }

  if (error || !me) {
    return (
      <div className="container aff__status">
        <h1>Affiliate dashboard</h1>
        <p>{error || 'No affiliate account is linked to this login yet.'}</p>
        <p className="aff__muted">
          If you’re a Renew sales rep, make sure you signed up with the email your
          code was registered under, or contact us to get set up.
        </p>
        <Link to="/account" className="btn btn--outline">
          ← Back to account
        </Link>
      </div>
    )
  }

  return (
    <div className="aff">
      <header className="aff__hero deco-band">
        <div className="container">
          <span className="eyebrow">Affiliate dashboard</span>
          <h1>Welcome{me.name ? `, ${me.name}` : ''}</h1>
          <p>Share your link, and every order it drives is credited to you.</p>
        </div>
      </header>

      <div className="container aff__body">
        <div className="aff__cards">
          <div className="aff__card aff__card--link">
            <span className="aff__label">Your referral link</span>
            <div className="aff__linkrow">
              <code>{referralLink(me.code)}</code>
              <button className="btn btn--primary" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="aff__hint">
              Customers who use your code get <strong>{me.discount_percent}% off</strong>,
              and the sale is credited to you. They can also type{' '}
              <strong>{me.code}</strong> at checkout.
            </p>
          </div>

          <div className="aff__stat">
            <span className="aff__stat-num">{stats.count}</span>
            <span className="aff__label">Orders</span>
          </div>
          <div className="aff__stat">
            <span className="aff__stat-num">{money(stats.sales)}</span>
            <span className="aff__label">Total sales</span>
          </div>
        </div>

        <h2 className="aff__h2">Your orders</h2>
        {orders.length === 0 ? (
          <p className="aff__muted">No attributed orders yet. Share your link to get started.</p>
        ) : (
          <div className="aff__table">
            <div className="aff__row aff__row--head">
              <span>Order</span>
              <span>Date</span>
              <span>Payment</span>
              <span>Status</span>
              <span>Total</span>
            </div>
            {orders.map((o) => (
              <div className="aff__row" key={o.id}>
                <span className="aff__mono">{o.order_number}</span>
                <span>{fmtDate(o.created_at)}</span>
                <span className={`aff__badge aff__pay--${o.payment_status || 'unpaid'}`}>
                  {o.payment_status === 'paid'
                    ? 'Paid'
                    : o.payment_status === 'cancelled'
                      ? 'Cancelled'
                      : 'Unpaid'}
                </span>
                <span className="aff__badge">{o.status}</span>
                <span className="aff__total">{money(o.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
