import { emptyBrief } from '../../src/lib/client-brief/rules';
import {
  colourOptions,
  filesFieldId,
  logoOptions,
  ownWords,
  qualificationOptions,
  reviewOptions,
  templateName,
  useSample,
} from '../../src/content/template-brief';
import { templateBriefSchemas } from '../../src/content/template-briefs';
import { keepSteps, writeSteps } from '../../src/content/template-briefs/shared';
import type { BriefAnswers } from '../../src/lib/client-brief/types';

// Made-up details for every template brief, used by unit and browser tests.
// Some values are typed loosely on purpose (dd2 4dx, 1 h 30, £ 15) to exercise tidying.
type Rows = Record<string, Record<string, string>[]>;
export const weeklyHours = [
  { status: 'Open', opens: '09:00', closes: '18:00' },
  { status: 'Open', opens: '09:00', closes: '18:00' },
  { status: 'Open', opens: '09:00', closes: '18:00' },
  { status: 'Open', opens: '09:00', closes: '20:00', note: 'Late night Thursday' },
  { status: 'Open', opens: '09:00', closes: '18:00' },
  { status: 'Open', opens: '09:00', closes: '16:00' },
  { status: 'Closed' },
];
export const groupedHours = [
  ['Monday – Wednesday', '09:00 – 18:00'],
  ['Thursday', '09:00 – 20:00 (Late night Thursday)'],
  ['Friday', '09:00 – 18:00'],
  ['Saturday', '09:00 – 16:00'],
  ['Sunday', 'Closed'],
];
export const barberServices = [
  {
    name: 'Skin fade',
    description: 'Clipper fade blended to the skin',
    duration: '40',
    price: '£18',
  },
  {
    name: 'Scissor cut',
    description: 'Cut and finish by hand',
    duration: '45 mins',
    price: '£ 20',
  },
  {
    name: 'Beard trim',
    description: 'Shape-up with a hot towel',
    duration: '20 min',
    price: '£12',
  },
  {
    name: 'Cut & beard',
    description: 'Any cut with a beard trim',
    duration: '1 h 10',
    price: 'from £28',
  },
];
export const barberReview = {
  name: 'Sam T.',
  text: 'Best fade I’ve had in years — Jay takes his time & it shows.',
  stars: '5',
  source: 'Google',
};

const fixtures: Record<
  string,
  { name: string; answers: BriefAnswers; rows: Rows; files: string[] }
