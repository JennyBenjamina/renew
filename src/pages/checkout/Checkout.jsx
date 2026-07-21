import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { submitOrder, PICKUP_PHONE, PICKUP_PHONE_HREF } from '../../lib/orders.js'
import { money } from '../../lib/format.js'
import './checkout.css'

export default function Checkout() {
  const { items, subtotal, count, clear } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    note: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null) // { order_number }

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      return setError('Please enter your name, email, and phone number.')
    }
    setBusy(true)
    try {
      const result = await submitOrder({
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          note: form.note.trim(),
        },
        items,
        userId: user?.id,
      })
      clear()
      setDone({ order_number: result.order_number })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  // Confirmation screen
  if (done) {
    return (
      <div className="checkout">
        <div className="container checkout__confirm">
          <span className="checkout__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h1>Order received</h1>
          <p>
            Your order <strong>{done.order_number}</strong> is in. We’ll reach out
            to arrange your local pickup. No payment is taken online — you’ll pay
            when you collect your order.
          </p>
          <p className="checkout__confirm-contact">
            Questions? Call us at{' '}
            <a href={PICKUP_PHONE_HREF}>{PICKUP_PHONE}</a>.
          </p>
          <Link to="/products" className="btn btn--primary">
            Continue browsing
          </Link>
        </div>
      </div>
    )
  }

  // Empty cart
  if (count === 0) {
    return (
      <div className="checkout">
        <div className="container checkout__confirm">
          <h1>Your cart is empty</h1>
          <p>Add some research compounds before checking out.</p>
          <Link to="/products" className="btn btn--primary">
            Browse products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout">
      <header className="checkout__hero deco-band">
        <div className="container">
          <span className="eyebrow">Local pickup checkout</span>
          <h1>Reserve your order</h1>
          <p>
            No payment is taken online. Submit your order and we’ll contact you to
            arrange a local pickup — you pay in person when you collect it.
          </p>
        </div>
      </header>

      <div className="container checkout__grid">
        <form className="checkout__form" onSubmit={onSubmit}>
          <h2>Your details</h2>
          {error && <div className="auth__alert auth__alert--error">{error}</div>}

          <label>
            Full Name
            <input value={form.name} onChange={set('name')}
              placeholder="Enter your full name" autoComplete="name" required />
          </label>
          <div className="checkout__row">
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" autoComplete="email" required />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={set('phone')}
                placeholder="(555) 123-4567" autoComplete="tel" required />
            </label>
          </div>
          <label>
            Note <span className="checkout__optional">Optional</span>
            <textarea rows={3} value={form.note} onChange={set('note')}
              placeholder="Preferred pickup time, questions, etc." />
          </label>

          <div className="checkout__contact">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" />
            </svg>
            <span>
              Questions about pickup? Call{' '}
              <a href={PICKUP_PHONE_HREF}>{PICKUP_PHONE}</a>.
            </span>
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit order'}
          </button>
          <p className="checkout__disclaimer">
            For research use only. Not for human consumption. Payment is collected
            in person at pickup.
          </p>
        </form>

        <aside className="checkout__summary">
          <h2>Order summary</h2>
          <div className="checkout__items">
            {items.map((i) => (
              <div className="checkout__item" key={i.id}>
                <span className="checkout__item-name">
                  {i.qty}× {i.name}
                </span>
                <span>{money(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="checkout__total">
            <span>Total due at pickup</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <Link to="/products" className="checkout__back">
            ← Add more items
          </Link>
        </aside>
      </div>
    </div>
  )
}
