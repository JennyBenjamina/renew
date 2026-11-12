-- Renew — required account at checkout + full registration fields
-- Run ONCE in the Supabase SQL editor, BEFORE deploying the matching site code
-- (new signups will fail with "Database error saving new user" if the site is
-- live before this runs). Safe to re-run.
--
-- What this does:
--   1. Adds the new registration fields to profiles (entity type, e-signature,
--      referral code).
--   2. Replaces the signup trigger: every site signup must include legal name,
--      institution, entity type, both statements, and a signature that matches
--      the legal name. Any email domain is accepted. New accounts start
--      'pending' and can't check out until an admin approves them in
--      Admin → Accounts (existing accounts keep their current status).
--   3. Stops customers from editing their own signature / attestation record.
-- Accounts you create by hand in the Supabase dashboard (no metadata) are
-- still allowed.

-- ---------------------------------------------------------------------------
-- 1. New profile columns
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists entity_type    text;
alter table public.profiles add column if not exists signature_name text;
alter table public.profiles add column if not exists signed_at      timestamptz;
alter table public.profiles add column if not exists referral_code  text;

alter table public.profiles drop constraint if exists profiles_entity_type_check;
alter table public.profiles add constraint profiles_entity_type_check
  check (entity_type is null or entity_type in (
    'university', 'research_lab', 'biotech_pharma', 'cro',
    'government_nonprofit', 'other_business'
  ));

-- New accounts wait for admin approval.
alter table public.profiles alter column approval_status set default 'pending';

-- ---------------------------------------------------------------------------
-- 2. Signup trigger: validate + create the profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta      jsonb   := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  from_site boolean := meta <> '{}'::jsonb;
  v_name    text    := nullif(regexp_replace(trim(coalesce(meta->>'full_name', '')), '\s+', ' ', 'g'), '');
  v_sig     text    := nullif(regexp_replace(trim(coalesce(meta->>'signature_name', '')), '\s+', ' ', 'g'), '');
  v_inst    text    := nullif(trim(coalesce(meta->>'institution', '')), '');
  v_entity  text    := nullif(trim(coalesce(meta->>'entity_type', '')), '');
  v_ref     text    := nullif(lower(trim(coalesce(meta->>'referral_code', ''))), '');
begin
  if from_site then
    if v_name is null or length(v_name) < 2 then
      raise exception 'Legal name is required.';
    end if;
    if v_inst is null or length(v_inst) < 3 then
      raise exception 'Registered business or institution is required.';
    end if;
    if v_entity is null or v_entity not in (
      'university', 'research_lab', 'biotech_pharma', 'cro',
      'government_nonprofit', 'other_business'
    ) then
      raise exception 'Business / entity type is required.';
    end if;
    if coalesce((meta->>'attest_age_21')::boolean, false) is not true
       or coalesce((meta->>'attest_researcher')::boolean, false) is not true
       or coalesce((meta->>'attest_research_only')::boolean, false) is not true
       or coalesce((meta->>'attest_terms')::boolean, false) is not true then
      raise exception 'All compliance statements must be confirmed.';
    end if;
    if v_sig is null or lower(v_sig) <> lower(v_name) then
      raise exception 'Electronic signature must match the legal name.';
    end if;
    -- A referral code, if given, must belong to an active sales rep.
    if v_ref is not null and not exists (
      select 1 from public.affiliates where lower(code) = v_ref and active
    ) then
      v_ref := null;
    end if;
  end if;

  insert into public.profiles (
    id, email, full_name, phone, role, approval_status,
    institution, entity_type,
    attest_age_21, attest_researcher, attest_research_only, attest_terms,
    terms_version, attested_at, signature_name, signed_at, referral_code,
    address_street, address_city, address_state, address_postal, address_country
  )
  values (
    new.id,
    new.email,
    v_name,
    meta->>'phone',
    'customer',
    'pending',
    v_inst,
    v_entity,
    coalesce((meta->>'attest_age_21')::boolean, false),
    coalesce((meta->>'attest_researcher')::boolean, false),
    coalesce((meta->>'attest_research_only')::boolean, false),
    coalesce((meta->>'attest_terms')::boolean, false),
    meta->>'terms_version',
    case when from_site then now() end,
    v_sig,
    case when from_site then now() end,
    v_ref,
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
-- 3. Customers can't change their role, approval, or signed registration
--    record (same trigger as researcher_approval.sql, plus the new fields).
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
    new.entity_type          := old.entity_type;
    new.signature_name       := old.signature_name;
    new.signed_at            := old.signed_at;
    new.referral_code        := old.referral_code;
  end if;
  return new;
end;
$$;
