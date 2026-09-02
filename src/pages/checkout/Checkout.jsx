import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  submitOrder,
  createSquarePayment,
  estimateShipping,
  PICKUP_PHONE,
  PICKUP_PHONE_HREF,
} from '../../lib/orders.js'
import { isSquareConfigured, getSquarePayments } from '../../lib/square.js'
import { money } from '../../lib/format.js'
import { trackInitiateCheckout, trackPurchase } from '../../lib/tracking.js'
import { validateReferral } from '../../lib/affiliates.js'
import { getStoredReferral } from '../../lib/referral.js'
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
  const [discount, setDiscount] = useState(null) // { code, percent, name } | null
  const [fulfillment, setFulfillment] = useState('delivery') // 'delivery' | 'ship'
  const [shipEst, setShipEst] = useState(null) // { fee, zoneName } | null
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

  // Validate a code against the affiliate list and apply its discount.
  const applyCode = async (raw) => {
    const code = (raw || '').trim()
    if (!code) {
      setDiscount(null)
      setCouponMsg('Enter a code to apply.')
      return
    }
    const r = await validateReferral(code)
    if (r?.valid) {
      setDiscount({ code: r.code, percent: r.discount_percent, name: r.name })
      setCoupon(r.code)
      setCouponMsg(
        `Code applied — ${r.discount_percent}% off${r.name ? `, credited to ${r.name}` : ''}.`
      )
    } else {
      setDiscount(null)
      setCouponMsg('That code isn’t valid.')
    }
  }

  const applyCoupon = () => applyCode(coupon)

  // Auto-apply a referral code carried in from a rep's link (?ref=CODE).
  useEffect(() => {
    const ref = getStoredReferral()
    if (ref) applyCode(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch a shipping estimate when shipping to a valid ZIP.
  useEffect(() => {
    if (fulfillment !== 'ship') {
      setShipEst(null)
      return
    }
    const zip = form.zip.trim()
    if (!/^\d{5}$/.test(zip)) {
      setShipEst(null)
      return
    }
    let active = true
    estimateShipping(zip).then((e) => active && setShipEst(e))
    return () => {
      active = false
    }
  }, [fulfillment, form.zip])

  const discountAmount = discount
    ? Math.round(subtotal * (discount.percent / 100) * 100) / 100
    : 0
  const shippingFee = fulfillment === 'ship' ? Number(shipEst?.fee || 0) : 0
  const totalDue = Math.max(
    0,
    Math.round((subtotal - discountAmount + shippingFee) * 100) / 100
  )

  const squareEnabled = isSquareConfigured()
  const cardRef = useRef(null)
  const [cardReady, setCardReady] = useState(false)
  const applePayRef = useRef(null)
  const [applePayReady, setApplePayReady] = useState(false)

  const noteWithAddress = () =>
    [
      `Ship to: ${form.street}, ${form.city}, ${form.state} ${form.zip}`,
      form.note.trim() && `Note: ${form.note.trim()}`,
    ]
      .filter(Boolean)
      .join('\n')

  // Mount Square's hosted card field when the Payment step is shown.
  useEffect(() => {
    if (step !== 2 || !squareEnabled) return
    let card
    let cancelled = false
    ;(async () => {
      try {
        const payments = await getSquarePayments()
        card = await payments.card()
        await card.attach('#sq-card')
        if (cancelled) {
          card.destroy()
          return
        }
        cardRef.current = card
        setCardReady(true)
      } catch (e) {
        setError(e.message || 'Could not load the payment form.')
      }
    })()
    return () => {
      cancelled = true
      setCardReady(false)
      cardRef.current = null
      if (card) {
        try {
          card.destroy()
        } catch {
          /* ignore */
        }
      }
    }
  }, [step, squareEnabled])

  // Pay-on-delivery path (used when Square isn't configured).
  const placeOrder = async () => {
    setError('')
    setBusy(true)
    try {
      const result = await submitOrder({
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          note: noteWithAddress(),
        },
        items,
        userId: user?.id,
        referralCode: discount?.code || null,
        fulfillment,
        zip: form.zip.trim(),
      })
      trackPurchase({ items, total: totalDue, orderNumber: result.order_number })
      clear()
      setDone({ order_number: result.order_number })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  // Apple Pay — only appears on supported devices (Safari + a card in Wallet)
  // and once the domain is verified in Square. The total is re-quoted whenever
  // it changes so the Apple Pay sheet shows the right amount.
  useEffect(() => {
    if (step !== 2 || !squareEnabled) {
      setApplePayReady(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const payments = await getSquarePayments()
        const req = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: totalDue.toFixed(2), label: 'Renew' },
        })
        const ap = await payments.applePay(req)
        if (cancelled) return
        applePayRef.current = ap
        setApplePayReady(true)
      } catch {
        // Unsupported browser/device — Apple Pay button just won't show.
        if (!cancelled) {
          applePayRef.current = null
          setApplePayReady(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, squareEnabled, totalDue])

  const payWithApplePay = async () => {
    if (!applePayRef.current) return
    setError('')
    setBusy(true)
    try {
      const result = await applePayRef.current.tokenize()
      if (result.status !== 'OK') {
        throw new Error(result.errors?.[0]?.message || 'Apple Pay was cancelled.')
      }
      const res = await createSquarePayment({
        token: result.token,
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          note: noteWithAddress(),
        },
        items,
        userId: user?.id,
        referralCode: discount?.code || null,
        fulfillment,
        zip: form.zip.trim(),
      })
      trackPurchase({ items, total: totalDue, orderNumber: res.order_number })
      clear()
      setDone({ order_number: res.order_number, paid: true })
    } catch (err) {
      setError(err.message || 'Apple Pay could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  // Card payment path (Square).
  const payWithSquare = async () => {
    setError('')
    if (!cardRef.current) return
    setBusy(true)
    try {
      const result = await cardRef.current.tokenize()
      if (result.status !== 'OK') {
        throw new Error(result.errors?.[0]?.message || 'Please check your card details.')
      }
      const res = await createSquarePayment({
        token: result.token,
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          note: noteWithAddress(),
        },
        items,
        userId: user?.id,
        referralCode: discount?.code || null,
        fulfillment,
        zip: form.zip.trim(),
      })
      trackPurchase({ items, total: totalDue, orderNumber: res.order_number })
      clear()
      setDone({ order_number: res.order_number, paid: true })
    } catch (err) {
      setError(err.message || 'Payment could not be completed.')
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
          <h1>{done.paid ? 'Payment received' : 'Order received'}</h1>
          <p>
            Your order <strong>{done.order_number}</strong> is confirmed.
            {done.paid
              ? ' Your card has been charged and a receipt is on its way. We’ll reach out to arrange delivery.'
              : ' We’ll reach out to arrange your delivery. No payment is taken online — you’ll pay on delivery.'}
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
              <h2>How would you like to get it?</h2>
              <div className="checkout__fulfill">
                <button
                  type="button"
                  className={`checkout__fopt ${fulfillment === 'delivery' ? 'is-active' : ''}`}
                  onClick={() => setFulfillment('delivery')}
                >
                  <strong>Local delivery</strong>
                  <span>Las Vegas area · Free</span>
                </button>
                <button
                  type="button"
                  className={`checkout__fopt ${fulfillment === 'ship' ? 'is-active' : ''}`}
                  onClick={() => setFulfillment('ship')}
                >
                  <strong>Ship to my address</strong>
                  <span>
                    {shippingFee > 0
                      ? `${money(shippingFee)} · estimated`
                      : 'Estimated from your ZIP'}
                  </span>
                </button>
              </div>

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

              {squareEnabled ? (
                <>
                  {applePayReady && (
                    <>
                      <button
                        type="button"
                        className="checkout__applepay"
                        aria-label="Pay with Apple Pay"
                        disabled={busy}
                        onClick={payWithApplePay}
                      />
                      <div className="checkout__or"><span>or pay with card</span></div>
                    </>
                  )}
                  <label className="checkout__sqlabel">Card details</label>
                  <div id="sq-card" className="checkout__sqcard" />
                  {!cardReady && !error && (
                    <p className="checkout__coupon-msg">Loading secure card form…</p>
                  )}
                  <div className="checkout__step-actions">
                    <button className="btn btn--ghost" onClick={() => setStep(1)} disabled={busy}>
                      Back
                    </button>
                    <button
                      className="btn btn--primary"
                      onClick={payWithSquare}
                      disabled={busy || !cardReady}
                    >
                      {busy ? 'Processing…' : `Pay ${money(totalDue)}`}
                    </button>
                  </div>
                  <p className="checkout__disclaimer">
                    Payments are securely processed by Square — we never see your
                    card number. For research use only. Not for human consumption.
                  </p>
                </>
              ) : (
                <>
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
                        when your order arrives.
                      </span>
                    </div>
                  </div>
                  <div className="checkout__step-actions">
                    <button className="btn btn--ghost" onClick={() => setStep(1)} disabled={busy}>
                      Back
                    </button>
                    <button className="btn btn--primary" onClick={placeOrder} disabled={busy}>
                      {busy ? 'Placing order…' : 'Place order'}
                    </button>
                  </div>
                  <p className="checkout__disclaimer">
                    For research use only. Not for human consumption. Payment is
                    collected in person on delivery.
                  </p>
                </>
              )}
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
          {(discount || fulfillment === 'ship') && (
            <div className="checkout__summary-line">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
          )}
          {discount && (
            <div className="checkout__summary-line checkout__summary-line--discount">
              <span>Discount ({discount.code} · {discount.percent}%)</span>
              <span>−{money(discountAmount)}</span>
            </div>
          )}
          {fulfillment === 'ship' && (
            <div className="checkout__summary-line">
              <span>Shipping{shipEst?.zoneName ? ` · ${shipEst.zoneName}` : ''}</span>
              <span>
                {shippingFee > 0
                  ? money(shippingFee)
                  : /^\d{5}$/.test(form.zip.trim())
                    ? '—'
                    : 'Enter ZIP'}
              </span>
            </div>
          )}
          <div className="checkout__total">
            <span>{squareEnabled ? 'Total' : 'Total due on delivery'}</span>
            <strong>{money(totalDue)}</strong>
          </div>
          <Link to="/products" className="checkout__back">
            ← Add more items
          </Link>
        </aside>
      </div>
    </div>
  )
}
