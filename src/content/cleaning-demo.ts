// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#224f42', // main colour: header, buttons, headings, icons (and 3D sleeve/label)
  accent: '#f09473', // highlight colour: main call-to-action, stars, small details
};

export const cleaningDemo = {
  id: 'cleaning-04',
  route: '/templates/website/motion/cleaning-04/',
  name: 'Little Sunday Cleaning',
  monogram: 'LS',
  titleSuffix: ' — Cleaning website demo by FinTaxTech',
  label: 'Fresh Start · cleaning-04 · website demo',
  hero: {
    eyebrow: 'HOME & SMALL OFFICE CLEANING',
    title: 'A clean home.\nA little more Sunday.',
    description:
      'The weekly reset. The big fresh start. A little help making space for the things you love.',
    action: 'Find your clean',
    note: 'A fictional business. Example services, prices and availability.',
  },
  // The service types a typical local cleaning company offers, in our own words. Prices
  // are "Free quote", as many cleaners quote per job. frequency is the quote demo's
  // starting choice for each service.
  services: [
    {
      id: 'regular',
      name: 'Regular home cleaning',
      type: 'REGULAR CLEANING',
      description:
        'Kitchens, bathrooms, dusting, floors and beds made, on a weekly, fortnightly or monthly schedule.',
      price: 'Free quote',
      detail: 'Example · schedule to suit you',
      icon: '↻',
      frequency: 'Weekly',
    },
    {
      id: 'tenancy',
      name: 'End of tenancy cleaning',
      type: 'END OF TENANCY',
      description:
        'An empty-property clean for tenants, landlords and letting agents, including ovens and carpets.',
      price: 'Free quote',
      detail: 'Example · checklist agreed with you',
      icon: '⌂',
      frequency: 'One-off',
    },
    {
      id: 'moving-in',
      name: 'Moving-in clean',
      type: 'MOVE-IN CLEANING',
      description:
        'A top-to-bottom clean before you unpack, so a new home is fresh from the first day.',
      price: 'Free quote',
      detail: 'Example · empty property',
      icon: '→',
      frequency: 'One-off',
    },
    {
      id: 'carpet',
      name: 'Carpet cleaning',
      type: 'CARPETS',
      description: 'Deep cleaning for home and business carpets, with stain and odour treatment.',
      price: 'Free quote',
      detail: 'Example · homes and businesses',
      icon: '▤',
      frequency: 'One-off',
    },
    {
      id: 'hoarding',
      name: 'Hoarding clean-up',
      type: 'HOARDING CLEAN-UP',
      description:
        'Patient, judgement-free clearing and cleaning to make a home safe and usable again.',
      price: 'Free quote',
      detail: 'Example · paced around you',
      icon: '✳',
      frequency: 'One-off',
    },
    {
      id: 'biohazard',
      name: 'Biohazard cleaning',
      type: 'SPECIALIST CLEANING',
      description:
        'Specialist clean-ups after illness, trauma, mould, fire or smoke, handled discreetly.',
      price: 'Free quote',
      detail: 'Example · assessed before work starts',
      icon: '△',
      frequency: 'One-off',
    },
    {
      id: 'office',
      name: 'Office cleaning',
      type: 'COMMERCIAL',
      description: 'Desks, kitchens, washrooms and floors, cleaned around your working hours.',
      price: 'Free quote',
      detail: 'Example · after a walkthrough',
      icon: '▦',
      frequency: 'Weekly',
    },
    {
      id: 'laundry',
      name: 'Laundry service',
      type: 'LAUNDRY',
      description: 'Washing, drying, folding and ironing for homes, landlords and businesses.',
      price: 'Free quote',
      detail: 'Example · homes and businesses',
      icon: '○',
      frequency: 'Weekly',
    },
    {
      id: 'hotel',
      name: 'Hotel cleaning & laundry',
      type: 'HOSPITALITY',
      description: 'Room cleaning and linen for hotels and guest houses.',
      price: 'Free quote',
      detail: 'Example · rooms and linen',
      icon: '✧',
      frequency: 'Weekly',
    },
    {
      id: 'short-let',
      name: 'Airbnb cleaning',
      type: 'SHORT LETS',
      description: 'Quick turnarounds between guests, with fresh linen and a guest-ready finish.',
      price: 'Free quote',
      detail: 'Example · between bookings',
      icon: '◇',
      frequency: 'Weekly',
    },
  ],
  process: [
    [
      'Tell us about your space',
      'Choose the clean, the rooms and how often you need a hand. No two homes need quite the same thing.',
    ],
    [
      'Agree the little details',
      'Confirm the checklist, supplies, access and a price before a real visit is arranged.',
    ],
    [
      'Make room for your day',
      'Your agreed areas get their reset. On your finished website, customers could request their next clean.',
    ],
  ],
  work: [
    ['room', 'A living room reset', 'Floors, reachable surfaces and a little breathing space.'],
    ['kitchen', 'A kitchen fresh start', 'Worktops, splashbacks and the everyday details.'],
    ['bath', 'A bathroom refresh', 'Basins, taps and the surfaces that need extra attention.'],
  ],
  hours: [
    ['Monday – Friday', '08:30 – 17:30'],
    ['Saturday', '09:00 – 13:00'],
    ['Sunday', 'Closed'],
  ],
  questions: [
    [
      'Do I need to be home?',
      'For a real booking, you would agree access and key arrangements directly with the cleaning company before the first visit.',
    ],
    [
      'Are products and equipment included?',
      'This would be confirmed in your quote. Tell the company about preferred products, delicate surfaces, pets or allergies before agreeing the checklist.',
    ],
    [
      'What is included in an end-of-tenancy clean?',
      'An agreed checklist for the empty property. Oven interiors, carpets and external windows would be discussed separately. No deposit return is promised.',
    ],
    [
      'Can I book from this page?',
      'This is a sample website. The quote journey sends nothing and reserves no visit. The FinTaxTech enquiry links are for discussing your own website.',
    ],
  ],
  nameDialog: {
    title: 'Make yourself at home.',
    description:
      'Try your cleaning company’s name. For example, Tayside Home Cleaning. Your name stays in this page and its shareable link.',
  },
  contactNotes: {
    call: 'On your finished website, Call would dial your business number. This preview does not place a call.',
    message:
      'On your finished website, WhatsApp would open a chat with your business. This preview opens no chat and sends no message.',
    directions:
      'Your service area is shown below. Your finished website could link to directions for your real business address. This is a local map placeholder, with no map service loaded.',
  },
} as const;
