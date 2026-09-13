-- Renew — SMS campaign history (admin text blasts via Telnyx).
-- Run once in the Supabase SQL editor AFTER auth_roles.sql. Safe to re-run.
-- Rows are written server-side by the send-campaign function (service role);
-- admins read them for history.

create table if not exists public.sms_campaigns (
  id               uuid primary key default gen_random_uuid(),
  message          text not null,
  recipient_count  integer not null default 0,
  sent_count       integer not null default 0,
  failed_count     integer not null default 0,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists sms_campaigns_created_idx
  on public.sms_campaigns (created_at desc);

alter table public.sms_campaigns enable row level security;

drop policy if exists "admins read campaigns" on public.sms_campaigns;
create policy "admins read campaigns"
  on public.sms_campaigns for select
  using (public.is_admin());
