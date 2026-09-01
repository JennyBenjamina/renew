-- Renew — Square payment reference on orders
-- Run in the Supabase SQL editor AFTER orders.sql. Safe to re-run.
-- Stores the Square payment id for card-paid orders (for reconciliation/refunds).

alter table public.orders add column if not exists square_payment_id text;
