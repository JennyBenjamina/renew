-- Renew — orders table (local-pickup checkout, no payment)
-- Run in the Supabase SQL editor after auth_roles.sql. Safe to re-run.
--
-- Orders are created server-side by the Netlify function (submit-order) using
-- the service-role key, so there is no public insert policy. Logged-in
-- customers can read their own orders; admins can read all.

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text unique,
  user_id         uuid references auth.users(id) on delete set null, -- null for guests
  customer_name   text,
  customer_email  text,
  customer_phone  text,
  note            text,
  fulfillment     text not null default 'local_pickup',
  status          text not null default 'pending'
                    check (status in ('pending','ready','delivered','cancelled')),
  total           numeric(10, 2) not null default 0,
  items           jsonb not null default '[]',   -- [{id,name,qty,price}, ...]
  created_at      timestamptz not null default now()
);

-- If an older version of this table already exists, add the new columns.
alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists order_number   text;
alter table public.orders add column if not exists customer_name  text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists note           text;
alter table public.orders add column if not exists fulfillment    text default 'local_pickup';

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create unique index if not exists orders_number_idx on public.orders (order_number);

alter table public.orders enable row level security;

-- Allow the 'delivered' status on tables created before it was added.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','ready','delivered','cancelled'));

-- Customers read only their own orders; admins read all. New orders are created
-- server-side (service role), so there is no public insert policy.
drop policy if exists "read own orders" on public.orders;
create policy "read own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

-- Admins can update orders (e.g. change status pending → delivered).
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
