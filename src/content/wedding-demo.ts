// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#3e4f43', // main colour: header, buttons, headings, suit, stems, icing details
  accent: '#e8b4a8', // highlight colour: main call-to-action, stars, blush flowers, small details
};

// Supplier presets. The ?type text is matched, ignoring case, against each
// `match` pattern in order; anything else uses the photographer copy, with the
// type text shown as given. Every price, date, review and FAQ answer is an
// example. No venues, awards, magazines, wedding counts or real couples.
export const supplierTypes = ['photographer', 'florist', 'cakes'] as const;
export type SupplierType = (typeof supplierTypes)[number];

export const presets = {
  photographer: {
    match: 'photo',
    label: 'Wedding photography',
    hero: {
      tagline: 'Relaxed, natural wedding photography — the day as it really felt.',
      lead: 'From getting ready to the last dance, photographed calmly and quietly, so you can enjoy every moment.',
    },
    scene: {
      eyebrow: 'FROM BLANK FRAME TO PHOTOGRAPH',
      title: 'Every frame,',
      em: 'developing.',
      intro: 'Scroll to develop three moments from an illustrated wedding day.',
      steps: [
        ['Getting ready', 'Quiet details and nervous laughs before anyone else arrives.'],
        ['The ceremony', 'The walk, the vows and the faces of everyone watching.'],
        ['First dance', 'The lights go down and the dance floor fills.'],
      ],
    },
    gallery: [
      { kind: 'getting-ready', label: 'Getting ready' },
      { kind: 'rings', label: 'The rings' },
      { kind: 'confetti', label: 'Confetti exit' },
      { kind: 'golden-hour', label: 'Golden hour portraits' },
      { kind: 'details', label: 'Stationery & details' },
      { kind: 'first-dance', label: 'First dance' },
    ],
    packagesTitle: ['Coverage', 'packages.'],
    packages: [
      {
        id: 'elopement',
        name: 'Elopement & small weddings',
        price: '£650',
        detail: 'Up to 3 hours',
        items: ['Ceremony and portraits', 'Online gallery to share', 'Ideal for up to 30 guests'],
      },
      {
        id: 'half-day',
        name: 'Half day',
        price: '£1,150',
        detail: 'Up to 6 hours',
        items: ['Ceremony to the speeches', 'Short planning call', 'Online gallery to share'],
      },
      {
        id: 'full-day',
        name: 'Full day',
        price: '£1,700',
        detail: 'Up to 10 hours',
        items: [
          'Getting ready to first dance',
          'Planning call and timeline',
          'Album add-on available',
        ],
        popular: true,
      },
    ],
    packageNote: 'Example packages and prices · Your own coverage, add-ons and travel go here.',
    process: [
      ['Say hello', 'Send your date and venue. You hear back with availability and a brochure.'],
      ['Meet for a coffee', 'A relaxed call or coffee to talk through your plans and timings.'],
      ['Plan the day', 'A deposit secures your date, then a simple timeline and shot list.'],
      [
        'The day & your gallery',
        'Photographed quietly on the day, with an online gallery afterwards.',
      ],
    ],
    faqs: [
      [
        'Do you travel for weddings?',
        'Example answer: yes — weddings across your area are included, and travel further afield is quoted per mile. Your own travel policy goes here.',
      ],
      [
        'How much is the deposit?',
        'Example answer: a deposit of 25% secures your date, and the balance is due a month before the wedding.',
      ],
      [
        'Are you available on our date?',
        'Use “Check your date” to see how couples would check availability. Your real calendar goes here.',
      ],
      [
        'When will we get our photos?',
        'Example answer: a few previews within the week, and your full online gallery within 6–8 weeks.',
      ],
      [
        'Can we add a second photographer?',
        'Example answer: yes, as an add-on for larger weddings or two getting-ready locations.',
      ],
    ],
    reviews: [
      {
        initials: 'ES',
        name: 'Ellie & Sam',
        date: '2 months ago',
        text: 'We hardly noticed the camera on the day, then cried at the gallery. The getting-ready photos are our favourites.',
      },
      {
        initials: 'PT',
        name: 'Priya & Tom',
        date: '5 months ago',
        text: 'So calm and organised. The timeline call made the whole day feel easy, and the dance floor shots are brilliant.',
      },
      {
        initials: 'MC',
        name: 'Mhairi & Callum',
        date: '8 months ago',
        text: 'Kind, funny and great with our families. We got our previews within the week, just as promised.',
      },
    ],
    tools:
      'Already use Pixieset or ShootProof for galleries, or HoneyBook for bookings? We’ll link them.',
    demo: {
      packageLabel: 'Coverage',
      finalTitle: 'That date looks free to photograph.',
      cardEyebrow: 'DATE CHECKED · EXAMPLE',
    },
    fairs: 'Come and see printed albums and sample galleries, and ask anything about your day.',
  },
  florist: {
    match: 'florist|flower|floral',
    label: 'Wedding flowers',
    hero: {
      tagline: 'Wedding flowers, gathered for you — in season and full of colour.',
      lead: 'Bouquets, buttonholes and venue flowers designed around your colours, your venue and what’s growing that month.',
    },
    scene: {
      eyebrow: 'HOW A BOUQUET COMES TOGETHER',
      title: 'A bouquet,',
      em: 'stem by stem.',
      intro: 'Scroll to build an illustrated bridal bouquet.',
      steps: [
        ['Choose colours', 'Start with a palette: blush, ivory and soft greens, or your own.'],
        ['Pick blooms', 'Seasonal flowers and foliage are added one stem at a time.'],
        ['Tie the ribbon', 'The stems are bound and finished with a silk ribbon.'],
      ],
    },
    gallery: [
      { kind: 'bridal-bouquet', label: 'Bridal bouquet' },
      { kind: 'buttonholes', label: 'Buttonholes' },
      { kind: 'centrepiece', label: 'Table centrepiece' },
      { kind: 'flower-arch', label: 'Ceremony arch' },
      { kind: 'crown', label: 'Flower crown' },
      { kind: 'aisle', label: 'Aisle meadow' },
    ],
    packagesTitle: ['Flower', 'packages.'],
    packages: [
      {
        id: 'bridal-party',
        name: 'Bridal party',
        price: '£350',
        detail: 'Bouquets & buttonholes',
        items: ['Bridal bouquet', 'Two bridesmaid bouquets', 'Four buttonholes'],
      },
      {
        id: 'ceremony-reception',
        name: 'Ceremony & reception',
        price: '£950',
        detail: 'Personal & venue flowers',
        items: ['Bridal party flowers', 'Two ceremony arrangements', 'Table centrepieces'],
        popular: true,
      },
      {
        id: 'full-styling',
        name: 'Full venue styling',
        price: '£2,200',
        detail: 'Designed around your venue',
        items: ['Everything above', 'Arch or installation', 'Set-up and collection'],
      },
    ],
    packageNote: 'Example packages and prices · Your own flower menu and minimum spend go here.',
    process: [
      ['Enquire', 'Send your date and venue. You hear back with availability and a price guide.'],
      ['Consultation', 'Talk through colours, mood and the flowers you love, in person or online.'],
      [
        'Design & recipe',
        'A proposal with the flowers in season that month. A deposit secures your date.',
      ],
      [
        'Delivery & set-up',
        'Flowers made fresh, delivered on the morning and set up at your venue.',
      ],
    ],
    faqs: [
      [
        'Do you deliver to our venue?',
        'Example answer: yes — delivery and set-up across your area, with further travel quoted separately.',
      ],
      [
        'How much is the deposit?',
        'Example answer: a 25% deposit secures your date, with the balance due four weeks before.',
      ],
      [
        'Are you available on our date?',
        'Use “Check your date” to see how couples would check availability. Your real calendar goes here.',
      ],
      [
        'Can we have our favourite flowers?',
        'Flowers are seasonal, so some may not be at their best in your month. Your florist will suggest similar blooms that are.',
      ],
      [
        'Can you reuse ceremony flowers at the reception?',
        'Example answer: often, yes — arrangements can be moved between the ceremony and reception.',
      ],
    ],
    reviews: [
      {
        initials: 'HJ',
        name: 'Hannah & Jack',
        date: '1 month ago',
        text: 'The bouquet was exactly the colours we talked about, and so much better in real life. Guests kept asking about the tables.',
      },
      {
        initials: 'AR',
        name: 'Amara & Ross',
        date: '4 months ago',
        text: 'We didn’t know much about flowers. They suggested what would be in season and it all looked beautiful together.',
      },
      {
        initials: 'KL',
        name: 'Kirsty & Lewis',
        date: '7 months ago',
        text: 'Everything arrived on time and was set up before we got there. The arch made our ceremony photos.',
      },
    ],
    tools:
      'Already use HoneyBook or Dubsado for proposals and invoices? We’ll link your enquiry form.',
    demo: {
      packageLabel: 'Flowers',
      finalTitle: 'That date looks free for flowers.',
      cardEyebrow: 'DATE CHECKED · EXAMPLE',
    },
    fairs: 'Come and see sample bouquets and buttonholes, and bring your colour ideas.',
  },
  cakes: {
    match: 'cake|bakery|baker',
    label: 'Wedding cakes',
    hero: {
      tagline: 'Wedding cakes, baked and stacked for your day.',
      lead: 'Handmade celebration cakes and dessert tables, designed with you and delivered and set up at your venue.',
    },
    scene: {
      eyebrow: 'HOW YOUR CAKE COMES TOGETHER',
      title: 'Built',
      em: 'tier by tier.',
      intro: 'Scroll to stack an illustrated three-tier cake.',
      steps: [
        ['The base tier', 'The largest tier goes down first, finished with piped icing.'],
        ['The middle tier', 'Stacked and piped, in a flavour of your choice.'],
        ['Top tier & topper', 'The top tier is piped, then the topper goes on.'],
      ],
    },
    gallery: [
      { kind: 'semi-naked', label: 'Semi-naked cake' },
      { kind: 'pressed-flower', label: 'Pressed-flower tiers' },
      { kind: 'dessert-table', label: 'Dessert table' },
      { kind: 'cupcakes', label: 'Cupcake tower' },
      { kind: 'topper', label: 'Cake topper' },
      { kind: 'tasting-box', label: 'Tasting box' },
    ],
    packagesTitle: ['Cake', 'packages.'],
    packages: [
      {
        id: 'two-tier',
        name: 'Two-tier cake',
        price: '£320',
        detail: 'Serves about 50',
        items: ['Two flavours of your choice', 'Buttercream or semi-naked', 'Fresh flower finish'],
      },
      {
        id: 'three-tier',
        name: 'Three-tier cake',
        price: '£480',
        detail: 'Serves about 90',
        items: ['Three flavours', 'Design consultation', 'Delivery and set-up'],
        popular: true,
      },
      {
        id: 'dessert-table',
        name: 'Cake & dessert table',
        price: '£650',
        detail: 'Serves about 120',
        items: ['Two-tier cake', 'Cupcakes and treats', 'Table styling and set-up'],
      },
    ],
    packageNote: 'Example packages and prices · Your own flavours, sizes and delivery go here.',
    process: [
      ['Enquire', 'Send your date, venue and guest numbers. You hear back with availability.'],
      ['Tasting', 'Try a box of sample flavours at home, or book a tasting in person.'],
      [
        'Design',
        'A sketch with your flavours, colours and any dietary needs. A deposit secures your date.',
      ],
      ['Delivery & set-up', 'Your cake is delivered on the day and set up at your venue.'],
    ],
    faqs: [
      [
        'Do you deliver to our venue?',
        'Example answer: yes — delivery and set-up are included across your area, with further travel quoted separately.',
      ],
      [
        'How much is the deposit?',
        'Example answer: a 25% deposit secures your date, with the balance due two weeks before.',
      ],
      [
        'Are you available on our date?',
        'Use “Check your date” to see how couples would check availability. Your real calendar goes here.',
      ],
      [
        'Can you cater for dietary needs?',
        'Ask about allergens and dietary requirements — your baker will confirm what they can make, and how.',
      ],
      [
        'Can we taste the flavours first?',
        'Example answer: yes — tasting boxes are available to order before you book.',
      ],
    ],
    reviews: [
      {
        initials: 'SD',
        name: 'Sophie & Dan',
        date: '3 weeks ago',
        text: 'The tasting box made choosing so much fun. The cake looked exactly like the sketch and every slice went.',
      },
      {
        initials: 'RA',
        name: 'Rachel & Aaron',
        date: '3 months ago',
        text: 'They talked us through our dietary needs carefully and the dessert table was the talk of the evening.',
      },
      {
        initials: 'LJ',
        name: 'Laura & Jamie',
        date: '6 months ago',
        text: 'Delivered and set up before the ceremony, with fresh flowers that matched our bouquets. Delicious too.',
      },
    ],
    tools: 'Already take orders through HoneyBook or a Google Form? We’ll link it to your website.',
    demo: {
      packageLabel: 'Cake',
      finalTitle: 'That date looks free for baking.',
      cardEyebrow: 'DATE CHECKED · EXAMPLE',
    },
    fairs: 'Come and taste sample flavours, see display cakes and talk through your design.',
  },
} as const;

