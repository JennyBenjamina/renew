-- Renew — newsletter subscribers ("Research updates from Renew")
-- Run in the Supabase SQL editor AFTER auth_roles.sql. Safe to re-run.
--
-- Rows are written server-side by the Netlify function (subscribe) using the
-- service-role key, so there is no public insert policy. Admins read them in
-- the admin portal (Subscribers page) and can export to CSV for Resend.

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text not null default 'footer',
  created_at  timestamptz not null default now()
);

create index if not exists subscribers_created_idx
  on public.subscribers (created_at desc);

alter table public.subscribers enable row level security;

-- Admins can read the subscriber list; no public read/insert (writes are
-- server-side via the service role).
drop policy if exists "admins read subscribers" on public.subscribers;
create policy "admins read subscribers"
  on public.subscribers for select
  using (public.is_admin());
