-- Renew — blog ("Research Notes") table + row-level security
-- Run in the Supabase SQL editor AFTER auth_roles.sql (it uses public.is_admin()).
-- Safe to re-run. Seed the four launch posts afterward with blog_seed.sql.
--
-- Public visitors can read only PUBLISHED posts. Admins can read everything and
-- are the only role that can insert / update / delete. Posts are authored in the
-- admin Blog manager; the body is stored as Markdown, and `faq` is a JSON array
-- of {q, a} pairs used to emit FAQPage structured data on each post.

create table if not exists public.blog_posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  category          text not null default 'Compound Guides',
  author            text not null default 'Renew Research Team',
  excerpt           text,
  body              text not null default '',        -- Markdown
  faq               jsonb not null default '[]',      -- [{q, a}, ...]
  keywords          text[] not null default '{}',
  meta_title        text,
  meta_description  text,
  image_url         text,
  read_minutes      int not null default 5,
  published         boolean not null default false,
  published_at      timestamptz,
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc);
create unique index if not exists blog_posts_slug_idx
  on public.blog_posts (slug);

alter table public.blog_posts enable row level security;

-- Public / anon: read published posts only.
drop policy if exists "read published posts" on public.blog_posts;
create policy "read published posts"
  on public.blog_posts for select
  using (published = true or public.is_admin());

-- Admins: full write access.
drop policy if exists "admins insert posts" on public.blog_posts;
create policy "admins insert posts"
  on public.blog_posts for insert to authenticated
  with check (public.is_admin());

drop policy if exists "admins update posts" on public.blog_posts;
create policy "admins update posts"
  on public.blog_posts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete posts" on public.blog_posts;
create policy "admins delete posts"
  on public.blog_posts for delete to authenticated
  using (public.is_admin());

-- Keep updated_at fresh on every edit.
create or replace function public.touch_blog_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
  before update on public.blog_posts
  for each row execute function public.touch_blog_updated_at();
