-- Renew — researcher accounts + manual admin approval (Stripe compliance gate)
-- Run ONCE in the Supabase SQL editor, AFTER auth_roles.sql and affiliates.sql,
-- and BEFORE deploying the matching site code. Safe to re-run.
--
-- What this does:
--   1. Adds approval status + researcher registration fields to profiles.
--   2. Marks every EXISTING account approved (current customers/affiliates keep
--      access). Every account created after this runs starts as 'pending'.
--   3. Validates new signups server-side (institutional email, institution,
--      all four attestations) so the form can't be bypassed via the API.
--      Personal email providers (Gmail, Yahoo, Outlook…) are refused.
--   4. Stops non-admins from approving themselves.
--   5. Locks the products table: only approved accounts and admins can read it.

-- ---------------------------------------------------------------------------
-- 1. New profile columns
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists approval_status text;
alter table public.profiles add column if not exists institution      text;
alter table public.profiles add column if not exists attest_age_21     boolean not null default false;
alter table public.profiles add column if not exists attest_researcher boolean not null default false;
alter table public.profiles add column if not exists attest_research_only boolean not null default false;
alter table public.profiles add column if not exists attest_terms      boolean not null default false;
alter table public.profiles add column if not exists terms_version     text;
alter table public.profiles add column if not exists attested_at       timestamptz;
alter table public.profiles add column if not exists reviewed_at       timestamptz;
alter table public.profiles add column if not exists reviewed_by       uuid references auth.users (id) on delete set null;
alter table public.profiles add column if not exists review_note       text;

-- 2. Grandfather existing accounts, then make 'pending' the default.
update public.profiles
   set approval_status = 'approved', reviewed_at = coalesce(reviewed_at, now())
 where approval_status is null;

alter table public.profiles alter column approval_status set default 'pending';
alter table public.profiles alter column approval_status set not null;
alter table public.profiles drop constraint if exists profiles_approval_status_check;
alter table public.profiles add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists profiles_approval_status_idx
  on public.profiles (approval_status, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Access helper: admins and approved accounts only
-- ---------------------------------------------------------------------------
create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or approval_status = 'approved')
  );
$$;

-- Personal email providers that may not register.
create or replace function public.is_personal_email(addr text)
returns boolean
language sql
immutable
as $$
  select lower(split_part(coalesce(addr, ''), '@', 2)) = any (array[
    'gmail.com','googlemail.com','yahoo.com','ymail.com','rocketmail.com',
    'outlook.com','hotmail.com','live.com','msn.com','icloud.com','me.com',
    'mac.com','aol.com','proton.me','protonmail.com','pm.me','gmx.com','gmx.net',
    'mail.com','zoho.com','zohomail.com','yandex.com','yandex.ru','tutanota.com',
    'tuta.io','hey.com','fastmail.com','inbox.com','att.net','sbcglobal.net',
    'comcast.net','verizon.net','cox.net','charter.net','earthlink.net',
    'duck.com','mailinator.com','qq.com','163.com'
  ]);
$$;

-- ---------------------------------------------------------------------------
-- 4. New-signup profile creation + validation
--    Signups from the site send metadata (institution + attestations); those
--    are validated and rejected if incomplete. Accounts you create by hand in
--    the Supabase dashboard (no metadata) are allowed but still start pending.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  from_site boolean := meta <> '{}'::jsonb;
begin
  if from_site then
    if public.is_personal_email(new.email) then
      raise exception 'Please register with your institutional or business email. Personal email providers are not accepted.';
    end if;
    if length(trim(coalesce(meta->>'institution', ''))) < 3 then
      raise exception 'Registered business or institution is required.';
    end if;
    if coalesce((meta->>'attest_age_21')::boolean, false) is not true
       or coalesce((meta->>'attest_researcher')::boolean, false) is not true
       or coalesce((meta->>'attest_research_only')::boolean, false) is not true
       or coalesce((meta->>'attest_terms')::boolean, false) is not true then
      raise exception 'All compliance statements must be confirmed.';
    end if;
  end if;

  insert into public.profiles (
    id, email, full_name, phone, role, approval_status,
    institution, attest_age_21, attest_researcher, attest_research_only,
    attest_terms, terms_version, attested_at,
    address_street, address_city, address_state, address_postal, address_country
  )
  values (
    new.id,
    new.email,
    meta->>'full_name',
    meta->>'phone',
    'customer',
    'pending',
    nullif(trim(meta->>'institution'), ''),
    coalesce((meta->>'attest_age_21')::boolean, false),
    coalesce((meta->>'attest_researcher')::boolean, false),
    coalesce((meta->>'attest_research_only')::boolean, false),
    coalesce((meta->>'attest_terms')::boolean, false),
    meta->>'terms_version',
    case when from_site then now() end,
    meta->>'address_street',
    meta->>'address_city',
    meta->>'address_state',
    meta->>'address_postal',
    meta->>'address_country'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Non-admins can't change their own role, approval or review fields
--    (replaces guard_profile_role from auth_roles.sql; same trigger name).
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role                 := old.role;
    new.approval_status      := old.approval_status;
    new.reviewed_at          := old.reviewed_at;
    new.reviewed_by          := old.reviewed_by;
    new.review_note          := old.review_note;
    new.institution          := old.institution;
    new.email                := old.email;
    new.attest_age_21        := old.attest_age_21;
    new.attest_researcher    := old.attest_researcher;
    new.attest_research_only := old.attest_research_only;
    new.attest_terms         := old.attest_terms;
    new.terms_version        := old.terms_version;
    new.attested_at          := old.attested_at;
  end if;
  return new;
end;
$$;

-- Admins can review and update any profile (approve / reject).
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Catalog: only approved accounts and admins can read products
-- ---------------------------------------------------------------------------
drop policy if exists "Public can read products" on public.products;
drop policy if exists "Approved accounts read products" on public.products;
create policy "Approved accounts read products"
  on public.products for select
  using (public.is_approved());
