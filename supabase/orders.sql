-- Renew — orders table (for the customer order-history page)
-- Run in the Supabase SQL editor after auth_roles.sql.
-- Orders are read-only from the storefront; they'll be created by your
-- checkout/payment flow later (server-side). Until then the table is simply
-- empty and the account order-history page shows an empty state.

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  order_number  text,
  status        text not null default 'pending'
                  check (status in ('pending','paid','shipped','delivered','cancelled')),
  total         numeric(10, 2) not null default 0,
  items         jsonb not null default '[]',   -- [{name, qty, price}, ...]
  created_at    timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

-- Customers can read only their own orders; admins can read all.
drop policy if exists "read own orders" on public.orders;
create policy "read own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

-- No public insert/update policy: orders are written by trusted server code
-- (service role) once checkout exists.
