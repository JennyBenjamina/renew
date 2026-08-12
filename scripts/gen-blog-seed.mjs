// Generates supabase/blog_seed.sql from src/data/blogPosts.js so the four launch
// posts live in the database (editable in admin + included in the sitemap).
// Run: node scripts/gen-blog-seed.mjs
import { blogPosts } from '../src/data/blogPosts.js'
import { writeFileSync } from 'node:fs'

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const arr = (a) =>
  a && a.length ? `array[${a.map((s) => `'${String(s).replace(/'/g, "''")}'`).join(',')}]::text[]` : `'{}'::text[]`
const jsonb = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`

const rows = blogPosts
  .map((p) => {
    const cols = [
      q(p.slug),
      q(p.title),
      q(p.category),
      q(p.author),
      q(p.excerpt),
      q(p.body),
      jsonb(p.faq || []),
      arr(p.keywords),
      q(p.meta_title),
      q(p.meta_description),
      q(p.image_url),
      String(p.read_minutes || 5),
      p.published ? 'true' : 'false',
      q(p.published_at),
    ]
    return `  (${cols.join(', ')})`
  })
  .join(',\n')

const sql = `-- Renew — seed the four launch blog posts. Generated from src/data/blogPosts.js
-- by scripts/gen-blog-seed.mjs. Run AFTER blog.sql. Safe to re-run (upserts by slug).

insert into public.blog_posts
  (slug, title, category, author, excerpt, body, faq, keywords,
   meta_title, meta_description, image_url, read_minutes, published, published_at)
values
${rows}
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  author = excluded.author,
  excerpt = excluded.excerpt,
  body = excluded.body,
  faq = excluded.faq,
  keywords = excluded.keywords,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  image_url = excluded.image_url,
  read_minutes = excluded.read_minutes,
  published = excluded.published,
  published_at = excluded.published_at;
`

writeFileSync(new URL('../supabase/blog_seed.sql', import.meta.url), sql)
console.log('Wrote supabase/blog_seed.sql with', blogPosts.length, 'posts')
