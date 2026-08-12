import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { submitOrder, PICKUP_PHONE, PICKUP_PHONE_HREF } from '../../lib/orders.js'
import { money } from '../../lib/format.js'
import { trackInitiateCheckout, trackPurchase } from '../../lib/tracking.js'
import './checkout.css'

const STEPS = ['Shipping', 'Review', 'Payment']
const HOLD_SECONDS = 15 * 60

export default function Checkout() {
  const { items, subtotal, count, clear } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    street: profile?.address_street || '',
    city: profile?.address_city || '',
    state: profile?.address_state || '',
    zip: profile?.address_postal || '',
    note: '',
  })
  const [coupon, setCoupon] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS)

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  // Fire InitiateCheckout once when a real cart loads.
  useEffect(() => {
    if (count > 0) trackInitiateCheckout(items, subtotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cart-hold countdown.
  useEffect(() => {
    if (done || count === 0) return
    const t = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000
    )
    return () => clearInterval(t)
  }, [done, count])

  const timer = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [secondsLeft])

  const shippingValid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.street.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.zip.trim()

  const applyCoupon = () => {
    setCouponMsg(
      coupon.trim()
        ? 'No active promotions right now.'
        : 'Enter a code to apply.'
    )
  }

  const placeOrder = async () => {
    setError('')
    setBusy(true)
    try {
      const noteWithAddress = [
        `Ship to: ${form.street}, ${form.city}, ${form.state} ${form.zip}`,
        form.note.trim() && `Note: ${form.note.trim()}`,
      ]
        .filter(Boolean)
        .join('\n')

      const result = await submitOrder({
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          note: noteWithAddress,
        },
        items,
        userId: user?.id,
      })
      trackPurchase({ items, total: subtotal, orderNumber: result.order_number })
      clear()
      setDone({ order_number: result.order_number })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  // Confirmation
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
            to arrange your delivery. No payment is taken online — you’ll pay on
            delivery.
          </p>
          <p className="checkout__confirm-contact">
            Questions? Call us at <a href={PICKUP_PHONE_HREF}>{PICKUP_PHONE}</a>.
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
        <div className="container checkout__hero-row">
          <div>
            <span className="eyebrow">Secure checkout</span>
            <h1>Complete your order</h1>
          </div>
          <div className="checkout__timer" aria-live="polite">
            Cart reserved for <strong>{timer}</strong>
          </div>
        </div>
      </header>

      <div className="container checkout__grid">
        <div className="checkout__main">
          <ol className="checkout__steps-nav">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`checkout__stepitem ${i === step ? 'is-active' : ''} ${
                  i < step ? 'is-done' : ''
                }`}
              >
                <span className="checkout__stepnum">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          {error && <div className="auth__alert auth__alert--error">{error}</div>}

          {/* Step 1 — Shipping */}
          {step === 0 && (
            <div className="checkout__form">
              <h2>Shipping details</h2>
              <label>
                Full Name
                <input value={form.name} onChange={set('name')}
                  placeholder="Jane Doe" autoComplete="name" />
              </label>
              <div className="checkout__row">
                <label>
                  Email
                  <input type="email" value={form.email} onChange={set('email')}
                    placeholder="you@example.com" autoComplete="email" />
                </label>
                <label>
                  Phone
                  <input value={form.phone} onChange={set('phone')}
                    placeholder="(555) 123-4567" autoComplete="tel" />
                </label>
              </div>
              <label>
                Street Address
                <input value={form.street} onChange={set('street')}
                  placeholder="123 Research Blvd" autoComplete="address-line1" />
              </label>
              <div className="checkout__row checkout__row--3">
                <label>
                  City
                  <input value={form.city} onChange={set('city')}
                    placeholder="San Diego" autoComplete="address-level2" />
                </label>
                <label>
                  State
                  <input value={form.state} onChange={set('state')}
                    placeholder="CA" autoComplete="address-level1" />
                </label>
                <label>
                  ZIP
                  <input value={form.zip} onChange={set('zip')}
                    placeholder="92101" autoComplete="postal-code" />
                </label>
              </div>
              <button
                className="btn btn--primary btn--block"
                disabled={!shippingValid}
                onClick={() => setStep(1)}
              >
                Continue to review
              </button>
            </div>
          )}

          {/* Step 2 — Review */}
          {step === 1 && (
            <div className="checkout__form">
              <h2>Review your order</h2>
              <div className="checkout__review-block">
                <div className="checkout__review-head">
                  <span>Shipping to</span>
                  <button className="checkout__edit" onClick={() => setStep(0)}>
                    Edit
                  </button>
                </div>
                <p className="checkout__review-addr">
                  {form.name}
                  <br />
                  {form.street}, {form.city}, {form.state} {form.zip}
                  <br />
                  {form.email} · {form.phone}
                </p>
              </div>

              <label>
                Order note <span className="checkout__optional">Optional</span>
                <textarea rows={3} value={form.note} onChange={set('note')}
                  placeholder="Preferred delivery time, gate code, etc." />
              </label>

              <div className="checkout__coupon">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Promo code"
                />
                <button type="button" className="btn btn--outline" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              {couponMsg && <p className="checkout__coupon-msg">{couponMsg}</p>}

              <div className="checkout__step-actions">
                <button className="btn btn--ghost" onClick={() => setStep(0)}>
                  Back
                </button>
                <button className="btn btn--primary" onClick={() => setStep(2)}>
                  Continue to payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step === 2 && (
            <div className="checkout__form">
              <h2>Payment</h2>
              {/* TODO: TagadaPay card payment mounts here once the account is
                  approved and keys are available. For now, pay on delivery. */}
              <div className="checkout__pay-notice">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                  strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
                <div>
                  <strong>Pay on delivery</strong>
                  <span>
                    No payment is taken online right now — you’ll pay in person
                    when your order arrives. Card checkout is coming soon.
                  </span>
                </div>
              </div>

              <div className="checkout__step-actions">
                <button className="btn btn--ghost" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="btn btn--primary"
                  onClick={placeOrder}
                  disabled={busy}
                >
                  {busy ? 'Placing order…' : 'Place order'}
                </button>
              </div>
              <p className="checkout__disclaimer">
                For research use only. Not for human consumption. Payment is
                collected in person on delivery.
              </p>
            </div>
          )}
        </div>

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
            <span>Total due on delivery</span>
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
