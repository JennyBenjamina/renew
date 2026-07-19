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

## Switching color schemes

Two complete color schemes ship in the app:

- **Option 1 · Sky / Slate** (default) — `#FFFFFF #F1F5F9 #CBD5E1 #38BDF8 #0F172A`
- **Option 2 · Mint / Teal** — `#F7FFFD #D9F5EF #A7E3D4 #5BB9A6 #2F5D57`

**To switch live (e.g. an investor demo):** run the site and click the floating
**Theme** button in the bottom-right corner, then pick a scheme. Your choice is
remembered across refreshes. That's the easiest way to show both.

**To set the default in code:** the active scheme is the `data-theme` attribute
on `<html>` (`option1` or `option2`). Change `DEFAULT_THEME` in
`src/lib/theme.js` if you want a different starting scheme.

**To edit a scheme or add a third:** everything lives in `src/styles/theme.css`.
Each scheme is a named token set (`[data-theme='option1']`, `[data-theme='option2']`).
No component hardcodes a color — they all reference `--color-*` tokens — so
tweaking a palette or adding a new one only touches that one file (plus a new
entry in the `THEMES` list in `src/lib/theme.js` so it appears in the switcher).

**To remove the switcher for production:** delete `<ThemeSwitcher />` in
`src/App.jsx`. The chosen default scheme still applies.

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
