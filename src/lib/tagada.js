/* TagadaPay client config.
 *
 * Online card payments turn on only when VITE_TAGADA_ENV is set (to "production"
 * or "test"/"sandbox"). While it's blank — e.g. before KYB clears — the checkout
 * falls back to the existing pay-on-delivery flow. The card SDK is loaded lazily
 * inside <CardPayment> so nothing TagadaPay-related runs until it's enabled.
 *
 * No secret ever lives here: the browser only tokenizes the card (PAN goes
 * straight to Tagada's tokenizer). Charging happens server-side in the
 * process-payment Netlify function with the TPA-restricted processing key. */

const RAW_ENV = (import.meta.env.VITE_TAGADA_ENV || '').trim().toLowerCase()

/** Is online card payment turned on for this build? */
export const tagadaEnabled = RAW_ENV === 'production' || RAW_ENV === 'test' || RAW_ENV === 'sandbox'

/** SDK Environment value: only "production" is live; everything else is test. */
export const tagadaEnvironment = RAW_ENV === 'production' ? 'production' : 'development'
