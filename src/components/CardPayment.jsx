import { useState } from 'react'
import { useCardTokenization } from '@tagadapay/core-js/react'
import { tagadaEnvironment } from '../lib/tagada.js'

/* Card entry + tokenization for the TagadaPay online-payment flow.
 *
 * Lives in its own component so the card SDK only mounts when online payments
 * are enabled (Checkout renders this conditionally). The PAN is tokenized in
 * the browser and never sent to our server — we hand the resulting `tagadaToken`
 * up to the parent, which charges it via the process-payment function. */

const onlyDigits = (s) => s.replace(/\D/g, '')

// Light formatting for a friendlier field; the tokenizer does real validation.
const formatCardNumber = (s) => onlyDigits(s).slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
const formatExpiry = (s) => {
  const d = onlyDigits(s).slice(0, 4)
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`
}

export default function CardPayment({ amountLabel, canPay, submitting, onPay, onError }) {
  const { tokenizeCard, isInitialized } = useCardTokenization({
    environment: tagadaEnvironment,
    autoInitialize: true,
  })

  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' })
  const [tokenizing, setTokenizing] = useState(false)

  const set = (f, fmt) => (e) =>
    setCard((c) => ({ ...c, [f]: fmt ? fmt(e.target.value) : e.target.value }))

  const cardValid =
    onlyDigits(card.number).length >= 13 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    onlyDigits(card.cvc).length >= 3 &&
    card.name.trim().length > 1

  const busy = tokenizing || submitting
  const disabled = busy || !canPay || !cardValid || !isInitialized

  const pay = async () => {
    onError('')
    setTokenizing(true)
    try {
      const { tagadaToken, rawToken } = await tokenizeCard({
        cardNumber: onlyDigits(card.number),
        expiryDate: card.expiry,
        cvc: onlyDigits(card.cvc),
        cardholderName: card.name.trim(),
      })
      const scaRequired = rawToken?.metadata?.auth?.scaRequired === true
      await onPay({ tagadaToken, scaRequired, sessionData: rawToken?.metadata?.auth })
    } catch (err) {
      onError(err?.message || 'Your card could not be verified. Please check the details.')
    } finally {
      setTokenizing(false)
    }
  }

  return (
    <div className="checkout__card">
      <label>
        Card number
        <input
          value={card.number}
          onChange={set('number', formatCardNumber)}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          autoComplete="cc-number"
        />
      </label>
      <div className="checkout__row">
        <label>
          Expiry
          <input
            value={card.expiry}
            onChange={set('expiry', formatExpiry)}
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
          />
        </label>
        <label>
          CVC
          <input
            value={card.cvc}
            onChange={set('cvc', (v) => onlyDigits(v).slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
          />
        </label>
      </div>
      <label>
        Name on card
        <input
          value={card.name}
          onChange={set('name')}
          placeholder="Jane Doe"
          autoComplete="cc-name"
        />
      </label>

      <button className="btn btn--primary btn--block" onClick={pay} disabled={disabled}>
        {busy ? 'Processing…' : `Pay ${amountLabel}`}
      </button>
      <p className="checkout__secure">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Encrypted &amp; processed securely. Your card details never touch our servers.
      </p>
    </div>
  )
}
