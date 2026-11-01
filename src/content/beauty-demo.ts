// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#5c2a4f', // main colour: header, buttons, headings, polish bottle, painted nails
  accent: '#e7a6b0', // highlight colour: main call-to-action, stars, sparkles, small details
};

// Every treatment, duration and price is an example. No claims about results,
// how long anything lasts, or suitability for everyone.
export const treatmentGroups = [
  { id: 'nails', label: 'Nails' },
  { id: 'lashes', label: 'Lashes' },
  { id: 'brows', label: 'Brows' },
  { id: 'extras', label: 'Extras' },
] as const;

export const treatments = [
  {
    id: 'gel',
    group: 'nails',
    name: 'Gel manicure',
    description: 'Nails shaped and finished in a gel colour of your choice with a glossy top coat.',
    duration: '45 min',
    price: '£28',
  },
  {
    id: 'biab',
    group: 'nails',
    name: 'BIAB overlay',
    description: 'A builder gel overlay on your natural nails, in a sheer or full colour finish.',
    duration: '60 min',
    price: '£35',
  },
  {
    id: 'acrylic',
    group: 'nails',
    name: 'Acrylic full set',
    description: 'Acrylic extensions shaped to the length and shape you choose.',
    duration: '90 min',
    price: '£40',
  },
  {
    id: 'nail-art',
    group: 'nails',
    name: 'Nail art',
    description: 'Add to any set: dots, French tips, chrome or hand-painted designs.',
    duration: '+15 min',
    price: 'From £5',
  },
  {
    id: 'classic',
    group: 'lashes',
    name: 'Classic lash extensions',
    description: 'One extension on each natural lash, for a soft, natural look.',
    duration: '90 min',
    price: '£45',
  },
  {
    id: 'hybrid',
    group: 'lashes',
    name: 'Hybrid lash extensions',
    description: 'A mix of classic and volume lashes for a little extra texture.',
    duration: '105 min',
    price: '£55',
  },
  {
    id: 'volume',
    group: 'lashes',
    name: 'Volume lash extensions',
    description: 'Fans of fine lashes on each natural lash, for a fuller look.',
    duration: '120 min',
    price: '£65',
  },
  {
    id: 'lift',
    group: 'lashes',
    name: 'Lash lift & tint',
    description: 'Your own lashes lifted and tinted. A patch test may be needed first.',
    duration: '60 min',
    price: '£40',
  },
  {
    id: 'shape',
    group: 'brows',
    name: 'Brow shape',
    description: 'Waxed or threaded and tidied into a shape that suits you.',
    duration: '20 min',
    price: '£14',
  },
  {
    id: 'tint',
    group: 'brows',
    name: 'Brow tint',
    description: 'A tint matched to your colouring. A patch test may be needed first.',
    duration: '15 min',
    price: '£10',
  },
  {
    id: 'lamination',
    group: 'brows',
    name: 'Brow lamination',
    description: 'Brow hairs set in place, finished with a shape and tint.',
    duration: '50 min',
    price: '£38',
  },
  {
    id: 'removal',
    group: 'extras',
    name: 'Gel or BIAB removal',
    description: 'Careful removal, with nails tidied and oiled afterwards.',
    duration: '20 min',
    price: '£10',
  },
  {
    id: 'repair',
    group: 'extras',
    name: 'Single nail repair',
    description: 'One nail rebuilt or replaced between appointments.',
    duration: '10 min',
    price: '£4',
  },
  {
    id: 'lash-removal',
    group: 'extras',
    name: 'Lash extension removal',
    description: 'Extensions gently removed with a professional remover.',
    duration: '20 min',
    price: '£12',
  },
  {
    id: 'hand-care',
    group: 'extras',
    name: 'Hand & cuticle care',
    description: 'A short hand massage, cuticle tidy and nourishing oil. Add to any visit.',
    duration: '+10 min',
    price: '£8',
  },
] as const;

