-- Renew — create profiles for login accounts that don't have one
-- Some early accounts (e.g. jenny.lee@pga.com, created Sep 2) have a login but
-- no profiles row, so they can't be approved, don't show in Admin → Accounts,
-- and can't check out. This creates the missing rows from the login data.
-- Accounts from before the Oct 20 approval gate are created as 'approved'
-- (same as every other pre-gate account); later ones as 'pending' for review.
-- Run in the Supabase SQL editor. Safe to re-run.

-- Preview first (optional):
-- select u.email, u.created_at from auth.users u
--   left join public.profiles p on p.id = u.id where p.id is null;

insert into public.profiles (id, email, full_name, phone, role, approval_status, reviewed_at)
select u.id,
       u.email,
       nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
       nullif(trim(u.raw_user_meta_data->>'phone'), ''),
       'customer',
       case when u.created_at < '2026-10-21' then 'approved' else 'pending' end,
       case when u.created_at < '2026-10-21' then now() end
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null
on conflict (id) do nothing;
