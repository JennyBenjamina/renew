import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { money } from '../../lib/format.js'
import './account.css'

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function OrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        // If the table doesn't exist yet, treat it as "no orders".
        if (error) {
          console.warn('Orders unavailable:', error.message)
          if (active) setOrders([])
        } else if (active) {
          setOrders(data || [])
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  return (
    <div className="auth auth--wide">
      <div className="auth__card">
        <header className="auth__head auth__head--row">
          <div>
            <h1>Order history</h1>
            <p>Your past and current Renew orders.</p>
          </div>
          <Link to="/account" className="btn btn--outline">
            Account settings
          </Link>
        </header>

        {loading ? (
          <p className="account__status">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="orders__empty">
            <span className="auth__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M6 2l1.5 3h9L18 2" />
                <path d="M3 6h18l-1.5 13a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 6z" />
                <path d="M9 11h6" />
              </svg>
            </span>
            <h2>No orders yet</h2>
            <p>When you place an order, it will show up here.</p>
            <Link to="/products" className="btn btn--primary">
              Browse the catalog
            </Link>
          </div>
        ) : (
          <div className="orders__list">
            {orders.map((o) => (
              <article className="orders__row" key={o.id}>
                <div className="orders__main">
                  <strong>Order {o.order_number || o.id.slice(0, 8)}</strong>
                  <span className="orders__date">{formatDate(o.created_at)}</span>
                </div>
                <div className="orders__items">
                  {Array.isArray(o.items) && o.items.length
                    ? o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')
                    : '—'}
                </div>
                <span className={`orders__status orders__status--${o.status}`}>
                  {o.status}
                </span>
                <span className="orders__total">{money(o.total)}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
