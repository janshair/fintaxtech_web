import { emptyBrief } from '../../src/lib/client-brief/rules';
import {
  colourOptions,
  fileOptions,
  logoOptions,
  ownWords,
  qualificationOptions,
  reviewOptions,
  useSample,
} from '../../src/content/template-brief';

// Made-up details for a barber-01 brief, used by unit and browser tests.
export const barberAnswers = {
  businessName: "Jay's Cuts & Co",
  businessArea: 'Kirkcaldy',
  heroLine: 'Sharp fades and proper beard trims on the High Street.',
  intro: 'A two-chair barbershop with walk-in Saturdays and a kettle always on.',
  phone: '01592 000000',
  email: 'hello@jayscuts.example',
  address: '12 High Street\nKirkcaldy KY1 1AA',
  instagram: 'https://instagram.com/jayscuts.example',
  booking: 'https://booking.example/jays-cuts',
  brand: '#1F3A5F',
  accent: '#D9A441',
};
export const barberServices = [
  {
    name: 'Skin fade',
    description: 'Clipper fade blended to the skin',
    duration: '40 min',
    price: '£18',
  },
  { name: 'Scissor cut', description: 'Cut and finish by hand', duration: '45 min', price: '£20' },
  {
    name: 'Beard trim',
    description: 'Shape-up with a hot towel',
    duration: '20 min',
    price: '£12',
  },
  {
    name: 'Cut & beard',
    description: 'Any cut with a beard trim',
    duration: '60 min',
    price: 'From £28',
  },
];
export const barberHours = [
  { days: 'Monday', status: 'Closed' },
  { days: 'Tuesday – Friday', status: 'Open', times: '09:00 – 18:00' },
  { days: 'Saturday', status: 'Open', times: '08:30 – 16:00' },
  { days: 'Sunday', status: 'By appointment' },
];
export const barberReview = {
  name: 'Sam T.',
  text: 'Best fade I’ve had in years — Jay takes his time & it shows.',
  stars: '5',
  source: 'Google',
};

const rows = (values: Record<string, string>[]) =>
  values.map((row, index) => ({ id: `row-${index}`, values: { ...row } }));

export function completeTemplateBrief() {
  const state = emptyBrief();
  state.answers = {
    templateChoice: 'The Brass Standard',
    ref: 'L-TEST',
    businessName: barberAnswers.businessName,
    businessArea: barberAnswers.businessArea,
    heroSource: ownWords,
    heroLine: barberAnswers.heroLine,
    introSource: useSample,
    barberServicesSource: ownWords,
    barberBooking: 'Online booking link',
    barberRitualSource: 'Keep the template’s steps',
    barberLookbookSource: ownWords,
    contactPhone: barberAnswers.phone,
    whatsapp: 'Same as my phone number',
    contactEmail: barberAnswers.email,
    addressChoice: 'Show my address',
    address: barberAnswers.address,
    hoursSource: ownWords,
    instagram: barberAnswers.instagram,
    bookingLink: barberAnswers.booking,
    googleProfile: 'I need one',
    colours: colourOptions.own,
    brandColour: barberAnswers.brand,
    accentColour: barberAnswers.accent,
    logo: logoOptions.monogram,
    hasReviews: reviewOptions.yes,
    reviewPermission: true,
    hasQualifications: qualificationOptions.no,
    files: [fileOptions.logo, fileOptions.gallery],
    approve: true,
  };
  state.rows = {
    barberServices: rows(barberServices),
    barberLookbook: rows([{ label: 'Skin fade' }, { label: 'Crop' }]),
    hours: rows(barberHours),
    reviews: rows([barberReview]),
  };
  return state;
}
