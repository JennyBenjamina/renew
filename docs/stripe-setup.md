# Stripe — go-live checklist (custom stack)

Renew's checkout uses **Stripe's embedded Payment Element**: card fields render
directly on `/checkout` (no redirect). The order is recorded only when payment
succeeds, via the Stripe webhook. Everything is env-gated — until the keys are
set, checkout falls back to TagadaPay (if configured) or pay-on-delivery.

## How it works

1. On the confirm step the Payment Element shows card fields. When the customer
   clicks Pay, the browser calls `POST /.netlify/functions/create-payment-intent`
   which re-prices the cart from Supabase, applies the affiliate discount, and
   returns a `client_secret`.
2. Stripe.js confirms the card on-page (3-D Secure handled inline; only a
   challenge would briefly redirect, returning to `/checkout?stripe=success`).
3. Stripe calls `POST /.netlify/functions/stripe-webhook`
   (`payment_intent.succeeded`) → the paid order is recorded in Supabase and the
   owner + customer emails go out. Idempotent, so Stripe retries are safe.
   (The webhook also still handles `checkout.session.completed`, harmlessly.)

## What you must set

### 1. Stripe Dashboard
- Finish account approval (runbook Part One). Business description must match the
  site: research-grade laboratory compounds, not for human/veterinary use.
- Set a recognizable **statement descriptor** (e.g. `RENEW LABS`).
- Get your **Secret key** (Developers → API keys): `sk_live_…` (or `sk_test_…`).
- Get your **Publishable key** (`pk_live_…`) — this one is safe for the browser.
- Create a **webhook endpoint** (Developers → Webhooks):
  URL `https://renewlabslv.com/.netlify/functions/stripe-webhook`,
  event `payment_intent.succeeded`. Copy its **Signing secret** (`whsec_…`).

### 2. Netlify → Environment variables (server-side, secret)
```
STRIPE_SECRET_KEY      = sk_live_…      # sk_test_… while testing
STRIPE_WEBHOOK_SECRET  = whsec_…
SITE_URL               = https://renewlabslv.com   (optional)
```

### 3. Build env (safe to expose — turns the card fields on)
```
VITE_STRIPE_ENABLED         = true
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_…
```
Note: `VITE_` vars are baked in at **build time** — after setting them you must
trigger a fresh deploy (Netlify → Deploys → Trigger deploy → Clear cache and
deploy site) for the card fields to appear.
Leave blank to stay on TagadaPay / pay-on-delivery. Stripe takes precedence over
TagadaPay when both are on.

### 4. Supabase
Run `supabase/stripe.sql` once (adds `stripe_session_id`,
`stripe_payment_intent` to the orders table).

## Test → live

1. `sk_test_…` + a test webhook secret + `VITE_STRIPE_ENABLED=true`.
2. Check out with a Stripe test card (`4242 4242 4242 4242`); confirm the paid
   order lands in admin and both emails send. Test a declined card
   (`4000 0000 0000 0002`) — it fails cleanly on Stripe's page.
3. Swap in `sk_live_…` + the live webhook secret and go.

## Pre-launch checklist (from the runbook)
- Checkout served over HTTPS (Netlify does this).
- A test transaction records the order and both emails send.
- A declined card is handled cleanly.
- The webhook endpoint shows deliveries returning 200 in the Stripe dashboard.
- Statement descriptor is recognizable.
- Customer gets both the Stripe receipt and the Renew order email.
- Site copy / product pages match the description given to Stripe.
- Keys stored only in Netlify env (never in the repo).
