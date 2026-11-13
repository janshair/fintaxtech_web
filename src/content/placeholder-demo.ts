import { company } from './site';

// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#101014', // page colour: the dark stage behind the name
  accent: '#ff6b3d', // highlight colour: logo badge and WhatsApp button
};

// A single-screen placeholder site: logo, name, tagline, and call, email and
// WhatsApp buttons. The business is invented; the buttons reach FinTaxTech unless
// the link carries its own ?phone= or ?email=.
export const placeholderDemo = {
  id: 'placeholder-11',
  name: 'Alder & Rook',
  tagline: 'Fitted furniture, made to measure.',
  email: company.email,
  // Used by Call me and WhatsApp. international: digits only, for tel: and wa.me links.
  phone: { display: '+44 7442 906018', international: '447442906018' },
  route: '/templates/website/placeholder/placeholder-11/',
  titleSuffix: ' — Placeholder website demo by FinTaxTech',
  agency: 'FinTaxTech',
  demoLabel: 'PLACEHOLDER / 11 · WEBSITE DEMO',
  gallery: 'All templates',
  contact: '/contact/',
  enquire: 'Discuss this website',
  edit: 'Change details',
  skip: 'Skip to content',
  status: 'Full website on its way',
  counter: '01 / 01',
  contactLabel: 'Get in touch',
  call: 'Call me',
  emailMe: 'Email me',
  whatsapp: 'Message on WhatsApp',
  footnote: 'Example business. Call, email and WhatsApp reach FinTaxTech, who built this page.',
  // Shown instead once the link carries its own ?phone= and ?email=.
  footnoteOwnDetails: 'Example business. Website by FinTaxTech.',
  nameDialog: {
    eyebrow: 'YOUR NAME, YOUR WEBSITE',
    title: 'See it with your business name',
    description: 'Type your business name and tagline to preview your own placeholder page.',
    nameLabel: 'Business name',
    namePlaceholder: 'Northside Bakery',
    taglineLabel: 'Tagline (optional)',
    taglinePlaceholder: 'Fresh bread, baked every morning.',
    hint: 'Kept only in this page and its URL.',
    error: 'Enter your business name, or explore the sample.',
    submit: 'Preview my page',
    restore: 'Show the sample business',
    close: 'Close details dialog',
  },
  updated: 'Preview updated for ',
};
