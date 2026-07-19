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


-- ---------------------------------------------------------------------------
-- Compliance acceptance log
-- Records each time a visitor accepts the compliance/age gate.
-- Intentionally minimal: terms version + timestamp only (no IP, no PII), so it
-- carries no privacy-policy baggage. Insert-only for the anon key: visitors can
-- write an acceptance but cannot read the log back. Review it from the Supabase
-- dashboard or with a service role.
-- ---------------------------------------------------------------------------
create table if not exists public.acceptance_log (
  id            uuid primary key default gen_random_uuid(),
  terms_version text not null,
  remembered    boolean not null default false,
  accepted_at   timestamptz not null default now()
);

alter table public.acceptance_log enable row level security;

-- Allow anonymous inserts only. No select policy => the anon key cannot read
-- the log, so acceptances can be written but not enumerated by the public.
drop policy if exists "Anyone can log acceptance" on public.acceptance_log;
create policy "Anyone can log acceptance"
  on public.acceptance_log
  for insert
  with check (true);
