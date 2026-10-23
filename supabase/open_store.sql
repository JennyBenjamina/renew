-- Renew — open the store to everyone (removes the members-only gate)
-- Run ONCE in the Supabase SQL editor, BEFORE or right as you deploy the
-- matching site code. Safe to re-run. Undoes the access parts of
-- researcher_approval.sql; the extra profile columns are left in place.

-- 1. Anyone (including logged-out visitors) can read the product catalog.
drop policy if exists "Approved accounts read products" on public.products;
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  using (true);

-- 2. New accounts no longer wait for approval; approve anyone still pending.
alter table public.profiles alter column approval_status set default 'approved';
update public.profiles
   set approval_status = 'approved', reviewed_at = coalesce(reviewed_at, now())
 where approval_status = 'pending';

-- 3. Signup: any email address, institution optional. Still records the
--    attestations and address the site sends.
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
    'approved',
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
