-- Renew — delivery availability inquiries
-- Run in the Supabase SQL editor. Safe to re-run.
-- Rows are written server-side by the Netlify function (submit-delivery-inquiry)
-- using the service-role key, so there is no public insert policy. Admins read.

create table if not exists public.delivery_inquiries (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  zip         text,
  created_at  timestamptz not null default now()
);

alter table public.delivery_inquiries enable row level security;

drop policy if exists "admins read delivery inquiries" on public.delivery_inquiries;
create policy "admins read delivery inquiries"
  on public.delivery_inquiries for select
  using (public.is_admin());
