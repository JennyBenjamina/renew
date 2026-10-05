-- Renew — delivery proof (photo + timestamp) captured by the delivery person.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table public.orders
  add column if not exists delivery_photo_url text,
  add column if not exists delivered_at timestamptz;

comment on column public.orders.delivery_photo_url is
  'Public URL of the delivery-confirmation photo taken by the courier.';
comment on column public.orders.delivered_at is
  'When the order was marked delivered (photo confirmation sent).';
