-- Renew — fill in missing names for accounts created Oct 21 – Nov 11, 2026
-- The signup form in that period didn't ask for a name, so Supabase's
-- "Display name" (user metadata full_name) and profiles.full_name are blank.
-- This copies the name from each account's most recent order, where they
-- typed it at checkout. Accounts that never ordered stay blank.
-- Run in the Supabase SQL editor. Safe to re-run; never overwrites a name.

-- Preview first (optional): run just this SELECT to see what will change.
-- select u.email, o.customer_name
--   from auth.users u
--   join lateral (
--     select customer_name from public.orders
--      where user_id = u.id and nullif(trim(customer_name), '') is not null
--      order by created_at desc limit 1
--   ) o on true
--  where nullif(trim(u.raw_user_meta_data->>'full_name'), '') is null;

with latest as (
  select distinct on (user_id) user_id, trim(customer_name) as name
    from public.orders
   where user_id is not null and nullif(trim(customer_name), '') is not null
   order by user_id, created_at desc
)
update auth.users u
   set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                            || jsonb_build_object('full_name', l.name)
  from latest l
 where l.user_id = u.id
   and nullif(trim(u.raw_user_meta_data->>'full_name'), '') is null;

with latest as (
  select distinct on (user_id) user_id, trim(customer_name) as name
    from public.orders
   where user_id is not null and nullif(trim(customer_name), '') is not null
   order by user_id, created_at desc
)
update public.profiles p
   set full_name = l.name
  from latest l
 where l.user_id = p.id
   and nullif(trim(p.full_name), '') is null;
