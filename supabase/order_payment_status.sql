-- Renew — payment status on orders (pay-on-delivery bookkeeping)
-- Run in the Supabase SQL editor AFTER orders.sql. Safe to re-run.
--
-- This is separate from the fulfillment `status` (pending/ready/delivered/
-- cancelled). `payment_status` tracks whether money was actually collected:
--   'unpaid'    (default) — not yet paid
--   'paid'                — payment collected (on delivery, or online later)
--   'cancelled'           — order/payment cancelled
-- Admins update it from the admin Orders page (covered by the existing
-- "admins update orders" policy in orders.sql — no new policy needed).

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid','paid','cancelled'));