export const allergenLine =
  'Ask about allergens and dietary requirements — your baker will confirm.';

export const weddingDemo = {
  id: 'wedding-09',
  route: '/templates/website/motion/wedding-09/',
  name: 'Hazel & Wren',
  monogram: 'HW',
  area: 'Perthshire',
  defaultType: 'photographer' as SupplierType,
  titleSuffix: ' — Website demo by FinTaxTech',
  label: 'Save the Date · wedding-09 · website demo',
  badge: 'Now booking 2027 weddings · example',
  hero: {
    action: 'Check your date',
    note: 'A fictional business. Example packages, prices and dates.',
  },
  hours: [
    ['Monday – Thursday', '10:00 – 18:00 (consultations)'],
    ['Friday', '10:00 – 15:00'],
    ['Saturday', 'Wedding days · by appointment'],
    ['Sunday', 'Closed'],
  ],
  fairs: {
    eyebrow: 'MEET US · PLACEHOLDER',
    title: 'Wedding fairs & open days',
    next: 'Your next wedding fair here — date, venue and stand number.',
  },
  flow: {
    // Sample calendar: May–September 2027. A few dates show “example: booked”.
    months: ['2027-05', '2027-06', '2027-07', '2027-08', '2027-09'],
    startMonth: '2027-06',
    selected: '2027-06-12',
    booked: [
      '2027-05-22',
      '2027-05-29',
      '2027-06-05',
      '2027-06-19',
      '2027-06-26',
      '2027-07-03',
      '2027-07-10',
      '2027-07-24',
      '2027-08-07',
      '2027-08-14',
      '2027-08-28',
      '2027-09-04',
      '2027-09-18',
    ],
    events: ['Wedding', 'Elopement', 'Civil ceremony', 'Vow renewal'],
    guests: ['Up to 30 guests', '30–60 guests', '60–100 guests', '100–150 guests', '150+ guests'],
    defaultGuests: '60–100 guests',
  },
  nameDialog: {
    title: 'See it with your business name.',
    description:
      'Type your business name, for example Rose & Thistle Flowers. It stays in this page and its shareable link.',
  },
  contactNotes: {
    call: 'On your finished website, Call would ring you directly. Add your number to the preview link to try it.',
    message:
      'On your finished website, WhatsApp would open a chat with you. Add your number to the preview link to try it.',
    directions:
      'Your finished website could link to directions to your studio. This is a local map placeholder, with no map service loaded.',
    instagram:
      'On your finished website, this would open your Instagram profile. This demo links nowhere.',
    pinterest:
      'On your finished website, this would open your Pinterest boards. This demo links nowhere.',
    fairs:
      'On your finished website, couples could see your next wedding fair or open day here, and add it to their calendar.',
  },
} as const;
