-- Renew — make affiliate promotion work in BOTH orders.
-- Run in the Supabase SQL editor AFTER affiliates.sql. Safe to re-run.
--
-- Problem this fixes: the signup-time trigger only promotes a rep to 'affiliate'
-- if their email was already in the affiliates list WHEN they signed up. If a
-- rep signed up first (as a customer) and was added as an affiliate later
-- (e.g. Lily Chavez), they stayed 'customer'. This adds the reverse link and
-- backfills anyone already affected.

-- 1. When an affiliate row is added or its email changes, link + promote any
--    account that already exists with that email.
create or replace function public.affiliate_link_existing()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if new.email is null then return new; end if;
  select id into pid from public.profiles where lower(email) = lower(new.email) limit 1;
  if pid is not null then
    new.user_id := pid;
    update public.profiles set role = 'affiliate' where id = pid and role <> 'admin';
  end if;
  return new;
end; $$;

drop trigger if exists affiliate_link_existing on public.affiliates;
create trigger affiliate_link_existing
  before insert or update of email on public.affiliates
  for each row execute function public.affiliate_link_existing();

-- 2. One-time backfill for reps who already have accounts.
update public.affiliates a
set user_id = p.id
from public.profiles p
where lower(a.email) = lower(p.email) and a.user_id is null;

update public.profiles p
set role = 'affiliate'
from public.affiliates a
where lower(p.email) = lower(a.email) and p.role = 'customer' and a.active;
