-- Renew — soft-delete (archive) for affiliates.
-- Run in the Supabase SQL editor AFTER affiliates.sql. Safe to re-run.
-- "Removing" a rep in the admin sets archived = true: they disappear from the
-- affiliates list and their code stops working, but the row (and its order
-- history) is kept for your records.

alter table public.affiliates add column if not exists archived boolean not null default false;
