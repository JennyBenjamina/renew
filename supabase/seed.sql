-- Renew — seed data. Run after schema.sql.
-- Mirrors src/data/products.js so the Supabase-backed and local catalogs match.
-- Replaces the full catalog with the current 9 products.

delete from public.products;

insert into public.products
  (id, slug, name, category, description, price, compare_at_price, purity, badges, in_stock, featured, image_hue, image_url)
values
  ('glp3-reta-15', 'glp3-reta-15mg', 'GLP-3 RETA 15mg Vial', 'GLP',
   'A 15mg research-grade GLP-3 RETA vial for advanced laboratory studies. Each batch is third-party tested for purity and consistency. For research purposes only. Not for human consumption.',
   109.99, null, '99.9%', '{}', true, true, 150, '/products/glp3-reta-15mg.png'),
  ('glp3-reta-30', 'glp3-reta-30mg', 'GLP-3 RETA 30mg Vial', 'GLP',
   'A 30mg research-grade GLP-3 RETA vial designed for scientific and investigational use. Rigorously tested for exact concentration and purity. For research purposes only. Not for human consumption.',
   154.99, 179.99, '99.9%', '{sale}', true, true, 150, '/products/glp3-reta-30mg.png'),
  ('bpc-157', 'bpc-157-5mg', 'BPC-157 5mg Vial', 'Peptides',
   'A 5mg BPC-157 research peptide synthesized under strict quality controls for reproducible laboratory work. Third-party tested for concentration and purity. For research purposes only. Not for human consumption.',
   54.99, 64.99, '99.8%', '{sale}', true, true, 174, '/products/bpc-157.png'),
  ('tb-500', 'tb-500-5mg', 'TB-500 5mg Vial', 'Peptides',
   'A 5mg TB-500 research-grade peptide manufactured in an ISO-certified facility. Every batch ships with a verified certificate of analysis. For research purposes only. Not for human consumption.',
   59.99, null, '99.7%', '{}', true, false, 158, '/products/tb-500.png'),
  ('ghk-cu-100', 'ghk-cu-100mg', 'GHK-Cu 100mg Vial', 'Peptides',
   'A 100mg GHK-Cu copper peptide research compound for structural and stability studies. Produced under advanced synthesis protocols to eliminate contaminants. For research purposes only. Not for human consumption.',
   74.99, null, '99.6%', '{}', true, false, 128, '/products/ghk-cu-100mg.png'),
  ('mots-c-10', 'mots-c-10mg', 'MOTS-c 10mg Vial', 'Peptides',
   'A 10mg MOTS-c research peptide for controlled laboratory research applications. Third-party tested for identity and purity. For research purposes only. Not for human consumption.',
   69.99, null, '99.7%', '{new}', true, false, 146, '/products/mots-c-10mg.png'),
  ('mots-c-40', 'mots-c-40mg', 'MOTS-c 40mg Vial', 'Peptides',
   'A 40mg MOTS-c research peptide produced for controlled research environments. Rigorously tested for exact concentration and purity. For research purposes only. Not for human consumption.',
   129.99, null, '99.7%', '{new}', true, false, 140, '/products/mots-c-40mg.png'),
  ('nad-500', 'nad-plus-500mg', 'NAD+ 500mg Vial', 'Compounds',
   'A 500mg NAD+ research compound for laboratory investigation. Manufactured under strict verified quality controls with a publicly available certificate of analysis. For research purposes only. Not for human consumption.',
   99.99, 119.99, '99.5%', '{sale}', true, false, 184, '/products/nad-500mg.png'),
  ('nad-1000', 'nad-plus-1000mg', 'NAD+ 1000mg Vial', 'Compounds',
   'A 1000mg NAD+ research compound for extended laboratory investigation. Every batch is third-party tested for concentration and purity. For research purposes only. Not for human consumption.',
   169.99, null, '99.5%', '{}', true, true, 190, '/products/nad-1000mg.png');
