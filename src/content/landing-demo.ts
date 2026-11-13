import { company } from './site';
import { placeholderDemo } from './placeholder-demo';

// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#15233b', // main colour: text, dark sections and illustrations
  accent: '#f4b71a', // highlight colour: statement block, buttons and active service
};

// A single scrolling landing page for an invented electrician. The structure
// follows the Single Landing Page package: headline and call to action, a short
// introduction, services, and contact. Contact buttons reach FinTaxTech unless
// the link carries its own ?phone= or ?email=.
export const landingDemo = {
  id: 'landing-12',
  name: 'Brightwire',
  area: 'Leeds',
  route: '/templates/website/landing/landing-12/',
  titleSuffix: ' — Landing page demo by FinTaxTech',
  agency: 'FinTaxTech',
  demoLabel: 'LANDING PAGE / 12 · WEBSITE DEMO',
  gallery: 'All templates',
  contact: '/contact/',
  enquire: 'Discuss this website',
  edit: 'Change details',
  skip: 'Skip to content',
  navLabel: 'Main navigation',
  nav: [
    ['#about', 'About'],
    ['#services', 'Services'],
    ['#contact', 'Contact'],
  ],
  email: company.email,
  phone: placeholderDemo.phone,
  hero: {
    eyebrow: 'ELECTRICIANS',
    title: 'Safe power, neatly finished.',
    lead: 'is a small, local team of electricians.',
    intro:
      'We rewire homes, upgrade fuse boards and fit EV chargers, then test everything and leave the place tidy.',
    cta: 'Request a quote',
    artLabel:
      'Original illustration of an electrician’s work: a consumer unit with switches, cables running to a light and a socket.',
  },
  statement: {
    title: 'Electrical work done properly, from first visit to final test.',
    text: 'We turn up when we say we will and explain the work before it starts. You get a clear written quote, dust sheets down while we work, and every circuit tested before we leave. If something is not right, we come back and put it right.',
  },
  services: {
    title: 'What we can do for you',
    note: 'Example services for this demo. Your page lists your own.',
    items: [
      {
        code: 'rewire',
        name: 'Full and partial rewires',
        text: 'New wiring for older homes, planned room by room to keep disruption low.',
      },
      {
        code: 'board',
        name: 'Fuse board upgrades',
        text: 'Modern consumer units with the protection today’s regulations expect.',
      },
      {
        code: 'ev',
        name: 'EV charger installation',
        text: 'A home charger fitted on a driveway or garage wall, with its own circuit.',
      },
      {
        code: 'lighting',
        name: 'Lighting, indoors and out',
        text: 'Downlights, pendants, garden and security lighting, placed where you need it.',
      },
      {
        code: 'fault',
        name: 'Fault finding and repairs',
        text: 'Tripping switches and dead sockets traced and fixed.',
      },
      {
        code: 'report',
        name: 'Electrical safety reports',
        text: 'Condition reports for landlords, buyers and homeowners.',
      },
    ],
  },
  contactSection: {
    title: 'Get a quote',
    text: 'Tell us what you need and we will come back with a price. Call, email or send a WhatsApp message, whichever suits you.',
    call: 'Call us',
    emailUs: 'Email us',
    whatsapp: 'Chat on WhatsApp',
    hours: 'Monday to Saturday, 8am to 6pm',
    hoursLabel: 'Opening hours',
    areaLabel: 'Areas we cover',
    areaSuffix: ' and nearby',
    chatLabel: 'Example WhatsApp conversation',
    chat: [
      ['in', 'Hi, could I get a quote for an EV charger on my driveway?'],
      ['out', 'Of course. Could you send a photo of where you would like it?'],
      ['in', 'Sent! Is next week possible?'],
    ],
  },
  footer: {
    tagline: 'Safe power, neatly finished.',
    note: 'Example business. Call, email and WhatsApp reach FinTaxTech, who built this page.',
    noteOwnDetails: 'Example business. Website by FinTaxTech.',
  },
  nameDialog: {
    eyebrow: 'YOUR NAME, YOUR WEBSITE',
    title: 'See it with your business name',
    description: 'Type your business name and the area you cover to preview your own landing page.',
    nameLabel: 'Business name',
    namePlaceholder: 'Northside Plumbing',
    areaLabel: 'Area you cover (optional)',
    areaPlaceholder: 'Dundee',
    hint: 'Kept only in this page and its URL.',
    error: 'Enter your business name, or explore the sample.',
    submit: 'Preview my page',
    restore: 'Show the sample business',
    close: 'Close details dialog',
  },
  updated: 'Preview updated for ',
};
