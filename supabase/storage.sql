-- Renew — Supabase Storage setup for product images
-- Run this once in the Supabase SQL editor (after schema.sql).
--
-- Alternatively you can create the bucket in the dashboard:
--   Storage -> New bucket -> name "product-images" -> Public bucket = ON.
-- The policies below still need to be applied for uploads to work.

-- 1. Create a public bucket for product images.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 2. Anyone can VIEW images in this bucket (needed so the public storefront can
--    display product photos).
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

-- 3. Signed-in admins can UPLOAD, REPLACE, and DELETE images in this bucket.
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images');
