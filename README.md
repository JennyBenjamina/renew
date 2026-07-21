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

## Admin portal (`/admin`)

A protected admin area lets authorized staff manage the catalog — add, edit,
delete products, and toggle in-stock / featured. It uses **Supabase Auth**
(real email + password) and is enforced by database row-level security, so it
only works with Supabase connected.

**One-time setup in Supabase:**

1. Run `supabase/schema.sql` (it now includes admin write policies for
   signed-in users and the `image_url` column). If you ran an earlier version,
   just run it again — it's safe to re-run.
2. Run `supabase/storage.sql` to create the `product-images` storage bucket and
   its access policies (public read, admin upload). This enables image uploads.
3. Run `supabase/auth_roles.sql` to add customer accounts + **admin/customer
   role separation** (see "Accounts & roles" below). This changes product writes
   to require the admin role, so it's required now.
4. **Create your admin user:** Authentication → Users → **Add user** → enter an
   email + password, then run the last line of `auth_roles.sql` with that email
   to set its role to `admin`.
5. **Turn public sign-ups back ON** so customers can register: Authentication →
   Providers → Email → **"Allow new users to sign up"** = **on**. (This is now
   safe — new users are always `customer` and cannot edit the catalog.)

**Product images:** in the add/edit form, click **Upload image**. Requirements
are shown right in the form — a **square** image, **JPG / PNG / WebP**, at least
**800×800px** (1000×1000 recommended), under **3 MB**. Uploads go to Supabase
Storage and the product shows the real photo on the storefront; products without
an image fall back to the generated placeholder art.

**Using it:**

- Go to `/admin` (or click the small "Admin" link in the site footer). You'll be
  sent to `/admin/login`.
- Sign in with the admin account. You'll land on the product dashboard.
- Edits write straight to Supabase and appear on the storefront immediately.

## Accounts & roles

Customers can register and sign in:

- `/signup` — customer registration (contact + shipping details)
- `/login` — customer login (also linked from the account icon in the navbar)
- `/account` — signed-in customer profile (edit contact/shipping, sign out)

Roles are stored in the `profiles` table (`auth_roles.sql`):

- Every new signup is a **`customer`** and can only manage their own profile.
- Only a **`admin`** profile can create/edit/delete products or upload images —
  enforced in the database via the `is_admin()` check in the RLS policies, and a
  trigger prevents anyone from promoting themselves.
- `/admin` requires the admin role; a signed-in customer who visits it is sent
  back to the storefront.

To make someone an admin later, run in Supabase:
`update public.profiles set role='admin' where email='them@example.com';`

Never put the Supabase `service_role` key in this app — auth uses the public
anon key plus the logged-in session, which is correct.

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
    CartContext.jsx        ← cart state (persisted to localStorage)
    AuthContext.jsx        ← Supabase Auth session for the admin area
  components/        ← Navbar, Footer, Hero, ProductCard, ProductGrid,
                       ComplianceGate, CartDrawer, ThemeSwitcher, Logo,
                       StorefrontLayout, admin/ProtectedRoute, ...
  pages/             ← Home, Catalog, LocalPickup, About
    admin/           ← AdminLogin, AdminDashboard, ProductForm, admin.css
supabase/
  schema.sql         ← products + acceptance_log tables, RLS policies
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
