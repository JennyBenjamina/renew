-- Renew — seed data. Run after schema.sql.
-- Mirrors src/data/products.js so the Supabase-backed and local catalogs match.

insert into public.products
  (id, slug, name, category, description, price, compare_at_price, purity, badges, in_stock, featured, image_hue)
values
  ('reta-30', 'glp-reta-30mg', 'GLP-R RETA 30mg Vial', 'GLP',
   'A 30mg research-grade vial for advanced laboratory studies. Each batch is rigorously tested for purity and consistency to ensure reliable experimental results. For research purposes only. Not for human consumption.',
   154.99, 159.99, '99.9%', '{sale}', true, true, 168),
  ('reta-10', 'glp-reta-10mg', 'GLP-R RETA 10mg Vial', 'GLP',
   'A high-purity 10mg research compound designed for advanced scientific and laboratory studies. Produced for research purposes only. Not intended for human consumption.',
   79.99, 89.99, '99.9%', '{sale}', true, true, 152),
  ('renew-stack-10', 'renew-recovery-stack-10mg', 'Renew Recovery Stack 10mg', 'Blends',
   'A research-grade compound blend combining two peptides in one vial, designed for laboratory research into peptide behavior, stability, and experimental analysis. Each vial includes labeled areas for Lot and Reconstitution Date tracking. For research purposes only. Not for human consumption.',
   84.99, null, '99.7%', '{new}', true, true, 140),
  ('bpc-157-5', 'bpc-157-5mg', 'BPC-157 5mg Vial', 'Peptides',
   'A 5mg research peptide synthesized under strict quality controls for reproducible laboratory work. Third-party tested for concentration and purity. For research purposes only. Not for human consumption.',
   49.99, 59.99, '99.8%', '{sale}', true, false, 174),
  ('tb-500-5', 'tb-500-5mg', 'TB-500 5mg Vial', 'Peptides',
   'A 5mg research-grade peptide manufactured in an ISO-certified facility. Every batch ships with a verified certificate of analysis. For research purposes only. Not for human consumption.',
   54.99, null, '99.6%', '{}', true, false, 158),
  ('ghk-cu-50', 'ghk-cu-50mg', 'GHK-Cu 50mg Vial', 'Peptides',
   'A 50mg copper peptide research compound for structural and stability studies. Produced under advanced synthesis protocols to eliminate contaminants. For research purposes only. Not for human consumption.',
   64.99, 74.99, '99.5%', '{sale}', false, false, 128),
  ('sema-10', 'glp-sema-10mg', 'GLP-S SEMA 10mg Vial', 'GLP',
   'A 10mg GLP research compound produced for controlled research environments. Rigorously tested for exact concentration and purity. For research purposes only. Not for human consumption.',
   89.99, null, '99.9%', '{new}', true, false, 146),
  ('nad-500', 'nad-plus-500mg', 'NAD+ 500mg Vial', 'Compounds',
   'A 500mg research compound for laboratory investigation. Manufactured under strict verified quality controls with a publicly available certificate of analysis. For research purposes only. Not for human consumption.',
   99.99, 119.99, '99.4%', '{sale}', true, false, 184)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  purity = excluded.purity,
  badges = excluded.badges,
  in_stock = excluded.in_stock,
  featured = excluded.featured,
  image_hue = excluded.image_hue;
