-- Renew — restore the accidentally-deleted profile for Nikki Pousa.
-- Run in the Supabase SQL editor.
--
-- This works only if the underlying auth user (same id) still exists. If you
-- deleted her from Authentication → Users, this will fail with a foreign-key
-- error (profiles_id_fkey) — in that case she must sign up again (a new account
-- is created automatically); then update her details with the UPDATE at the end.

insert into public.profiles
  (id, email, full_name, phone, role,
   address_street, address_city, address_state, address_postal, address_country, created_at)
values
  ('4cac022e-ccbc-4944-ab3e-20331c96f8e0',
   'nikkipousa@gmail.com', 'Nikki Pousa', '3214023968', 'customer',
   '330 parkland cir unit 203', 'Kissimmee, fl', 'Florida', '34744', 'United States',
   '2026-09-02 20:19:55.612197+00')
on conflict (id) do update set
  email           = excluded.email,
  full_name       = excluded.full_name,
  phone           = excluded.phone,
  role            = excluded.role,
  address_street  = excluded.address_street,
  address_city    = excluded.address_city,
  address_state   = excluded.address_state,
  address_postal  = excluded.address_postal,
  address_country = excluded.address_country;

-- If the auth user was also deleted: have Nikki sign up again with
-- nikkipousa@gmail.com (a fresh profile is created), then run this to restore
-- her details onto the new account:
--
-- update public.profiles set
--   full_name = 'Nikki Pousa', phone = '3214023968',
--   address_street = '330 parkland cir unit 203', address_city = 'Kissimmee, fl',
--   address_state = 'Florida', address_postal = '34744', address_country = 'United States'
-- where lower(email) = 'nikkipousa@gmail.com';
