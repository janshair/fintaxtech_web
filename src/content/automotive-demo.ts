// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#111e26', // main colour: header, buttons, headings, icons (and 3D sleeve/label)
  accent: '#efc36c', // highlight colour: main call-to-action, stars, small details
};

// Edit prices here, in one place. Fixed-cost jobs may show a price. Repairs that depend
// on the car (brakes, clutch, timing belt) have no entry: they always say "Free quote".
export const PRICES = {
  mot: '£54.85',
  interim: 'From £xx',
  full: 'From £xx',
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
    first: 'FOR THE',
    second: 'ROAD AHEAD.',
    description:
      'MOTs, servicing and repairs for all makes and models. Clear prices for fixed jobs, a free quote for repairs, and no work done without your approval.',
    mot: 'Book your MOT',
    quote: 'Get a free quote',
    note: 'Drop-off from 8am. We call you with a price before any repair starts.',
    artLabel:
      'Original illustration of a silver car in profile, with detailed wheels, an amber headlight and technical guide lines.',
    artCaption: 'CARE IN EVERY DETAIL',
    artDetail: 'MOT / SERVICING / DIAGNOSTICS / REPAIRS',
  },
  services: {
    eyebrow: '01 / SERVICES & PRICES',
    title: 'Clear prices.\nHonest quotes.',
    intro:
      'Fixed jobs show a price. Repairs depend on your car, so we look first and give you a free quote.',
    note: 'Example prices for this demo. Repair prices are always agreed with you before work starts.',
    items: [
      {
        code: 'mot',
        name: 'MOT',
        description: 'Class 4 and 7 MOT tests. Wait in reception or drop your car off.',
        price: PRICES.mot,
        repair: false,
      },
      {
        code: 'interim',
        name: 'Interim service',
        description: 'Oil and filter, fluid top-ups and a safety check between full services.',
        price: PRICES.interim,
        repair: false,
      },
      {
        code: 'full',
        name: 'Full service',
        description: 'A complete service to your car’s schedule, with a written report.',
        price: PRICES.full,
        repair: false,
      },
      {
        code: 'oil',
        name: 'Oil & filter change',
        description: 'The right engine oil for your car and a new oil filter.',
        price: PRICES.oil,
        repair: false,
      },
      {
        code: 'combo',
        name: 'MOT + service combo',
        description: 'Your MOT and service in one visit, for less than booking them separately.',
        price: PRICES.combo,
        repair: false,
      },
      {
        code: 'diagnostics',
        name: 'Diagnostics / warning lights',
        description: 'A warning light on the dash? We read the fault codes and find the cause.',
        price: PRICES.diagnostics,
        repair: false,
      },
      {
        code: 'brakes',
        name: 'Brakes, pads & discs',
        description:
          'Squealing, grinding or a soft pedal? We check them and tell you what is needed.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'clutch',
        name: 'Clutch & gearbox',
        description:
          'Slipping clutch or difficult gear changes. We find the fault and quote first.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'timing-belt',
        name: 'Timing belt / wet belt',
        description: 'Replaced at the right interval to protect your engine, wet belts included.',
        price: FREE_QUOTE,
        repair: true,
      },
      {
        code: 'tyres',
        name: 'Tyres',
        description: 'New tyres fitted and balanced, and puncture repairs where it is safe.',
        price: PRICES.tyres,
        repair: false,
      },
      {
        code: 'aircon',
        name: 'Air con regas',
        description: 'Air con blowing warm? We regas the system and check it for leaks.',
        price: PRICES.aircon,
        repair: false,
      },
    ],
  },
  mot: {
    eyebrow: '02 / MOT',
    title: 'MOT due?\nBook it in.',
    // Edit to match the garage's DVSA approval and the vehicle classes it tests.
    approval: 'DVSA-approved MOT test centre · Classes 4 & 7',
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
      title: 'Get a free MOT reminder',
      intro: 'We’ll text you before your MOT is due.',
      plateLabel: 'Number plate',
      phoneLabel: 'Mobile number',
      submit: 'Remind me',
      thanks: 'Thanks – we’ll text you a reminder before your MOT is due.',
      again: 'Add another car',
    },
  },
  process: {
    eyebrow: '03 / IN THE WORKSHOP',
    title: 'Know the work.\nThen the way forward.',
    intro: 'Follow the road line through an illustrated service journey.',
    caption: 'ILLUSTRATED SERVICE JOURNEY',
    artLabel:
      'Illustrated car on a workshop lift: a diagnostic sweep, rotating wheels, a service tool and a final check follow scrolling.',
    steps: [
      [
        'Tell us what changed',
        'Describe the issue or the service you need. The garage confirms the next step and a suitable time.',
      ],
      [
        'Inspect. Explain. Agree.',
        'The vehicle is assessed and the proposed work explained. The scope and price are agreed before repairs.',
      ],
      [
        'Work done. Checked.',
        'Agreed work is carried out and checked. The garage talks you through it before collection.',
      ],
    ],
  },
  work: {
    eyebrow: '04 / UNDER THE SURFACE',
    title: 'Small details.\nProper attention.',
    intro: 'Illustrated before-and-after examples. Your own workshop photos belong here.',
    before: 'Before',
    after: 'After',
    items: [
      {
        kind: 'brakes',
        title: 'A fresh surface',
        caption: 'An illustrated brake-disc replacement.',
        alt: 'Illustration comparing a marked brake disc with a clean replacement disc.',
      },
      {
        kind: 'tyres',
        title: 'A new set of grooves',
        caption: 'An illustrated tyre replacement.',
        alt: 'Illustration comparing shallow tyre markings with the defined tread of a replacement tyre.',
      },
      {
        kind: 'filter',
        title: 'A clean start',
        caption: 'An illustrated air-filter replacement.',
        alt: 'Illustration comparing a dusty air filter with a clean pleated replacement.',
      },
    ],
  },
  trust: {
    eyebrow: '05 / WHY DRIVERS COME BACK',
    title: 'No surprises.\nJust honest work.',
    // Example promises: edit each one so it matches what the garage really offers.
    items: [
      [
        'No work done without your approval',
        'We call you with the price first. Nothing extra is done unless you say yes.',
      ],
      ['We show you the old parts', 'Ask to see what we replaced and why it needed doing.'],
      [
        'Courtesy car / collection & delivery available',
        'Ask when you book and we will keep you on the road.',
      ],
      ['All makes and models', 'Petrol, diesel, hybrid and electric cars and small vans.'],
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
  },
  reviews: {
    title: 'A place for your reputation.',
    intro: 'Real feedback from the people who know your garage.',
    placeholder: 'Your Google reviews appear here',
  },
  quote: {
    eyebrow: '06 / FREE QUOTE',
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
    eyebrow: '07 / FIND US',
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
    // The garage's full address. The map and directions use it, plus ?area= when given.
    address: '',
    location: 'Your address here',
    mapNote: 'Your map and address appear here.',
    showMap: 'Show map',
    mapPrivacy: 'Loads Google Maps only when you choose to.',
    phone: 'Your number here',
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
