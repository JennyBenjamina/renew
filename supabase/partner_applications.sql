-- Renew — partner / affiliate applications
-- Run in the Supabase SQL editor (optional — the form still emails you without
-- this, but this records applications so admins can review them). Safe to re-run.
--
-- Rows are written server-side by the Netlify function (submit-partner) using
-- the service-role key, so there is no public insert policy. Admins can read.

create table if not exists public.partner_applications (
  id           uuid primary key default gen_random_uuid(),
  first_name   text,
  last_name    text,
  email        text,
  message      text,
  socials      jsonb not null default '{}',   -- {instagram, tiktok, twitter, website}
  created_at   timestamptz not null default now()
);

alter table public.partner_applications enable row level security;

-- Admins can read applications. (No insert policy: writes go through the
-- service-role key in the Netlify function.)
drop policy if exists "admins read partner applications" on public.partner_applications;
create policy "admins read partner applications"
  on public.partner_applications for select
  using (public.is_admin());
