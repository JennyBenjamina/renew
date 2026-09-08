# TagadaPay — go-live checklist

Renew's checkout is wired for TagadaPay **Direct S2S** card payments. Everything
is env-gated: while the keys below are unset, the site keeps working exactly as
today (pay-on-delivery). The moment the keys are in place, the confirm step
becomes a secure card form.

## How it works

1. On the checkout confirm step, the browser tokenizes the card with
   `@tagadapay/core-js` — the card number never touches our servers (PCI scope-out).
2. The token is posted to `/.netlify/functions/process-payment`.
3. That function re-prices the cart from Supabase (the client amount is ignored),
   re-applies any affiliate discount, charges the card via TagadaPay, then records
   the paid order and sends the owner + customer emails — same as before.

## What you must supply once KYB clears

From the TagadaPay dashboard, once your merchant account (TPA) is **active** and
a store is provisioned:

- **Processing key** — a TPA-restricted key, `tp_sk_test_…` (sandbox) or
  `tp_sk_live_…` (live).
- **Store ID** — `store_…` for your store.

### Netlify → Site settings → Environment variables (server-side, secret)

```
TAGADA_API_KEY   = tp_sk_live_…        # or tp_sk_test_… while testing
TAGADA_STORE_ID  = store_…
# optional:
TAGADA_BASE_URL  = https://api.tagadapay.io
TAGADA_CURRENCY  = USD
SITE_URL         = https://renewlabslv.com
```

### Build env (turns the card form on — safe to expose)

```
VITE_TAGADA_ENV  = test          # sandbox card form + test keys
VITE_TAGADA_ENV  = production    # live card form + live keys
```

Leave `VITE_TAGADA_ENV` blank to stay on pay-on-delivery.

### Supabase

Run `supabase/tagada.sql` once (adds `tagada_payment_id` +
`tagada_payment_instrument_id` to the orders table).

## Test → live

1. Set `VITE_TAGADA_ENV=test` and the `tp_sk_test_…` key + test store id.
2. Place a test order with a TagadaPay test card; confirm the paid order lands in
   admin and both emails send.
3. Flip `VITE_TAGADA_ENV=production` and swap in the `tp_sk_live_…` key + live
   store id.

## Known edge to verify on live keys

Most US Visa/Mastercard/Amex charges clear in one step. If an issuer forces
extra 3-D Secure authentication, `process-payment` returns
`{ requireAction:'redirect', redirectUrl }` and the shopper is sent to complete
it. Reconciling the order **after** that redirect needs a status/verify endpoint
or webhook confirmed with TagadaPay — validate this branch against live keys
before relying on it. It does not affect the common frictionless path.
