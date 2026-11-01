// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#171916', // main colour: header, buttons, headings, icons (and 3D sleeve/label)
  accent: '#c4a46d', // highlight colour: main call-to-action, stars, small details
};

// Copy for this standalone template only; no shared-site questionnaire or pricing rules.
export const barberDemo = {
  visitNotice:
    'Campaign links count page loads by reference code and day. No cookies or personalisation details are sent by this counter. Repeat visits may be counted.',
  defaultName: 'The Brass Standard',
  nameHint: 'Up to 100 characters. Your business name becomes part of this page’s shareable link.',
  // Illustrative services, durations and prices. The page and the sample booking list render from here.
  services: [
    {
      name: 'The Signature Cut',
      description: 'Consultation, precision cut & finish',
      duration: '40 min',
      price: '£30',
    },
    {
      name: 'The Skin Fade',
      description: 'Seamless blend. A considered finish.',
      duration: '45 min',
      price: '£35',
    },
    {
      name: 'The Beard Ritual',
      description: 'Sculpt, shape & hot towel',
      duration: '30 min',
      price: '£25',
    },
    {
      name: 'The Full Treatment',
      description: 'Signature cut, beard & hot towel',
      duration: '70 min',
      price: '£55',
    },
  ],
  hours: [
    ['Monday – Friday', '09:00 – 19:00'],
    ['Saturday', '09:00 – 18:00'],
    ['Sunday', 'Closed'],
  ],
  ritual: [
    ['01 / CONSULT', 'A moment to understand your style.'],
    ['02 / CRAFT', 'Precision, patience and a personal touch.'],
    ['03 / FINISH', 'The details that make it yours.'],
  ],
  galleryEyebrow: 'THE LOOKBOOK',
  illustrationLabel: 'Illustrated example',
  closeLabel: 'Close',
  galleryTitle: 'A style for every chair.',
  galleryNote:
    'Your Instagram work goes here. Illustrated examples, not photographs of customer cuts.',
  cuts: [
    'Skin fade',
    'Textured crop',
    'Classic side part',
    'Beard shape-up',
    'Close crop',
    'Cut & beard',
  ],
  reviewTitle: 'The word around the chair.',
  reviewNote: 'A place for feedback from your customers.',
  reviewPlaceholder: 'Your Google reviews appear here',
  heroSeparator: ' · ',
  bookingOfferBefore: 'Want this for ',
  bookingOfferAfter: '? Talk to FinTaxTech',
  contactRoute: '/contact/',
  // The final offer opens the template brief with the current name, area, phone and ref.
  briefRoute: '/client/website-brief/templates/barber-01/',
  contactAlternative: 'Or ask FinTaxTech a question first',
  locationNote: 'Your location, your opening hours. Example hours shown.',
  call: 'Call',
  whatsapp: 'WhatsApp',
  directions: 'Directions',
  book: 'Book',
  contactLabel: 'Contact the barbershop',
  mobileLabel: 'Quick contact and sample booking',
  addressPlaceholder: 'Your address here',
  phonePlaceholder: 'Your number here',
  mapNote: 'Your map and address appear here.',
  integration: "Already use Fresha, Booksy or another booking app? We'll connect it.",
  slotsTitle: 'Choose a sample slot',
  sampleDays: ['Monday', 'Tuesday', 'Wednesday'],
  sampleTimes: ['09:00', '11:30', '14:00', '16:30'],
  day: 'Sample day',
  time: 'Sample time',
  slotNote: 'Illustrative slots only. These are not live dates or availability.',
  continueBooking: 'Preview confirmation',
  back: 'Back',
  restart: 'Try another booking',
  confirmationTitle: 'Your booking preview',
  confirmation: 'This is where your customers would book. Demo only, nothing is sent.',
  client: {
    titleSuffix: ' — Barber website demo by FinTaxTech',
    tryName: 'Try your business name ',
    changeName: 'Change business name ',
    invalidName: 'Please enter your business name.',
    updated: 'Website preview updated for ',
    ritualTitle: 'THE COMPLETE RITUAL',
    ritualSummary: 'Consult. Craft. Finish. All at your pace.',
  },
};
