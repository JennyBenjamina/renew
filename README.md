# Renew — Research Compounds Storefront (MVP)

A React storefront for **Renew**, modeled on a modern research-compound
e-commerce site. Includes a compliance/age gate, featured products, a full
catalog with filtering, a local pickup page, an about/quality page, an
affiliate section, and a slide-out cart.

The frontend works standalone out of the box using bundled sample data, and
upgrades to a **Supabase**-backed catalog the moment you add credentials.

## Tech stack

- **React 18** + **Vite** (fast dev server + build)
- **React Router** for pages
- **Supabase** (`@supabase/supabase-js`) for the product catalog
- Plain CSS driven by a single **design-token file** (see Theming below)

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

No configuration is required to run it — the app ships with a local product
catalog and will use it automatically until Supabase is connected.

## Changing the color scheme (this was a core requirement)

**You only ever edit one file:** `src/styles/theme.css`.

Every color, radius, shadow, and font in the entire app references a CSS custom
property defined there. No component hardcodes a color. To rebrand:

1. Open `src/styles/theme.css`.
2. Edit the values under **`1. RAW PALETTE`** (the actual brand colors).
3. Optionally remap the **`2. SEMANTIC TOKENS`** (e.g. point `--color-primary`
   at a different palette color).
4. Save. Everything updates instantly.

The file is organized into: raw palette → semantic tokens (what components use)
→ non-color tokens (spacing, radii, shadows, type). A ready-made **dark theme**
is included at the bottom — activate it by adding `data-theme="dark"` to the
`<html>` element.

When you send me your color scheme, dropping it in is a one-file change.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart `npm run dev`. The app now reads products from Supabase.

The data layer (`src/lib/products.js`) automatically falls back to the local
catalog if the env vars are missing or a query fails, so the UI never breaks.
Row-level security is enabled with public read-only access to the catalog.

## Project structure

```
src/
  styles/
    theme.css        ← ALL colors & design tokens live here (edit to rebrand)
    global.css       ← base element + utility styles (tokens only)
  lib/
    supabaseClient.js  ← Supabase init + isSupabaseConfigured flag
    products.js        ← data access layer (Supabase or local fallback)
    format.js          ← currency helper
  data/
    products.js      ← local fallback catalog (mirrors seed.sql)
  context/
    ComplianceContext.jsx  ← age/compliance gate state (14-day remember)
    CartContext.jsx        ← cart state
  components/        ← Navbar, Footer, Hero, ProductCard, ProductGrid,
                       ComplianceGate, CartDrawer, MissionSection,
                       AffiliateSection, Logo, ScrollToTop
  pages/             ← Home, Catalog, LocalPickup, About
supabase/
  schema.sql         ← products table + RLS policy
  seed.sql           ← sample products
```

## MVP notes / next steps

- **Checkout** and the **affiliate**/**pickup** forms are placeholders — wire up
  a payment provider (e.g. Stripe) and a form backend to complete them.
- Product art uses themed SVG placeholders; swap in real photos by adding an
  `image_url` column and rendering `<img>` in `ProductCard.jsx`.
- All product copy uses generic research-compound naming — replace with your
  real catalog.

> All products are presented for laboratory research use only and not for human
> consumption — matching the compliance framing of this category of site.
