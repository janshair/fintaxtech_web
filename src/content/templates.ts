export interface MotionTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  route: `/templates/website/${'motion' | '3d'}/${string}/`;
  preview: { src: string; alt: string; width: number; height: number };
  seoTitle: string;
  seoDescription: string;
}

export const motionGallery = {
  route: '/templates/website/motion/',
  title: 'Motion Website Templates',
  intro:
    'Choose a design and preview it with your business name. Explore how movement, layout and details could bring your website to life.',
  description:
    'Explore motion website templates by FinTaxTech. Choose a design, preview it with your business name and discuss how it could work for your business.',
  previewLabel: 'Preview template',
  backLabel: 'Browse motion templates',
  note: 'These are demonstrations, not live customer websites. Example bookings do not make appointments.',
  contactLabel: 'Discuss your website',
};

// Register only implemented demos. Use a real capture, with intrinsic dimensions,
// from a tracked source/public folder for each preview.
export const motionTemplates: readonly MotionTemplate[] = [
  {
    id: 'barber-01',
    name: 'The Brass Standard',
    industry: 'Barbershops',
    description:
      'A characterful barber website with brass tones, animated tools and a sample booking journey. Try it with your own business name.',
    route: '/templates/website/motion/barber-01/',
    preview: {
      src: '/templates/website/motion/barber-01/preview.webp',
      alt: 'The Brass Standard barber demo: a charcoal and brass hero with “A cut above the ordinary” beside an illustrated barber pole.',
      width: 1200,
      height: 833,
    },
    seoTitle: 'The Brass Standard — Barber website demo by FinTaxTech',
    seoDescription:
      'Explore a personalised barber website demonstration by FinTaxTech, with responsive design and scroll-driven motion.',
  },
  {
    id: 'tailoring-02',
    name: 'The Fold Atelier',
    industry: 'Tailoring & alterations',
    description:
      'An editorial tailoring studio in warm ivory and ink, with garment illustrations, a scroll-stitched seam and a sample fitting journey.',
    route: '/templates/website/motion/tailoring-02/',
    preview: {
      src: '/templates/website/motion/tailoring-02/preview.webp',
      alt: 'The Fold Atelier tailoring demo: an ivory editorial hero reading “A better fit. A longer story.” beside an illustrated jacket and measuring tape.',
      width: 1200,
      height: 900,
    },
    seoTitle: 'The Fold Atelier — Tailoring website demo by FinTaxTech',
    seoDescription:
      'Preview a personalised tailoring and alterations website demonstration by FinTaxTech, with scroll-driven stitching and an illustrative fitting journey.',
  },
  {
    id: 'automotive-03',
    name: 'Vector Motorworks',
    industry: 'Car repair garages & mechanics',
    description:
      'A premium garage website in midnight blue and amber, with an animated car, a road-line service journey and a sample quote request.',
    route: '/templates/website/motion/automotive-03/',
    preview: {
      src: '/templates/website/motion/automotive-03/preview.webp',
      alt: 'Vector Motorworks garage demo: a midnight-blue hero reading “For the road ahead” alongside an original silver car illustration and an amber quote button.',
      width: 1200,
      height: 900,
    },
    seoTitle: 'Vector Motorworks — Garage website demo by FinTaxTech',
    seoDescription:
      'Preview a personalised garage and mechanic website by FinTaxTech, with servicing, repairs, scroll-driven motion and a sample quote journey.',
  },
  {
    id: 'cleaning-04',
    name: 'Fresh Start',
    industry: 'Cleaning companies',
    description:
      'A friendly local cleaning website in mint and coral, with original room illustrations, a scroll-driven cleaning pass and a complete sample quote journey.',
    route: '/templates/website/motion/cleaning-04/',
    preview: {
      src: '/templates/website/motion/cleaning-04/preview.webp',
      alt: 'Fresh Start cleaning demo: Little Sunday Cleaning, a cream and mint hero reading “A clean home. A little more Sunday.” beside an illustrated living room.',
      width: 1200,
      height: 900,
    },
    seoTitle: 'Fresh Start — Cleaning website demo by FinTaxTech',
    seoDescription:
      'Explore a personalised cleaning company website demonstration by FinTaxTech, with example services, scroll-driven cleaning and a sample quote journey.',
  },
];

export const barberRedirect = {
  route: '/website/motion/templates/barber-01/',
  destination: '/templates/website/motion/barber-01/',
  title: 'The barber template has moved',
  message:
    'Continue to The Brass Standard at its new address. Use the link below if you are not redirected automatically.',
  label: 'Preview The Brass Standard',
};

// Parallel categories share one card contract; allTemplates is the SEO/uniqueness source.
export const threeDGallery = {
  ...motionGallery,
  route: '/templates/website/3d/',
  title: '3D Website Templates',
  intro:
    'Interactive 3D website designs, ready to carry your business name. Explore a local business demo and picture what your own website could become.',
  description:
    'Explore personalised, interactive 3D website templates by FinTaxTech, with practical menus, responsive layouts and thoughtful poster fallbacks.',
  backLabel: 'Browse 3D templates',
  note: 'These are demonstration websites. Example orders do not order, book or pay for anything.',
};
export const threeDTemplates: readonly MotionTemplate[] = [
  {
    id: 'juice-bar-05',
    name: 'Daybreak Blend',
    industry: 'Juice bars & coffee shops',
    description:
      'Cream, citrus and forest green. A turning 3D smoothie cup, a fruit-to-finished scroll story and a playful order-ahead demonstration.',
    route: '/templates/website/3d/juice-bar-05/',
    preview: {
      src: '/templates/website/3d/juice-bar-05/preview.webp',
      alt: 'Daybreak Blend café demo: Daybreak Juice Club, an orange smoothie cup beside “Your morning. Made brighter.” on a warm cream page.',
      width: 1200,
      height: 900,
    },
    seoTitle: 'Daybreak Blend — Juice bar & coffee shop demo by FinTaxTech',
    seoDescription:
      'Explore a personalised juice bar and coffee shop demonstration with a real 3D smoothie cup, an example menu and a build-your-drink demo. Nothing is ordered.',
  },
];
export const allTemplates = [...motionTemplates, ...threeDTemplates];
