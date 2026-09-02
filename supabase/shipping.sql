-- Renew — shipment tracking on orders
-- Run in the Supabase SQL editor AFTER orders.sql. Safe to re-run.
-- Adds carrier + tracking number, and a 'shipped' delivery status.

alter table public.orders add column if not exists carrier         text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists shipped_at       timestamptz;
-- Shipping fee charged (0 for free local delivery).
alter table public.orders add column if not exists shipping        numeric(10,2) not null default 0;

-- Add 'shipped' to the allowed delivery statuses.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','ready','shipped','delivered','cancelled'));
