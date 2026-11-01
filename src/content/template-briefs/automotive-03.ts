import type { TemplateBriefSchema } from './index';
import { automotiveDemo } from '../automotive-demo';
import {
  captionRows,
  cycle,
  price,
  rowValues,
  sampleChoice,
  stepPairs,
  stepRows,
  stepsChoice,
  whenOwn,
} from './shared';

// automotive-03 (Vector Motorworks). Content mirrors src/content/automotive-demo.ts:
// services.items, process.steps and work.items. Each service picks one of the
// template's illustrations; MOT wording appears only for an approved test station.
const pictures = Object.fromEntries(
  automotiveDemo.services.items.map((item) => [item.name, item.code]),
) as Record<string, string>;
export const motOptions = {
  yes: 'Yes — we are a DVSA-approved MOT testing station',
  no: 'No',
};

export const automotive03: TemplateBriefSchema = {
  id: 'automotive-03',
  prefix: 'automotive',
  files: {
    workshop: 'Workshop photos (up to 3 before-and-after pairs)',
    team: 'Team photos',
    premises: 'Premises or forecourt photos',
  },
  sections: [
    {
      title: 'Your garage services',
      fields: [
        sampleChoice(
          'automotiveServicesSource',
          'Services',
          'List 4 to 8 services. Work and prices are confirmed with each customer before repairs.',
        ),
        {
          id: 'automotiveServices',
          label: 'Your services',
          type: 'rows',
          when: whenOwn('automotiveServicesSource'),
          repeat: {
            title: (n) => `Service ${n}`,
            add: 'Add a service',
            remove: (n) => `Remove service ${n}`,
            min: 4,
            max: 8,
            fields: [
              { key: 'name', label: 'Service name', type: 'text', maxLength: 24 },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 100 },
              {
                key: 'label',
                label: 'One or two words, like REPAIR',
                type: 'text',
                maxLength: 14,
              },
              {
                key: 'price',
                label: 'Price, like From £45 or Quote on request',
                type: 'text',
                maxLength: 20,
                format: { ...price, words: ['Quote on request'] },
              },
              {
                key: 'picture',
                label: 'Illustration',
                type: 'single',
                options: Object.keys(pictures),
              },
            ],
          },
        },
        {
          id: 'automotiveMot',
          label: 'MOT testing',
          type: 'single',
          options: Object.values(motOptions),
          help: 'Only choose yes if your garage is approved by DVSA. Otherwise MOTs are not mentioned.',
        },
        {
          id: 'automotiveMakes',
          label: 'Makes or specialisms',
          type: 'text',
          optional: true,
          maxLength: 80,
          help: 'Like Ford and Vauxhall specialists, or hybrids and EVs. Only what you actually offer.',
        },
        {
          id: 'automotiveExtras',
          label: 'Do you offer either of these?',
          type: 'multi',
          optional: true,
          options: ['Courtesy car', 'Collection and delivery'],
        },
      ],
    },
    {
      title: 'Your process and workshop examples',
      fields: [
        stepsChoice(
          'automotiveProcessSource',
          'The three process steps',
          'The template shows Tell us what changed, Inspect. Explain. Agree. and Work done. Checked.',
        ),
        stepRows('automotiveProcess', 'automotiveProcessSource', 3, { title: 28, line: 110 }),
        sampleChoice(
          'automotiveWorkSource',
          'Workshop captions',
          'Three before-and-after examples. Your workshop photos are sent separately.',
        ),
        captionRows(
          'automotiveWork',
          'automotiveWorkSource',
          3,
          { title: 'Title, like A fresh surface', caption: 'What was done' },
          { title: 28, caption: 50 },
        ),
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'automotiveServicesSource', 'automotiveServices');
    const work = rowValues(answers, rows, 'automotiveWorkSource', 'automotiveWork');
    const steps = stepPairs(answers, rows, 'automotiveProcessSource', 'automotiveProcess');
    const kinds = automotiveDemo.work.items.map((item) => item.kind);
    const extras = Array.isArray(answers.automotiveExtras) ? answers.automotiveExtras : [];
    return {
      services: services && {
        items: services.map(({ name, description, label, price, picture }) => ({
          code: pictures[picture],
          name,
          description,
          label: label.toUpperCase(),
          price,
        })),
      },
      process: steps && { steps },
      work: work && {
        items: work.map(({ title, caption }, index) => ({
          kind: cycle(kinds, index),
          title,
          caption,
        })),
      },
      mot: answers.automotiveMot === motOptions.yes,
      makes: typeof answers.automotiveMakes === 'string' ? answers.automotiveMakes || null : null,
      courtesyCar: extras.includes('Courtesy car'),
      collection: extras.includes('Collection and delivery'),
    };
  },
};
