export interface MotionTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  route: `/templates/website/motion/${string}/`;
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
];

export const barberRedirect = {
  route: '/website/motion/templates/barber-01/',
  destination: '/templates/website/motion/barber-01/',
  title: 'The barber template has moved',
  message:
    'Continue to The Brass Standard at its new address. Use the link below if you are not redirected automatically.',
  label: 'Preview The Brass Standard',
};
