-- Renew — affiliate / sales-rep referral program
-- Run in the Supabase SQL editor AFTER auth_roles.sql and orders.sql. Safe to re-run.
--
-- Each rep has a unique `code` that doubles as:
--   1. a referral link  →  https://renewlabslv.com/?ref=CODE
--   2. a discount code the customer can enter at checkout for `discount_percent` off
-- Orders store the code + affiliate_id + discount so every sale is attributed.
-- Reps log in (profile role 'affiliate') and can read only their own orders.

-- 1. Allow the 'affiliate' role on profiles.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer','admin','affiliate'));

-- 2. Affiliates (sales reps)
create table if not exists public.affiliates (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null, -- linked on signup
  code              text unique not null,
  name              text,
  email             text,
  discount_percent  int not null default 10 check (discount_percent between 0 and 90),
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists affiliates_user_idx on public.affiliates (user_id);
create index if not exists affiliates_code_idx on public.affiliates (lower(code));

alter table public.affiliates enable row level security;

-- 3. Order attribution columns
alter table public.orders add column if not exists referral_code text;
alter table public.orders add column if not exists affiliate_id  uuid references public.affiliates(id) on delete set null;
alter table public.orders add column if not exists discount      numeric(10,2) not null default 0;
alter table public.orders add column if not exists subtotal      numeric(10,2);
create index if not exists orders_affiliate_idx on public.orders (affiliate_id, created_at desc);

-- 4. When a rep signs up with their registered email, promote them to
--    'affiliate' and link their affiliate row to the new auth user.
create or replace function public.affiliate_set_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.affiliates a
    where lower(a.email) = lower(new.email) and a.active
  ) then
    new.role := 'affiliate';
  end if;
  return new;
end; $$;

drop trigger if exists affiliate_set_role on public.profiles;
create trigger affiliate_set_role
  before insert on public.profiles
  for each row execute function public.affiliate_set_role();

create or replace function public.affiliate_link_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.affiliates set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end; $$;

drop trigger if exists affiliate_link_user on public.profiles;
create trigger affiliate_link_user
  after insert on public.profiles
  for each row execute function public.affiliate_link_user();

-- 5. Row-level security
-- Admins fully manage affiliates; a rep may read only their own affiliate row.
drop policy if exists "admins manage affiliates" on public.affiliates;
create policy "admins manage affiliates" on public.affiliates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rep reads own affiliate" on public.affiliates;
create policy "rep reads own affiliate" on public.affiliates
  for select to authenticated
  using (user_id = auth.uid());

-- Reps can read the orders attributed to them (in addition to existing policies).
drop policy if exists "affiliates read their orders" on public.orders;
create policy "affiliates read their orders" on public.orders
  for select to authenticated
  using (
    exists (
      select 1 from public.affiliates a
      where a.id = orders.affiliate_id and a.user_id = auth.uid()
    )
  );

-- 6. Seed your four reps here, then have each rep sign up with the SAME email
--    to activate their login + dashboard. (Edit codes / emails / discounts.)
-- insert into public.affiliates (code, name, email, discount_percent) values
--   ('jake',  'Jake',  'jake@example.com',  10),
--   ('maria', 'Maria', 'maria@example.com', 10),
--   ('sam',   'Sam',   'sam@example.com',   10),
--   ('alex',  'Alex',  'alex@example.com',  10)
-- on conflict (code) do nothing;
