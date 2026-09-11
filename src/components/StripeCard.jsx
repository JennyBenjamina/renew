import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '../lib/stripe.js'

/* Embedded Stripe card entry (Payment Element) — card fields render on our own
 * checkout page, no redirect. Uses the deferred intent flow: the Payment Element
 * is created with the amount up front; the PaymentIntent is created server-side
 * only when the customer clicks Pay, then confirmed on-page. The order is
 * recorded by the stripe-webhook (payment_intent.succeeded). */

function CardForm({ amountLabel, canPay, submitting, createIntent, onPaid, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [working, setWorking] = useState(false)
  const busy = working || submitting
  const disabled = busy || !canPay || !stripe || !elements

  const pay = async () => {
    if (!stripe || !elements || !canPay) return // never charge without the declaration
    onError('')
    setWorking(true)
    try {
      // Validate the card fields first (required for the deferred flow).
      const { error: submitError } = await elements.submit()
      if (submitError) {
        onError(submitError.message || 'Please check your card details.')
        return
      }
      // Create the PaymentIntent server-side (authoritative amount), then confirm.
      const { clientSecret, order_number } = await createIntent()
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?stripe=success&order=${encodeURIComponent(order_number)}`,
        },
        redirect: 'if_required',
      })
      if (error) {
        onError(error.message || 'Your payment could not be completed.')
        return
      }
      if (paymentIntent && ['succeeded', 'processing'].includes(paymentIntent.status)) {
        onPaid(order_number)
        return
      }
      // Otherwise Stripe handled a redirect (e.g. 3-D Secure) — the return_url
      // brings the customer back to /checkout?stripe=success.
    } catch (err) {
      onError(
        err?.notConfigured
          ? 'Card payments are temporarily unavailable. Please try again shortly.'
          : err?.message || 'Your payment could not be completed.'
      )
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="checkout__card">
      <p className="checkout__paylabel">
        Pay by <strong>card</strong> — or choose Apple&nbsp;Pay, Google&nbsp;Pay, or Link
        if you prefer. Card is selected by default; Link is optional.
      </p>
      <PaymentElement
        options={{
          layout: 'tabs',
          // Card first so it's the default tab — Link and wallets come after.
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'link'],
        }}
      />
      <button className="btn btn--primary btn--block" onClick={pay} disabled={disabled}>
        {busy ? 'Processing…' : `Pay ${amountLabel}`}
      </button>
      {!canPay && (
        <p className="checkout__payhint">
          Select an intended use and check the declaration above to enable payment.
        </p>
      )}
      <p className="checkout__secure">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Encrypted &amp; processed securely. Your card details never touch our servers.
      </p>

      <div className="checkout__stripe-trust">
        <span className="checkout__cardbrands" aria-label="Visa, Mastercard, American Express, Discover accepted">
          <img src="/pay/visa.svg" alt="Visa" className="cardbrand-img" />
          <img src="/pay/mastercard.svg" alt="Mastercard" className="cardbrand-img" />
          <img src="/pay/amex.svg" alt="American Express" className="cardbrand-img" />
          <img src="/pay/discover.svg" alt="Discover" className="cardbrand-img" />
        </span>
        <span className="checkout__poweredby">
          Powered by <span className="checkout__stripe-word">stripe</span>
        </span>
      </div>
    </div>
  )
}

export default function StripeCard({
  amount,
  amountLabel,
  canPay,
  submitting,
  createIntent,
  onPaid,
  onError,
}) {
  const stripePromise = getStripe()
  if (!stripePromise) return null

  const options = {
    mode: 'payment',
    amount: Math.max(50, Number(amount) || 50), // Stripe USD minimum is $0.50
    currency: 'usd',
    appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#a4605a', borderRadius: '10px' },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CardForm
        amountLabel={amountLabel}
        canPay={canPay}
        submitting={submitting}
        createIntent={createIntent}
        onPaid={onPaid}
        onError={onError}
      />
    </Elements>
  )
}
