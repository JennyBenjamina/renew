-- Renew — SMS marketing consent captured at checkout.
-- Run once in the Supabase SQL editor. Safe to re-run. Records whether the
-- customer ticked the "Text me offers and updates" box on the order. The
-- send-campaign function only texts numbers with sms_consent = true.

alter table public.orders
  add column if not exists sms_consent boolean not null default false;

create index if not exists orders_sms_consent_idx
  on public.orders (sms_consent);

comment on column public.orders.sms_consent is
  'True if the customer opted in to marketing texts at checkout.';
