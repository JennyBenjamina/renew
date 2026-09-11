/* Stripe (hosted Checkout) client config.
 *
 * Card payments via Stripe turn on when VITE_STRIPE_ENABLED is "true". No key
 * lives here — the hosted-checkout flow only needs a redirect URL that the
 * create-checkout-session Netlify function returns (the secret key stays
 * server-side). While this is off, checkout falls back to TagadaPay (if that's
 * configured) or pay-on-delivery. */

export const stripeEnabled =
  String(import.meta.env.VITE_STRIPE_ENABLED || '').trim().toLowerCase() === 'true'
