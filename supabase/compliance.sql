-- Renew — tie compliance-gate acceptances to the signed-in account.
-- Run once in the Supabase SQL editor. Safe to re-run. The recordAcceptance
-- helper falls back to a version-only insert if this column is missing, so the
-- app keeps working before this migration is applied.

alter table public.acceptance_log
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists acceptance_log_user_idx
  on public.acceptance_log (user_id);

comment on column public.acceptance_log.user_id is
  'The signed-in account that accepted the compliance terms (null for guests).';
