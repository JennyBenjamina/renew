/* Local fallback catalog.
 * Used automatically when Supabase env vars are not configured, so the
 * frontend is fully functional before the backend is wired up.
 * The shape here matches the `products` table in supabase/schema.sql. */

export const products = [
  {
    id: 'reta-30',
    slug: 'glp-reta-30mg',
    name: 'GLP-R RETA 30mg Vial',
    category: 'GLP',
    description:
      'A 30mg research-grade vial for advanced laboratory studies. Each batch is rigorously tested for purity and consistency to ensure reliable experimental results. For research purposes only. Not for human consumption.',
    price: 154.99,
    compare_at_price: 159.99,
    purity: '99.9%',
    badges: ['sale'],
    in_stock: true,
    featured: true,
    image_hue: 168,
  },
  {
    id: 'reta-10',
    slug: 'glp-reta-10mg',
    name: 'GLP-R RETA 10mg Vial',
    category: 'GLP',
    description:
      'A high-purity 10mg research compound designed for advanced scientific and laboratory studies. Produced for research purposes only. Not intended for human consumption.',
    price: 79.99,
    compare_at_price: 89.99,
    purity: '99.9%',
    badges: ['sale'],
    in_stock: true,
    featured: true,
    image_hue: 152,
  },
  {
    id: 'renew-stack-10',
    slug: 'renew-recovery-stack-10mg',
    name: 'Renew Recovery Stack 10mg',
    category: 'Blends',
    description:
      'A research-grade compound blend combining two peptides in one vial, designed for laboratory research into peptide behavior, stability, and experimental analysis. Each vial includes labeled areas for Lot and Reconstitution Date tracking. For research purposes only. Not for human consumption.',
    price: 84.99,
    compare_at_price: null,
    purity: '99.7%',
    badges: ['new'],
    in_stock: true,
    featured: true,
    image_hue: 140,
  },
  {
    id: 'bpc-157-5',
    slug: 'bpc-157-5mg',
    name: 'BPC-157 5mg Vial',
    category: 'Peptides',
    description:
      'A 5mg research peptide synthesized under strict quality controls for reproducible laboratory work. Third-party tested for concentration and purity. For research purposes only. Not for human consumption.',
    price: 49.99,
    compare_at_price: 59.99,
    purity: '99.8%',
    badges: ['sale'],
    in_stock: true,
    featured: false,
    image_hue: 174,
  },
  {
    id: 'tb-500-5',
    slug: 'tb-500-5mg',
    name: 'TB-500 5mg Vial',
    category: 'Peptides',
    description:
      'A 5mg research-grade peptide manufactured in an ISO-certified facility. Every batch ships with a verified certificate of analysis. For research purposes only. Not for human consumption.',
    price: 54.99,
    compare_at_price: null,
    purity: '99.6%',
    badges: [],
    in_stock: true,
    featured: false,
    image_hue: 158,
  },
  {
    id: 'ghk-cu-50',
    slug: 'ghk-cu-50mg',
    name: 'GHK-Cu 50mg Vial',
    category: 'Peptides',
    description:
      'A 50mg copper peptide research compound for structural and stability studies. Produced under advanced synthesis protocols to eliminate contaminants. For research purposes only. Not for human consumption.',
    price: 64.99,
    compare_at_price: 74.99,
    purity: '99.5%',
    badges: ['sale'],
    in_stock: false,
    featured: false,
    image_hue: 128,
  },
  {
    id: 'sema-10',
    slug: 'glp-sema-10mg',
    name: 'GLP-S SEMA 10mg Vial',
    category: 'GLP',
    description:
      'A 10mg GLP research compound produced for controlled research environments. Rigorously tested for exact concentration and purity. For research purposes only. Not for human consumption.',
    price: 89.99,
    compare_at_price: null,
    purity: '99.9%',
    badges: ['new'],
    in_stock: true,
    featured: false,
    image_hue: 146,
  },
  {
    id: 'nad-500',
    slug: 'nad-plus-500mg',
    name: 'NAD+ 500mg Vial',
    category: 'Compounds',
    description:
      'A 500mg research compound for laboratory investigation. Manufactured under strict verified quality controls with a publicly available certificate of analysis. For research purposes only. Not for human consumption.',
    price: 99.99,
    compare_at_price: 119.99,
    purity: '99.4%',
    badges: ['sale'],
    in_stock: true,
    featured: false,
    image_hue: 184,
  },
]

export const categories = ['All', 'GLP', 'Peptides', 'Blends', 'Compounds']