> = {
  'barber-01': {
    name: "Jay's Cuts & Co",
    answers: {
      barberServicesSource: ownWords,
      barberBooking: 'Online booking link',
      bookingLink: 'https://booking.example/jays-cuts',
      barberRitualSource: keepSteps,
      barberLookbookSource: ownWords,
      hasReviews: reviewOptions.yes,
      reviewPermission: true,
      colours: colourOptions.own,
      brandColour: '#1F3A5F',
      accentColour: '#D9A441',
    },
    rows: {
      barberServices: barberServices,
      barberLookbook: [{ label: 'Skin fade' }, { label: 'Crop' }],
      reviews: [barberReview],
    },
    files: ['Logo', 'Gallery / work photos (up to 6)'],
  },
  'tailoring-02': {
    name: 'Needle & Thread Alterations',
    answers: {
      tailoringServicesSource: ownWords,
      tailoringAppointments: 'Both — appointments and walk-ins',
      tailoringProcessSource: keepSteps,
      tailoringWorkSource: ownWords,
    },
    rows: {
      tailoringServices: [
        {
          name: 'Trouser hems',
          description: 'Taken up or let down, keeping the original hem where possible',
          price: 'from £ 15',
          turnaround: '3–5 days',
        },
        {
          name: 'Dress alterations',
          description: 'Taken in or let out at the seams',
          price: 'By consultation',
        },
        { name: 'Zip replacement', description: 'Jackets, trousers and skirts', price: '£22' },
      ],
      tailoringWork: [
        { title: 'The wedding suit', caption: 'Sleeves shortened by two centimetres' },
        { title: 'The summer dress', caption: 'Taken in at the waist' },
        { title: 'The winter coat', caption: 'A new lining and buttons' },
      ],
    },
    files: ['Before-and-after photos (up to 3 pairs)'],
  },
  'automotive-03': {
    name: 'Tay Motor Works',
    answers: {
      automotiveServicesSource: ownWords,
      automotiveMot: 'Yes — we are a DVSA-approved MOT testing station',
      automotiveMakes: 'Ford  and Vauxhall specialists',
      automotiveExtras: ['Courtesy car'],
      automotiveProcessSource: keepSteps,
      automotiveWorkSource: useSample,
    },
    rows: {
      automotiveServices: [
        {
          name: 'MOT',
          description: 'Annual MOT test while you wait',
          label: 'test',
          price: 'From £45',
          picture: 'Servicing',
        },
        {
          name: 'Brakes',
          description: 'Pads, discs and brake fluid checked',
          label: 'Assess',
          price: 'Quote on request',
          picture: 'Brakes',
        },
        {
          name: 'Tyres',
          description: 'Budget and premium tyres fitted',
          label: 'Replace',
          price: '£ 60',
          picture: 'Tyres',
        },
        {
          name: 'Diagnostics',
          description: 'Warning lights read and explained',
          label: 'Understand',
          price: 'From £40',
          picture: 'Diagnostics',
        },
      ],
    },
    files: ['Workshop photos (up to 3 before-and-after pairs)', 'Team photos'],
  },
  'cleaning-04': {
    name: 'Sparkle & Shine Dundee',
    answers: {
      cleaningServicesSource: ownWords,
      cleaningProducts: 'Either — customers choose',
      cleaningProcessSource: writeSteps,
      cleaningWorkSource: useSample,
      cleaningFaqSource: ownWords,
    },
    rows: {
      cleaningServices: [
        {
          name: 'Weekly clean',
          type: 'Regular cleaning',
          description: 'Kitchen, bathrooms, dusting and floors',
          price: '£18 per hour',
          detail: '2-hour minimum',
        },
        {
          name: 'Deep clean',
          type: 'One-off',
          description: 'Skirting boards, cupboards and corners',
          price: 'From £120',
          detail: 'Scope agreed first',
        },
        {
          name: 'Office clean',
          type: 'Small office',
          description: 'Desks, kitchens and washrooms',
          price: 'by quotation',
          detail: 'After a walkthrough',
        },
      ],
      cleaningProcess: [
        { title: 'Tell us about your home', line: 'Rooms, pets and how often you need us.' },
        { title: 'Agree a checklist', line: 'We confirm the price before the first visit.' },
        { title: 'Enjoy the time back', line: 'Same cleaner each week where we can.' },
      ],
      cleaningFaq: [
        { question: 'Do I need to be home?', answer: 'No. Many customers leave a key.' },
        { question: 'Do you bring products?', answer: 'Yes, or we can use yours.' },
        { question: 'Can I skip a week?', answer: 'Yes, with 48 hours’ notice.' },
      ],
    },
    files: ['Photos of your work (up to 3)'],
  },
  'juice-bar-05': {
    name: 'Squeeze & Co',
    answers: {
      juiceMenuSource: ownWords,
      juiceOrdering: 'Both',
      juiceAllergens: true,
      juiceStagesSource: keepSteps,
      juiceLoyaltySource: 'I’ll enter my own offer',
      juiceLoyalty: 'Every 8th coffee is on us.',
    },
    rows: {
      juiceMenu: [
        {
          category: 'Smoothies',
          name: 'Berry start',
          ingredients: 'Strawberry, banana & oat drink',
          price: '£5',
          tone: 'Berry',
        },
        {
          category: 'Juices',
          name: 'Sunrise',
          ingredients: 'Orange, carrot & ginger',
          price: '£4.50',
          tone: 'Orange',
        },
        {
          category: 'Coffee',
          name: 'Flat white',
          ingredients: 'Double espresso & milk',
          price: '£3.20',
          tone: 'Coffee',
        },
        {
          category: 'Light bites',
          name: 'Avocado toast',
          ingredients: 'Sourdough, avocado & chilli',
          price: '£ 6',
          tone: 'Green',
        },
      ],
    },
    files: ['Menu or product photos (up to 8)'],
  },
  'gym-06': {
    name: 'Iron & Oak Fitness',
    answers: {
      gymServicesSource: ownWords,
      gymMembershipsSource: ownWords,
      gymFirstVisit: 'A paid day pass',
      gymDayPass: '£ 8',
      gymTimetableSource: 'I’ll add my classes',
      gymFacilities: ['Free weights & racks', 'Cardio zone', 'Other'],
      gymFacilitiesOther: 'Sauna',
      gymProcessSource: keepSteps,
      gymFaqSource: useSample,
    },
    rows: {
      gymServices: [
        {
          name: 'Gym floor',
          type: 'Train your way',
          description: 'Racks, free weights and cardio',
          price: 'From £25 per month',
          detail: 'Off-peak option',
        },
        {
          name: 'Classes',
          type: 'Train together',
          description: 'Spin, circuits and kettlebells',
          price: '£6 per class',
          detail: 'Included with Anytime',
        },
        {
          name: 'Induction',
          type: 'Start here',
          description: 'A coach shows you the kit',
          price: 'free',
          detail: 'With any membership',
        },
      ],
      gymMemberships: [
        {
          name: 'Anytime',
          price: '£35',
          period: '/ month',
          note: 'All opening hours',
          perk1: 'Gym floor',
          perk2: 'All classes',
          popular: 'Yes',
        },
        {
          name: 'Day pass',
          price: '£8',
          period: '/ visit',
          note: 'Try it out',
          perk1: 'Gym floor',
          popular: 'No',
        },
      ],
      gymTimetable: [
        { day: 'Tuesday', time: '18:30', name: 'Spin', length: '45' },
        { day: 'Monday', time: '19:00', name: 'Kettlebells', length: '1 h' },
        { day: 'Monday', time: '07:00', name: 'Circuits', length: '45 mins' },
      ],
    },
    files: ['Gym floor and studio photos (up to 3)', 'Coach or team photos'],
  },
  'consultant-07': {
    name: 'Rowan Hart Bookkeeping',
    answers: {
      consultantRole: 'Bookkeeper',
      consultantServicesSource: ownWords,
      consultantClientsSource: ownWords,
      consultantCasesChoice: 'Yes — real ones, with my clients’ permission',
      consultantCasesPermission: true,
      consultantAboutSource: ownWords,
      consultantAbout:
        'I help small firms keep their books tidy.\n\nMost clients stay for years because the monthly routine just works.',
      consultantCallLength: '30 minutes',
      consultantCallDays: ['Tuesday', 'Thursday'],
      consultantTopicsSource: useSample,
    },
    rows: {
      consultantServices: [
        {
          name: 'Monthly bookkeeping',
          type: 'Ongoing',
          description: 'Your books kept up to date each month',
          price: 'From £150 per month',
          note: 'Rolling monthly',
        },
        {
          name: 'Year-end tidy-up',
          type: 'One-off',
          description: 'Records ready for your accountant',
          price: 'From £400',
          note: 'Scope agreed first',
        },
        {
          name: 'Software set-up',
          type: 'Project',
          description: 'Xero or QuickBooks set up properly',
          price: 'by quotation',
          note: 'Online or in person',
        },
      ],
      consultantClients: [{ label: 'Trades & local services' }, { label: 'Family businesses' }],
      consultantCases: [
        {
          sector: 'Local café',
          title: 'From shoebox to monthly routine',
          problem: 'Receipts piled up for months.',
          outcome: 'A routine the owner follows in an hour.',
        },
      ],
    },
    files: ['Portrait photo (for About me)'],
  },
  'beauty-08': {
    name: 'Polished & Pretty',
    answers: {
      beautyTreatmentsSource: ownWords,
      beautyTechniciansSource: 'I’ll add my technicians',
      beautyPolicySource: ownWords,
      beautyPolicy:
        'A £10 deposit secures your appointment. Please give 24 hours’ notice to cancel.',
      beautyPatchTest: true,
      beautyVouchers: 'Yes, we sell gift vouchers',
      beautyVoucherFrom: '£ 20',
      beautyAftercareSource: useSample,
    },
    rows: {
      beautyTreatments: [
        {
          group: 'Nails',
          name: 'Gel manicure',
          description: 'Shaped and finished in gel',
          duration: '45',
          price: '£28',
        },
        {
          group: 'Nails',
          name: 'Nail art',
          description: 'Dots, French tips or chrome',
          duration: '+15',
          price: 'From £5',
        },
        {
          group: 'Lashes',
          name: 'Classic lashes',
          description: 'One extension per natural lash',
          duration: '1 h 30',
          price: '£45',
        },
        {
          group: 'Lashes',
          name: 'Lash lift',
          description: 'Your own lashes lifted and tinted',
          duration: '60',
          price: '£40',
        },
        {
          group: 'Brows',
          name: 'Brow shape',
          description: 'Waxed and tidied',
          duration: '20',
          price: '£14',
        },
        {
          group: 'Extras',
          name: 'Bridal trial',
          description: 'Nails and lashes before the day',
          duration: '2 h',
          price: 'POA',
        },
      ],
      beautyTechnicians: [{ name: 'Amira', specialism: 'Lashes' }, { name: 'Jess' }],
    },
    files: ['Treatment photos — nails, lashes, brows (up to 6)', 'Salon photos'],
  },
  'wedding-09': {
    name: 'Bloom & Bough Flowers',
    answers: {
      weddingType: 'Florist',
      weddingBadgeSource: ownWords,
      weddingBadge: 'Now booking 2027 weddings',
      weddingPackagesSource: ownWords,
      weddingGallerySource: ownWords,
      weddingProcessSource: keepSteps,
      weddingFaqSource: useSample,
      weddingFairs: 'Yes, add our wedding fairs',
    },
    rows: {
      weddingPackages: [
        {
          name: 'Bridal bouquet',
          price: '£ 180',
          detail: 'Seasonal flowers',
          item1: 'Consultation',
          item2: 'Delivery',
          popular: 'No',
        },
        {
          name: 'Ceremony flowers',
          price: '£650',
          detail: 'Bouquets and buttonholes',
          item1: 'Two bouquets',
          item2: 'Six buttonholes',
          item3: 'Arch flowers',
          popular: 'Yes',
        },
        {
          name: 'The whole day',
          price: '£1,400',
          detail: 'Ceremony to reception',
          item1: 'Everything above',
          item2: 'Table flowers',
          popular: 'No',
        },
      ],
      weddingGallery: [
        { label: 'Bridal bouquets' },
        { label: 'Buttonholes' },
        { label: 'Ceremony arch' },
        { label: 'Table centres' },
        { label: 'Flower crowns' },
        { label: 'Cake flowers' },
      ],
      weddingFairDates: [
        { event: 'Perth Wedding Fair', date: 'Sunday 14 March 2027', place: 'Perth Concert Hall' },
      ],
    },
    files: ['Portfolio photos (up to 6)'],
  },
};
export const templateIds = Object.keys(fixtures);

