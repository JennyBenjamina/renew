-- Renew — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) to create the
-- products table used by the storefront.

create table if not exists public.products (
  id                text primary key,
  slug              text unique not null,
  name              text not null,
  category          text not null default 'Compounds',
  description       text,
  price             numeric(10, 2) not null,
  compare_at_price  numeric(10, 2),
  purity            text,
  badges            text[] default '{}',
  in_stock          boolean not null default true,
  featured          boolean not null default false,
  image_hue         int default 150,   -- used for the placeholder product art
  created_at        timestamptz not null default now()
);

-- Public storefront: anyone may read the catalog, no one may write via the
-- anon key. Manage inventory through the Supabase dashboard or a service role.
alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products
  for select
  using (true);
