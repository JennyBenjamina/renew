-- Renew — track whether an order's affiliate commission has been paid out.
-- Run once in the Supabase SQL editor. Safe to re-run. Toggled from the admin
-- Affiliates page; purely for the store owner's payout bookkeeping.

alter table public.orders
  add column if not exists commission_paid boolean not null default false;

create index if not exists orders_commission_paid_idx
  on public.orders (commission_paid);

comment on column public.orders.commission_paid is
  'True once the affiliate commission for this order has been paid to the rep.';
