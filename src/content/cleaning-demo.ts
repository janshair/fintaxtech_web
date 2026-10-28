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
  services: [
    {
      id: 'regular',
      name: 'The regular reset',
      type: 'REGULAR CLEANING',
      description: 'Kitchen, bathrooms, dusting and floors. A weekly or fortnightly helping hand.',
      price: '£20 / hour',
      detail: 'Example · 2-hour minimum',
      icon: '↻',
    },
    {
      id: 'deep',
      name: 'The deep clean',
      type: 'ONE-OFF CLEANING',
      description:
        'A more detailed refresh, including skirting boards, reachable surfaces and those easy-to-miss corners.',
      price: 'From £120',
      detail: 'Example · scope agreed first',
      icon: '✳',
    },
    {
      id: 'moving',
      name: 'The moving day clean',
      type: 'END OF TENANCY',
      description:
        'An empty-property clean, with a room-by-room checklist agreed around the space.',
      price: 'From £160',
      detail: 'Example · no deposit guarantee',
      icon: '⌂',
    },
    {
      id: 'office',
      name: 'The workspace refresh',
      type: 'SMALL OFFICE CLEANING',
      description:
        'Desks, shared kitchens, washrooms and floors. A schedule that fits around your working day.',
      price: 'By quotation',
      detail: 'Example · after a walkthrough',
      icon: '▦',
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