const rows = (values: Record<string, string>[]) =>
  values.map((row, index) => ({ id: `row-${index}`, values: { ...row } }));

// A complete, valid brief for one template: shared answers plus that template's own.
export function completeTemplateBrief(id = 'barber-01') {
  const fixture = fixtures[id];
  const slug = fixture.name.toLowerCase().replace(/[^a-z]+/g, '');
  const state = emptyBrief();
  state.answers = {
    templateChoice: templateName(id),
    ref: 'L-TEST',
    businessName: fixture.name,
    businessArea: 'Dundee',
    heroSource: ownWords,
    heroLine: 'Friendly, local and  easy to book.',
    introSource: useSample,
    contactPhone: '01382 000000',
    whatsapp: 'Same as my phone number',
    contactEmail: `hello@${slug}.example`,
    addressChoice: 'Show my address',
    street: '79 Yarrow Terrace',
    town: 'Dundee',
    postcode: 'dd2 4dx',
    hoursSource: ownWords,
    instagram: `https://instagram.com/${slug}.example`,
    googleProfile: 'I need one',
    colours: colourOptions.template,
    logo: logoOptions.monogram,
    hasReviews: reviewOptions.no,
    hasQualifications: qualificationOptions.no,
    [filesFieldId(templateBriefSchemas[id])]: fixture.files,
    approve: true,
    ...fixture.answers,
  };
  state.rows = {
    hours: rows(weeklyHours),
    ...Object.fromEntries(Object.entries(fixture.rows).map(([key, value]) => [key, rows(value)])),
  };
  return state;
}
