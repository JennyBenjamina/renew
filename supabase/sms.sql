-- Renew — SMS opt-out suppression list + inbound reply log.
-- Run in the Supabase SQL editor AFTER auth_roles.sql. Safe to re-run.
--
-- Both tables are written server-side by the telnyx-webhook Netlify function
-- (service-role key), so there are no public insert policies. Admins can read.
--
-- IMPORTANT: before every marketing send, check sms_opt_outs for the recipient
-- (active = true) and skip anyone found there. Telnyx blocks STOP replies at the
-- carrier level too, but this list is YOUR authoritative suppression record.

-- Suppression list — one row per phone number that has ever opted out/in.
create table if not exists public.sms_opt_outs (
  phone_number  text primary key,          -- E.164, e.g. +17025551234
  active        boolean not null default true, -- true = currently opted OUT
  keyword       text,                       -- the word that triggered it
  opted_out_at  timestamptz,
  opted_in_at   timestamptz,
  updated_at    timestamptz not null default now()
);

create index if not exists sms_opt_outs_active_idx
  on public.sms_opt_outs (active);

-- Log of every inbound reply (useful for support + audit trail).
create table if not exists public.sms_inbound (
  id                uuid primary key default gen_random_uuid(),
  telnyx_message_id text,
  from_number       text,
  to_number         text,
  body              text,
  received_at       timestamptz not null default now()
);

create index if not exists sms_inbound_received_idx
  on public.sms_inbound (received_at desc);

alter table public.sms_opt_outs enable row level security;
alter table public.sms_inbound  enable row level security;

drop policy if exists "admins read opt_outs" on public.sms_opt_outs;
create policy "admins read opt_outs"
  on public.sms_opt_outs for select
  using (public.is_admin());

drop policy if exists "admins read inbound" on public.sms_inbound;
create policy "admins read inbound"
  on public.sms_inbound for select
  using (public.is_admin());
