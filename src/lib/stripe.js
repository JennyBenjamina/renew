/* Stripe (embedded Payment Element) client config.
 *
 * Card fields render on our own checkout page via Stripe.js — no redirect. Two
 * build-time env vars are needed (both safe to expose; the publishable key is
 * designed for the browser):
 *   VITE_STRIPE_ENABLED         = "true"
 *   VITE_STRIPE_PUBLISHABLE_KEY = pk_live_… (or pk_test_…)
 *
 * The secret key and charging stay server-side (create-payment-intent). While
 * this is off, checkout falls back to TagadaPay (if set) or pay-on-delivery. */

import { loadStripe } from '@stripe/stripe-js'

const PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim()

export const stripeEnabled =
  String(import.meta.env.VITE_STRIPE_ENABLED || '').trim().toLowerCase() === 'true' &&
  Boolean(PUBLISHABLE_KEY)

// Lazily create the Stripe.js instance once, only when actually needed.
let _stripePromise = null
export function getStripe() {
  if (!PUBLISHABLE_KEY) return null
  if (!_stripePromise) _stripePromise = loadStripe(PUBLISHABLE_KEY)
  return _stripePromise
}
