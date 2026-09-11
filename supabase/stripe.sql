-- Renew — Stripe (hosted Checkout) columns.
-- Run once in the Supabase SQL editor. Adds fields the stripe-webhook function
-- writes when a card payment succeeds. Safe to re-run.

alter table public.orders
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text;

create index if not exists orders_stripe_session_idx
  on public.orders (stripe_session_id);

comment on column public.orders.stripe_session_id is
  'Stripe Checkout Session id for card-paid orders (null otherwise).';
comment on column public.orders.stripe_payment_intent is
  'Stripe PaymentIntent id for the charge — used to reconcile refunds/disputes.';
