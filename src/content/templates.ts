export interface MotionTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  route: `/templates/website/${'motion' | '3d' | 'placeholder'}/${string}/`;
  preview: { src: string; alt: string; width: number; height: number };
  seoTitle: string;
  seoDescription: string;
  // Motion templates: the trade named in their neutral link preview.
  trade?: string;
}

// Link previews (Open Graph and Twitter) for the motion templates. Crawlers do not
// run the page script, so ?name= cannot change them: they name no business at all.
// Regenerate the images with pnpm og-images after changing a template's THEME.
export const templateSocial = (template: MotionTemplate) => ({
  image: `/og/${template.id}.png`,
  width: 1200,
  height: 630,
  alt: `${template.trade} website demo by FinTaxTech: “Your business name here” in the template’s colours.`,
  description: 'Preview a website made for your business. Designed by FinTaxTech.',
});

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
    trade: 'Barber',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Barber website demo – by FinTaxTech',
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
    trade: 'Tailoring',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Tailoring website demo – by FinTaxTech',
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
    trade: 'Garage',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Garage website demo – by FinTaxTech',
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
    trade: 'Cleaning',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Cleaning website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised cleaning company website demonstration by FinTaxTech, with example services, scroll-driven cleaning and a sample quote journey.',
  },
  {
    id: 'gym-06',
    name: 'Full Circuit',
    industry: 'Gyms & fitness centres',
    description:
      'A friendly local gym website in plum and lime, with a barbell that loads as you scroll, an example class timetable and a sample free-visit booking.',
    route: '/templates/website/motion/gym-06/',
    preview: {
      src: '/templates/website/motion/gym-06/preview.webp',
      alt: 'Full Circuit gym demo: Hillmoor Fitness Club, a chalk-white hero reading “Stronger starts round the corner.” beside an illustrated plum kettlebell marked HF.',
      width: 1200,
      height: 900,
    },
    trade: 'Gym',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Gym website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised gym and fitness centre website demonstration by FinTaxTech, with example memberships, a class timetable, scroll-driven motion and a sample visit booking.',
  },
  {
    id: 'consultant-07',
    name: 'Signature',
    industry: 'Freelancers & consultants',
    description:
      'A refined personal-brand website in ink and rose, with a large name and monogram, a scroll that turns a tangle into a clear plan, and a free discovery-call demo.',
    route: '/templates/website/motion/consultant-07/',
    preview: {
      src: '/templates/website/motion/consultant-07/preview.webp',
      alt: 'Signature consultant demo: Morgan Ellis, Business consultant in Dundee, in large serif type beside an arched ink-blue card with the monogram ME, a rose signature line and a “Your photo here” placeholder.',
      width: 1200,
      height: 900,
    },
    trade: 'Consultant',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Consultant website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised website demonstration for freelancers and consultants by FinTaxTech, with example services, case studies, scroll-driven motion and a sample discovery-call booking.',
  },
  {
    id: 'beauty-08',
    name: 'Top Coat',
    industry: 'Beauty, nail & lash salons',
    description:
      'A soft boutique salon website in plum and rose, with a polish bottle that paints the name, a scroll-told manicure, lash and brow scenes, and a sample booking.',
    route: '/templates/website/motion/beauty-08/',
    preview: {
      src: '/templates/website/motion/beauty-08/preview.webp',
      alt: 'Top Coat beauty salon demo: Plum & Polish Studio in large plum serif type with a painted underline, beside a plum nail-polish bottle on a rose arch and an “Open till 8:30pm” example card.',
      width: 1200,
      height: 900,
    },
    trade: 'Beauty salon',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Beauty salon website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised nail, lash and brow salon website demonstration by FinTaxTech, with example treatments and prices, scroll-driven motion and a sample appointment booking.',
  },
  {
    id: 'wedding-09',
    name: 'Save the Date',
    industry: 'Wedding photographers, florists & cake makers',
    description:
      'A romantic editorial website in ivory, sage and blush for wedding suppliers, with a shutter, bouquet or cake that builds as you scroll and a “Check your date” demo.',
    route: '/templates/website/motion/wedding-09/',
    preview: {
      src: '/templates/website/motion/wedding-09/preview.webp',
      alt: 'Save the Date wedding demo: Hazel & Wren, wedding photography in Perthshire, in large serif type beside an illustrated sage camera whose lens shows a couple under a flower arch.',
      width: 1200,
      height: 900,
    },
    trade: 'Wedding supplier',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Wedding supplier website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised website demonstration for wedding photographers, florists and cake makers by FinTaxTech, with example packages, scroll-driven motion and a sample date checker.',
  },
  {
    id: 'plumbing-10',
    name: 'Copperwell',
    industry: 'Plumbers & heating engineers',
    description:
      'A phone-first plumbing and heating website in deep blue and copper, with falling water drops, a flickering flame mark, a photo quote demo and a boiler service reminder. Try it with your own business name.',
    route: '/templates/website/motion/plumbing-10/',
    preview: {
      src: '/templates/website/motion/plumbing-10/preview.webp',
      alt: 'Copperwell plumbing and heating demo: a deep blue hero reading “No heat? A leak? Sorted, properly.” beside a water drop holding a copper flame.',
      width: 1200,
      height: 900,
    },
    trade: 'Plumbing',
    // No demo business name: link previews are read before ?name= applies.
    seoTitle: 'Plumbing website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised plumbing and heating website demo by FinTaxTech, with a photo quote demo, boiler service reminders and answers to common questions.',
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

// Single-screen placeholder sites: the fixed-scope Placeholder Website package.
// Kept out of allTemplates, which also feeds the template website brief.
export const placeholderGallery = {
  ...motionGallery,
  route: '/templates/website/placeholder/',
  title: 'Placeholder Website Templates',
  intro:
    'One page that puts your business online quickly: your logo, name and tagline, with an email address and a WhatsApp button. Preview it with your own business name.',
  description:
    'Explore placeholder website templates by FinTaxTech: a single responsive page with your logo, business name, tagline, email and WhatsApp button.',
  backLabel: 'Browse placeholder templates',
  note: 'This is a demonstration with an invented business. The email address is an example; the WhatsApp button opens a chat with FinTaxTech.',
};
export const placeholderTemplates: readonly MotionTemplate[] = [
  {
    id: 'placeholder-10',
    name: 'Lights On',
    industry: 'Any new business',
    description:
      'A bold single-screen page in near-black with your name set large, a scan-line reveal, your tagline, and email and WhatsApp buttons.',
    route: '/templates/website/placeholder/placeholder-10/',
    preview: {
      src: '/templates/website/placeholder/placeholder-10/preview.webp',
      alt: 'Lights On placeholder demo: Alder & Rook in large white type on a near-black page, with a tagline, an example email address and an orange WhatsApp button.',
      width: 1200,
      height: 900,
    },
    seoTitle: 'Placeholder website demo – by FinTaxTech',
    seoDescription:
      'Explore a personalised single-page placeholder website demonstration by FinTaxTech, with a business name, tagline, email address and WhatsApp button.',
  },
];
// Every demo with a gallery card and a noindex page.
export const galleryTemplates = [...allTemplates, ...placeholderTemplates];

export const websiteGallery = {
  route: '/templates/website/',
  title: 'Website Templates',
  description:
    'Browse 3D and motion website templates by FinTaxTech. Explore interactive product demos and scroll-driven designs for your business.',
};

export const websiteCategories = [
  {
    route: threeDGallery.route,
    title: '3D website templates',
    description: 'Let visitors explore your products from every angle with interactive 3D models.',
    linkLabel: 'Explore 3D templates',
    featuredId: 'juice-bar-05',
  },
  {
    route: motionGallery.route,
    title: 'Motion website templates',
    description:
      'Guide visitors through your site with scroll animations, smooth transitions and subtle hover effects.',
    linkLabel: 'Explore motion templates',
    featuredId: 'gym-06',
  },
  {
    route: placeholderGallery.route,
    title: 'Placeholder website templates',
    description:
      'Get online quickly with one page: your logo, name and tagline, plus email and WhatsApp buttons.',
    linkLabel: 'Explore placeholder templates',
    featuredId: 'placeholder-10',
  },
];

export const templateDirectory = {
  route: '/templates/',
  title: 'Templates',
  breadcrumbLabel: 'templates',
  description: 'Browse FinTaxTech templates for branding, websites, mobile apps and AI automation.',
  pendingMessage: 'Uploading in progress',
};

export const templateCategories = [
  { title: 'Branding', service: 'branding', route: '/templates/branding/' },
  { title: 'Website', service: 'websites', route: websiteGallery.route },
  { title: 'Mobile Apps', service: 'mobile-apps', route: '/templates/mobile-apps/' },
  { title: 'AI Automation', service: 'ai-automation', route: '/templates/ai-automation/' },
] as const;
