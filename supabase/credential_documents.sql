-- Renew — credential document upload (required before checkout)
-- Run ONCE in the Supabase SQL editor, AFTER checkout_credentials.sql and
-- BEFORE deploying the matching site code. Safe to re-run.
--
-- Customers upload proof that they work in the industry (business license,
-- institutional ID, letter on letterhead, research permit…). Files go to a
-- PRIVATE storage bucket: each customer can upload to and read only their own
-- folder; admins can read all. Uploading puts the account back to 'pending'
-- until an admin reviews the document in Admin → Accounts. Checkout requires a
-- document on file AND approval.

-- ---------------------------------------------------------------------------
-- 1. Private bucket (10 MB max; PDF and images only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'credential-docs', 'credential-docs', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Customers upload only into their own folder: <user id>/<file>
drop policy if exists "Customers upload own credential docs" on storage.objects;
create policy "Customers upload own credential docs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'credential-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Customers read their own documents; admins read everyone's.
drop policy if exists "Read own or admin credential docs" on storage.objects;
create policy "Read own or admin credential docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'credential-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Only admins can delete (customers can't remove what they submitted).
drop policy if exists "Admins delete credential docs" on storage.objects;
create policy "Admins delete credential docs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'credential-docs' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Profile columns for the document on file
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists credential_doc_path        text;
alter table public.profiles add column if not exists credential_doc_type        text;
alter table public.profiles add column if not exists credential_doc_name        text;
alter table public.profiles add column if not exists credential_doc_uploaded_at timestamptz;

alter table public.profiles drop constraint if exists profiles_credential_doc_type_check;
alter table public.profiles add constraint profiles_credential_doc_type_check
  check (credential_doc_type is null or credential_doc_type in (
    'business_license', 'institution_id', 'institution_letter',
    'research_license', 'other'
  ));

-- ---------------------------------------------------------------------------
-- 3. Profile guard: customers can't edit credentials, documents or approval
--    themselves (only through the submit functions, which set a flag).
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('renew.credentials_submit', true), '') = 'on' then
    return new;
  end if;
  if auth.uid() is not null and not public.is_admin() then
    new.role                       := old.role;
    new.approval_status            := old.approval_status;
    new.reviewed_at                := old.reviewed_at;
    new.reviewed_by                := old.reviewed_by;
    new.review_note                := old.review_note;
    new.institution                := old.institution;
    new.email                      := old.email;
    new.attest_age_21              := old.attest_age_21;
    new.attest_researcher          := old.attest_researcher;
    new.attest_research_only       := old.attest_research_only;
    new.attest_terms               := old.attest_terms;
    new.terms_version              := old.terms_version;
    new.attested_at                := old.attested_at;
    new.entity_type                := old.entity_type;
    new.signature_name             := old.signature_name;
    new.signed_at                  := old.signed_at;
    new.referral_code              := old.referral_code;
    new.credential_doc_path        := old.credential_doc_path;
    new.credential_doc_type        := old.credential_doc_type;
    new.credential_doc_name        := old.credential_doc_name;
    new.credential_doc_uploaded_at := old.credential_doc_uploaded_at;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Record an uploaded document and send the account for review
-- ---------------------------------------------------------------------------
create or replace function public.submit_credential_document(
  p_path      text,
  p_doc_type  text,
  p_file_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_rows integer;
begin
  if v_uid is null then
    raise exception 'Please log in first.';
  end if;
  if p_doc_type is null or p_doc_type not in (
    'business_license', 'institution_id', 'institution_letter',
    'research_license', 'other'
  ) then
    raise exception 'Select the type of document you are uploading.';
  end if;
  -- The file must be in this customer's own folder and actually uploaded.
  if p_path is null or split_part(p_path, '/', 1) <> v_uid::text
     or not exists (
       select 1 from storage.objects
        where bucket_id = 'credential-docs' and name = p_path
     ) then
    raise exception 'Upload your document before submitting.';
  end if;

  perform set_config('renew.credentials_submit', 'on', true);
  update public.profiles
     set credential_doc_path        = p_path,
         credential_doc_type        = p_doc_type,
         credential_doc_name        = left(coalesce(nullif(trim(p_file_name), ''), p_path), 200),
         credential_doc_uploaded_at = now(),
         approval_status = case when role = 'admin' then approval_status else 'pending' end,
         reviewed_at     = case when role = 'admin' then reviewed_at else null end,
         reviewed_by     = case when role = 'admin' then reviewed_by else null end,
         review_note     = case when role = 'admin' then review_note else null end
   where id = v_uid;
  get diagnostics v_rows = row_count;
  perform set_config('renew.credentials_submit', 'off', true);

  if v_rows = 0 then
    raise exception 'Account profile not found. Please contact us.';
  end if;
end;
$$;

revoke all on function public.submit_credential_document(text, text, text) from public, anon;
grant execute on function public.submit_credential_document(text, text, text) to authenticated;
