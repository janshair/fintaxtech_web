import type { BriefSection } from '../../lib/client-brief/types';
import type { TemplateBriefSchema } from './index';
import {
  duration,
  price,
  rowValues,
  sampleChoice,
  stepPairs,
  stepsChoice,
  whenOwn,
  whenWritten,
} from './shared';

// barber-01 (The Brass Standard). The content object matches the shape of
// src/content/barber-demo.ts: services, ritual and cuts replace those keys.
const bookingOptions = {
  'Online booking link': 'online',
  'Call to book': 'call',
  'Walk-ins welcome': 'walk-in',
} as const;

const sections: BriefSection[] = [
  {
    title: 'Your services and booking',
    fields: [
      sampleChoice(
        'barberServicesSource',
        'Services and prices',
        'List 3 to 6 services as they should appear on your website.',
      ),
      {
        id: 'barberServices',
        label: 'Your services',
        type: 'rows',
        when: whenOwn('barberServicesSource'),
        repeat: {
          title: (n) => `Service ${n}`,
          add: 'Add a service',
          remove: (n) => `Remove service ${n}`,
          min: 3,
          max: 6,
          fields: [
            { key: 'name', label: 'Service name', type: 'text', maxLength: 40 },
            { key: 'description', label: 'Short description', type: 'text', maxLength: 80 },
            {
              key: 'duration',
              label: 'Length in minutes, like 40 or 1 h 30',
              type: 'text',
              maxLength: 20,
              format: duration,
            },
            {
              key: 'price',
              label: 'Price, like £30 or From £30',
              type: 'text',
              maxLength: 20,
              format: price,
            },
          ],
        },
      },
      {
        id: 'barberBooking',
        label: 'How do customers book?',
        type: 'single',
        options: Object.keys(bookingOptions),
        help: 'If you choose an online booking link, add it in the Online section.',
      },
    ],
  },
  {
    title: 'Your ritual and lookbook',
    fields: [
      stepsChoice(
        'barberRitualSource',
        'The three ritual steps',
        'The template shows Consult, Craft and Finish as you scroll.',
      ),
      {
        id: 'barberRitual',
        label: 'Your three steps',
        type: 'rows',
        when: whenWritten('barberRitualSource'),
        repeat: {
          title: (n) => `Step ${n}`,
          add: 'Add a step',
          remove: (n) => `Remove step ${n}`,
          min: 3,
          max: 3,
          fields: [
            { key: 'title', label: 'Step name, like Consult', type: 'text', maxLength: 30 },
            { key: 'line', label: 'One line about this step', type: 'text', maxLength: 60 },
          ],
        },
      },
      sampleChoice(
        'barberLookbookSource',
        'Lookbook style labels',
        'Up to six styles you offer, like Skin fade. Your own photos are sent separately.',
      ),
      {
        id: 'barberLookbook',
        label: 'Your lookbook styles',
        type: 'rows',
        when: whenOwn('barberLookbookSource'),
        help: 'Any of the six places you leave out keep the template’s label.',
        repeat: {
          title: (n) => `Style ${n}`,
          add: 'Add a style',
          remove: (n) => `Remove style ${n}`,
          max: 6,
          fields: [{ key: 'label', label: 'Style name', type: 'text', maxLength: 30 }],
        },
      },
    ],
  },
];

export const barber01: TemplateBriefSchema = {
  id: 'barber-01',
  prefix: 'barber',
  sections,
  files: {
    gallery: 'Gallery / work photos (up to 6)',
    team: 'Team or portrait photos',
    premises: 'Premises photos',
  },
  bookingLinkWhen: { id: 'barberBooking', values: ['Online booking link'] },
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'barberServicesSource', 'barberServices');
    const lookbook = rowValues(answers, rows, 'barberLookbookSource', 'barberLookbook');
    return {
      services:
        services?.map(({ name, description, duration, price }) => ({
          name,
          description,
          duration,
          price,
        })) ?? null,
      ritual:
        stepPairs(answers, rows, 'barberRitualSource', 'barberRitual')?.map(
          ([title, line], index) => [`0${index + 1} / ${title.toUpperCase()}`, line],
        ) ?? null,
      cuts: lookbook
        ? Array.from({ length: 6 }, (_, index) => lookbook[index]?.label || null)
        : null,
      booking: bookingOptions[answers.barberBooking as keyof typeof bookingOptions] ?? null,
    };
  },
};
