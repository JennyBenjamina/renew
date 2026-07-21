-- Renew — customer accounts + admin/customer role separation
-- Run this in the Supabase SQL editor AFTER schema.sql and storage.sql.
--
-- What this does:
--   • Creates a `profiles` table (one row per auth user) holding role + details.
--   • New signups automatically become role 'customer'.
--   • Only users with role 'admin' can write to products / upload images.
--   • Customers can never edit the catalog, and cannot promote themselves.
--
-- IMPORTANT: after running this, set your own account to admin at the bottom,
-- and re-enable email signups (Authentication → Providers → Email →
-- "Allow new users to sign up" = ON) so customers can register.

-- ---------------------------------------------------------------------------
-- 1. Profiles table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  full_name        text,
  phone            text,
  role             text not null default 'customer' check (role in ('customer','admin')),
  address_street   text,
  address_city     text,
  address_state    text,
  address_postal   text,
  address_country  text,
  created_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Admin check helper (security definer so it can read profiles under RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Auto-create a profile for each new signup, from signUp metadata
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, phone, role,
    address_street, address_city, address_state, address_postal, address_country
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'customer',
    new.raw_user_meta_data->>'address_street',
    new.raw_user_meta_data->>'address_city',
    new.raw_user_meta_data->>'address_state',
    new.raw_user_meta_data->>'address_postal',
    new.raw_user_meta_data->>'address_country'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Prevent non-admins from changing their own role (privilege escalation)
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Block role changes only for signed-in non-admins. When auth.uid() is null
  -- (Supabase SQL editor / service role / dashboard) the change is allowed, so
  -- you can promote accounts from the dashboard.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- 5. Profiles RLS: read/update your own; admins can read all
-- ---------------------------------------------------------------------------
drop policy if exists "read own or admin all" on public.profiles;
create policy "read own or admin all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 6. Restrict product writes to admins only (replaces the old
--    "any authenticated user" policies from schema.sql)
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can insert products" on public.products;
drop policy if exists "Authenticated can update products" on public.products;
drop policy if exists "Authenticated can delete products" on public.products;

create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Restrict product-image storage writes to admins only
-- ---------------------------------------------------------------------------
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Backfill profiles for any existing users, then set YOUR admin account.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, role)
select id, email, 'customer' from auth.users
on conflict (id) do nothing;

-- 👇 CHANGE THIS EMAIL to your admin login, then run. Without this, the admin
--    dashboard can no longer edit products (writes now require the admin role).
update public.profiles set role = 'admin'
where email = 'your-admin-email@example.com';
