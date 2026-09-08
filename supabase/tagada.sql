-- Renew — TagadaPay online-payment columns.
-- Run once in the Supabase SQL editor. Adds fields the process-payment
-- function writes when a card is charged online. Safe to re-run.

alter table public.orders
  add column if not exists tagada_payment_id text,
  add column if not exists tagada_payment_instrument_id text;

-- Handy when reconciling paid online orders against the TagadaPay dashboard.
create index if not exists orders_tagada_payment_id_idx
  on public.orders (tagada_payment_id);

comment on column public.orders.tagada_payment_id is
  'TagadaPay payment id for orders paid online (null for pay-on-delivery).';
comment on column public.orders.tagada_payment_instrument_id is
  'TagadaPay reusable payment-instrument id used for the charge.';
