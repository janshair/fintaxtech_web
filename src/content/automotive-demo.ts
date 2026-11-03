// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#111e26', // main colour: header, buttons, headings, icons (and 3D sleeve/label)
  accent: '#efc36c', // highlight colour: main call-to-action, stars, small details
};

// Edit prices here, in one place. Fixed-cost jobs may show a price. Repairs that depend
// on the car (brakes, clutch, exhausts, timing belt) have no entry: they always say
// "Free quote".
export const PRICES = {
  mot: '£54.85',
  full: 'From £xx',
  interim: 'From £xx',
  oil: 'From £xx',
  combo: 'From £xx',
  diagnostics: '£xx, deducted if we do the repair',
  tyres: 'Ask for prices',
  aircon: 'From £xx',
} as const;
const FREE_QUOTE = 'Free quote';

export const automotiveDemo = {
  id: 'automotive-03',
  name: 'Vector Motorworks',
  monogram: 'VM',
  // Shown until ?area= gives the town.
  area: 'Dundee',
  route: '/templates/website/motion/automotive-03/',
  titleSuffix: ' — Garage website demo by FinTaxTech',
  agency: 'FinTaxTech',
  demoLabel: 'AUTOMOTIVE / 03 · WEBSITE DEMO',
  gallery: 'All templates',
  contact: '/contact/',
  enquire: 'Discuss this website',
  edit: 'Change business name',
  skip: 'Skip to content',
  menu: 'Menu',
  navLabel: 'Garage navigation',
  nav: [
    ['#services', 'Services & prices'],
    ['#mot', 'MOT'],
    ['#quote', 'Free quote'],
    ['#visit', 'Find us'],
  ],
  freeQuote: FREE_QUOTE,
  close: 'Close',
  hero: {
    eyebrow: 'MOT · SERVICING · REPAIRS',
    // The headline is the garage name; the town comes from ?area=.
    before: 'MOTs, servicing and repairs for cars and vans in ',
    after: '. We call to explain what’s needed before any work starts.',
    mot: 'Book your MOT',
    quote: 'Get a free quote',
    note: 'Drop-off from 8am. Free MOT retest within 10 working days.',
    artLabel:
      'Original illustration of a silver car in profile, with detailed wheels, an amber headlight and technical guide lines.',
    artCaption: 'CARS · VANS · MOTORHOMES',
    artDetail: 'MOT / SERVICING / DIAGNOSTICS / REPAIRS',
  },
  // Example promises under the hero: keep only what the garage really offers.
  trustLabel: 'Why drivers choose us',
  trust: [
    'We call before any work starts',
    'Repairs guaranteed',
    'All makes & models',
    'Cars, vans & motorhomes',
  ],
  accreditationsLabel: 'Accreditations',
  // Logo slots are hidden by default. Set `show: true` ONLY if the garage really holds
  // that membership, and replace the text badge with the official logo the scheme
  // supplies to members. Never show a badge the garage has not earned.
  accreditations: [
    { name: 'Good Garage Scheme', show: false },
    { name: 'The Motor Ombudsman', show: false },
    { name: 'IMI (Institute of the Motor Industry)', show: false },
    { name: 'Bosch Car Service', show: false },
  ],
  services: {
    eyebrow: '01 / SERVICES & PRICES',
    title: 'MOT, servicing\n& car repairs.',
    intro: 'Fixed jobs have a price. Repairs depend on your car, so we look first and quote free.',
    note: 'Example prices. Repairs are quoted after we’ve looked at your car.',
    repairsTitle: 'Repairs & more',
    // The first six are the main cards; the rest form the compact list underneath.
    items: [
      {
        code: 'mot',
        name: 'MOT',
        description: 'Class 4 & 7 MOTs. Free retest within 10 working days.',
        price: PRICES.mot,
        repair: false,
      },
      {
        code: 'full',
        name: 'Full service',
        description: 'Everything on your car’s service schedule, with a written report.',
        price: PRICES.full,
        repair: false,
      },
      {
        code: 'interim',
        name: 'Interim service',
        description: 'Oil, filter, top-ups and a safety check between full services.',
        price: PRICES.interim,
        repair: false,
      },
      {
        code: 'oil',
        name: 'Oil & filter change',
        description: 'The right oil for your engine and a new filter.',
        price: PRICES.oil,
        repair: false,
      },
      {
        code: 'combo',
        name: 'MOT + service',
        description: 'Both in one visit. Cheaper than booking them separately.',
        price: PRICES.combo,
        repair: false,
        badge: 'Best value',
      },
      {
        code: 'diagnostics',
        name: 'Diagnostics',
        description: 'Warning light on? We read the fault codes and tell you what’s wrong.',
        price: PRICES.diagnostics,
        repair: false,
      },
      {
        code: 'brakes',
        name: 'Brakes',
        description: 'Pads, discs and brake fluid.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'clutch',
        name: 'Clutch & gearbox',
        description: 'Slipping clutch or stiff gears.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'tyres',
        name: 'Tyres',
        description: 'Fitted, balanced and puncture repairs.',
        price: PRICES.tyres,
        repair: false,
      },
      {
        code: 'exhausts',
        name: 'Exhausts',
        description: 'Blowing, rattling or failed emissions.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'timing-belt',
        name: 'Timing belt',
        description: 'Changed on time to protect your engine.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'aircon',
        name: 'Air con regas',
        description: 'Cold air again, with a leak check.',
        price: PRICES.aircon,
        repair: false,
      },
    ],
  },
  mot: {
    eyebrow: '02 / MOT',
    title: 'MOT due?\nBook it in.',
    // Edit to match the garage's DVSA approval.
    approval: 'DVSA-approved MOT test centre',
    priceLabel: 'MOT test',
    checkedTitle: 'What’s checked',
    checked: [
      'Brakes, lights and indicators',
      'Tyres, wheels and suspension',
      'Steering and seatbelts',
      'Exhaust and emissions',
      'Windscreen, wipers and mirrors',
    ],
    retest: 'Free retest within 10 working days',
    retestNote: 'Example copy. Retest terms are set by the garage.',
    book: 'Book your MOT',
    reminder: {
      title: 'Free MOT reminder',
      intro: 'We’ll text you before your MOT is due.',
      plateLabel: 'Number plate',
      phoneLabel: 'Mobile number',
      submit: 'Remind me',
      thanks: 'Thanks – we’ll text you a reminder before your MOT is due.',
      again: 'Add another car',
    },
  },
  process: {
    eyebrow: '03 / HOW IT WORKS',
    title: 'Book in.\nWe’ll do the rest.',
    intro: 'Three simple steps, and no work without your say-so.',
    caption: 'HOW IT WORKS',
    artLabel:
      'Illustrated car on a workshop lift: a diagnostic sweep, rotating wheels, a service tool and a final check follow scrolling.',
    steps: [
      ['Book in', 'Book online or give us a call. Drop your car off from 8am.'],
      [
        'We check and call you',
        'We find out what’s needed and call you with the price. Nothing is done until you say yes.',
      ],
      ['Fixed and ready', 'We do the work, test it and call you when it’s ready to collect.'],
    ],
  },
  work: {
    eyebrow: '04 / OUR WORK',
    title: 'Before and after.',
    intro: 'Illustrated examples. Your own workshop photos go here.',
    before: 'Before',
    after: 'After',
    items: [
      {
        kind: 'brakes',
        title: 'New brake discs',
        caption: 'Worn discs replaced.',
        alt: 'Illustration comparing a marked brake disc with a clean replacement disc.',
      },
      {
        kind: 'tyres',
        title: 'New tyres',
        caption: 'Worn tread replaced.',
        alt: 'Illustration comparing shallow tyre markings with the defined tread of a replacement tyre.',
      },
      {
        kind: 'filter',
        title: 'New air filter',
        caption: 'Changed at the service.',
        alt: 'Illustration comparing a dusty air filter with a clean pleated replacement.',
      },
    ],
  },
  reviews: {
    title: 'What drivers say.',
    intro: 'Example reviews for this demo. Your own Google reviews go here.',
    label: 'Example review',
    // Example reviews only: replace with the garage's real Google reviews.
    items: [
      {
        text: 'MOT and service done the same morning. They called before changing the brake pads and the price was exactly what they said.',
        name: 'Sarah M.',
      },
      {
        text: 'Warning light came on and they found the fault the same day. Clear explanation and no pressure.',
        name: 'Daniel R.',
      },
      {
        text: 'Honest garage. Showed me the old parts and the van was ready when they said it would be.',
        name: 'Priya K.',
      },
    ],
  },
  quote: {
    eyebrow: '05 / FREE QUOTE',
    title: 'Get a free quote.',
    intro:
      'Tell us what your car needs. We will call you back with a price before any work starts.',
    demoNote: 'Demo only: nothing is sent or stored.',
    call: 'Prefer to talk? Call ',
    tools:
      'Already use a garage booking or workshop management system? We can discuss linking it to your website.',
    plateLabel: 'Number plate',
    platePlaceholder: 'AB12 CDE',
    serviceLabel: 'Service needed',
    dateLabel: 'Preferred date',
    nameLabel: 'Your name',
    phoneLabel: 'Phone number',
    submit: 'Get my free quote',
    thanksTitle: 'Request received',
    thanks: 'Thanks – we’ll call you back with a price before any work starts.',
    again: 'Send another request',
    errors: {
      plate: 'Enter your number plate using 2–8 letters, numbers or spaces.',
      name: 'Enter your name.',
      phone: 'Enter a UK phone number, for example 07700 900123.',
    },
  },
  visit: {
    eyebrow: '06 / FIND US',
    title: 'Opening hours\nand directions.',
    hoursLabel: 'Opening hours',
    // Example hours: keep a Saturday morning line if the garage opens then.
    hours: [
      ['Monday – Friday', '08:00 – 17:30'],
      ['Saturday', '08:30 – 12:30'],
      ['Sunday', 'Closed'],
    ],
    dropOff: 'Drop-off from 8am',
    sampleNote: 'Example opening hours for this demonstration.',
    locationLabel: 'Find the workshop',
    // Example street address: the town comes from ?area= (or `area` above). The map and
    // directions use both.
    address: 'Unit 4, Station Road Industrial Estate',
    mapNote: 'Example address for this demo.',
    showMap: 'Show map',
    mapPrivacy: 'Loads Google Maps only when you choose to.',
    // Example number from Ofcom's range reserved for drama, so it never reaches anyone.
    // ?phone= replaces it everywhere.
    phone: '01632 960123',
    call: 'Call',
    whatsapp: 'WhatsApp',
    directions: 'Directions',
    contactLabel: 'Contact the garage',
  },
  practical: {
    title: 'Good to know',
    items: [
      [
        'Can you give a price straight away?',
        'Fixed jobs such as MOTs and services have a set price. Repairs depend on your car, so we look first and call you with a free quote.',
      ],
      [
        'Can I wait while my car is done?',
        'For an MOT or oil change, usually yes. For longer jobs, drop off from 8am and we will call you when it is ready.',
      ],
      [
        'Will you do extra work without asking?',
        'No. If we find something else, we call you first with the price. Nothing is done without your approval.',
      ],
      [
        'What if I am not sure what is wrong?',
        'Choose Diagnostics / warning lights in the quote form, or call us and describe the problem.',
      ],
    ],
  },
  footer:
    'A demonstration website by FinTaxTech. No real quotes, MOT bookings or reminders are requested here.',
  offer: 'Picture your garage here?',
  offerDetail: 'We’ll make it yours.',
  offerAction: 'Talk to FinTaxTech',
  offerBefore: 'Want this for ',
  offerAfter: '? Talk to FinTaxTech',
  nameDialog: {
    title: 'Your name.\nYour next website.',
    description:
      'See this garage website with your business name. Your personalised link is ready to share.',
    label: 'Business name',
    placeholder: 'Your garage name',
    hint: 'Up to 100 characters. Kept in this page and its link only.',
    submit: 'Preview my website',
    reset: 'Explore the sample',
    required: 'Enter your business name to preview it.',
    updated: 'Website preview updated for ',
  },
  noScript:
    'This is a demonstration website. Enable JavaScript to personalise it and try the quote and MOT reminder forms, or contact FinTaxTech to discuss your website.',
} as const;
