-- Renew — institutional credentials required + verified before checkout
-- Run ONCE in the Supabase SQL editor, AFTER signup_fields.sql and BEFORE
-- deploying the matching site code. Safe to re-run.
--
-- Rule: an account may check out only when it has institutional credentials on
-- file (institution, entity type, all four statements, e-signature) AND an
-- admin has approved it. Accounts created before the new signup form (no
-- credentials) are asked for them at checkout; submitting puts the account
-- back to 'pending' until you verify it in Admin → Accounts.

-- ---------------------------------------------------------------------------
-- 1. Profile guard: customers can't edit their own credentials or approval,
--    except through submit_credentials() below.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- submit_credentials() sets this flag for its own transaction only.
  if coalesce(current_setting('renew.credentials_submit', true), '') = 'on' then
    return new;
  end if;
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

-- ---------------------------------------------------------------------------
-- 2. Signed-in customers submit credentials (existing accounts without them).
--    Validates everything, saves it, and sends the account back for review.
-- ---------------------------------------------------------------------------
create or replace function public.submit_credentials(
  p_full_name     text,
  p_institution   text,
  p_entity_type   text,
  p_signature     text,
  p_attest_age_21 boolean,
  p_attest_qualified boolean,
  p_terms_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := nullif(regexp_replace(trim(coalesce(p_full_name, '')), '\s+', ' ', 'g'), '');
  v_sig  text := nullif(regexp_replace(trim(coalesce(p_signature, '')), '\s+', ' ', 'g'), '');
  v_inst text := nullif(trim(coalesce(p_institution, '')), '');
  v_rows integer;
begin
  if v_uid is null then
    raise exception 'Please log in first.';
  end if;
  if v_name is null or length(v_name) < 2 then
    raise exception 'Legal name is required.';
  end if;
  if v_inst is null or length(v_inst) < 3 then
    raise exception 'Registered business or institution is required.';
  end if;
  if p_entity_type is null or p_entity_type not in (
    'university', 'research_lab', 'biotech_pharma', 'cro',
    'government_nonprofit', 'other_business'
  ) then
    raise exception 'Business / entity type is required.';
  end if;
  if coalesce(p_attest_age_21, false) is not true
     or coalesce(p_attest_qualified, false) is not true then
    raise exception 'Both statements must be confirmed.';
  end if;
  if v_sig is null or lower(v_sig) <> lower(v_name) then
    raise exception 'Electronic signature must match the legal name.';
  end if;

  perform set_config('renew.credentials_submit', 'on', true);
  update public.profiles
     set full_name            = v_name,
         institution          = v_inst,
         entity_type          = p_entity_type,
         attest_age_21        = true,
         attest_researcher    = true,
         attest_research_only = true,
         attest_terms         = true,
         terms_version        = p_terms_version,
         attested_at          = now(),
         signature_name       = v_sig,
         signed_at            = now(),
         -- Admins stay approved; everyone else waits for verification.
         approval_status      = case when role = 'admin' then approval_status else 'pending' end,
         reviewed_at          = case when role = 'admin' then reviewed_at else null end,
         reviewed_by          = case when role = 'admin' then reviewed_by else null end,
         review_note          = case when role = 'admin' then review_note else null end
   where id = v_uid;
  get diagnostics v_rows = row_count;
  perform set_config('renew.credentials_submit', 'off', true);

  if v_rows = 0 then
    raise exception 'Account profile not found. Please contact us.';
  end if;

  -- Keep the login's display name in step with the legal name.
  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                              || jsonb_build_object('full_name', v_name)
   where id = v_uid;
end;
$$;

revoke all on function public.submit_credentials(text, text, text, text, boolean, boolean, text) from public, anon;
grant execute on function public.submit_credentials(text, text, text, text, boolean, boolean, text) to authenticated;
