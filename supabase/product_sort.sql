-- Renew — manual product ordering.
-- Run once in the Supabase SQL editor. Adds a sort_order column that controls
-- the display order on the storefront, and backfills a starting order from the
-- current featured-then-newest arrangement. Safe to re-run.

alter table public.products
  add column if not exists sort_order integer;

-- Backfill any rows that don't have an order yet (keeps existing look).
with ranked as (
  select id, row_number() over (
    order by featured desc, created_at desc
  ) * 10 as rn
  from public.products
  where sort_order is null
)
update public.products p
set sort_order = ranked.rn
from ranked
where p.id = ranked.id;

create index if not exists products_sort_order_idx
  on public.products (sort_order);

comment on column public.products.sort_order is
  'Manual display order for the storefront (ascending). Set from the admin.';