export const beautyDemo = {
  id: 'beauty-08',
  route: '/templates/website/motion/beauty-08/',
  name: 'Plum & Polish Studio',
  monogram: 'PP',
  area: 'Dundee',
  titleSuffix: ' — Website demo by FinTaxTech',
  label: 'Top Coat · beauty-08 · website demo',
  hero: {
    eyebrow: 'Nails · Lashes · Brows',
    tagline: 'Polished nails, lifted lashes and brows that suit you.',
    description:
      'A calm little studio with late evenings, friendly technicians and online booking in a few taps.',
    action: 'Book an appointment',
    note: 'A fictional salon. Example treatments, prices and opening hours.',
  },
  story: [
    ['Shape & prep', 'Nails filed to your chosen shape and cuticles tidied, ready for colour.'],
    ['Base coat', 'A thin base coat goes on first, so the colour has something to hold.'],
    ['Colour', 'Your chosen shade, brushed on from cuticle to tip in thin, even layers.'],
    ['Top coat', 'A glossy top coat to finish. On your finished website, clients book it here.'],
  ],
  lashes: {
    title: 'Lashes, lifted and curled.',
    text: 'Classic, hybrid or volume extensions, or a lift and tint for your own lashes.',
  },
  brows: {
    title: 'Brows, shaped and tinted.',
    text: 'Shaping, tinting and lamination, mapped to suit your face first.',
  },
  patchTest:
    'A patch test may be needed 48 hours before your first lash or brow tint — your salon will confirm.',
  gallery: [
    { kind: 'swatch', label: 'Gel colour' },
    { kind: 'french', label: 'French tips' },
    { kind: 'art', label: 'Nail art' },
    { kind: 'lash', label: 'Lash set' },
    { kind: 'brow', label: 'Brow lamination' },
    { kind: 'chrome', label: 'Chrome finish' },
  ],
  before: [
    'Let us know about any allergies or sensitivities when you book.',
    'A patch test may be needed 48 hours before your first lash or brow tint — your salon will confirm.',
    'For lash appointments, come without eye make-up so we can start straight away.',
    'Bring a photo of a design or colour you love. It really helps.',
  ],
  aftercare: [
    'Keep new lashes dry and away from steam for the first day.',
    'Use cuticle oil each day to keep nails and skin comfortable.',
    'Please don’t pick or peel gel. Book a removal instead.',
    'Brush laminated brows into place each morning.',
  ],
  reviews: [
    {
      initials: 'MR',
      name: 'Megan R.',
      date: '2 weeks ago',
      text: 'Such a calm, friendly visit. Amira took her time getting the shape right, and the colour is exactly what I asked for.',
    },
    {
      initials: 'AK',
      name: 'Aisha K.',
      date: '1 month ago',
      text: 'My first lash lift. They explained the patch test, answered all my questions and I left feeling great.',
    },
    {
      initials: 'LT',
      name: 'Lauren T.',
      date: '3 months ago',
      text: 'Easy to book a late slot after work, and my nail art came out even better than the photo I brought.',
    },
  ],
  hours: [
    ['Monday', 'Closed'],
    ['Tuesday – Wednesday', '09:30 – 18:00'],
    ['Thursday – Friday', '09:30 – 20:30'],
    ['Saturday', '09:00 – 16:00'],
    ['Sunday', 'Closed'],
  ],
  flow: {
    technicians: ['Any available', 'Amira', 'Jess'],
    days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    times: ['10:00', '12:30', '15:00', '17:30', '19:00'],
  },
  nameDialog: {
    title: 'See it with your salon’s name.',
    description:
      'Type your business name, for example The Lash Loft. It stays in this page and its shareable link.',
  },
  policy: {
    title: 'Your booking policy here',
    text: 'Example: a small deposit secures your appointment and comes off your bill. Please give 24 hours’ notice to move or cancel. Your own policy goes here.',
  },
  voucher: {
    value: '£25',
    note: 'Gift vouchers from £20, for any treatment. Example values.',
  },
  contactNotes: {
    call: 'On your finished website, Call would ring your salon directly. Add your number to the preview link to try it.',
    message:
      'On your finished website, WhatsApp would open a chat with your salon. Add your number to the preview link to try it.',
    directions:
      'Your finished website could link to directions to your salon. This is a local map placeholder, with no map service loaded.',
    voucher:
      'On your finished website, clients could buy a gift voucher online or ask you for one. This demo sells nothing.',
  },
} as const;
