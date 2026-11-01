import type { TemplateBriefSchema } from './index';
import { allergenLine, presets } from '../wedding-demo';
import {
  cycle,
  faqPairs,
  faqRows,
  price,
  rowValues,
  sampleChoice,
  slug,
  stepPairs,
  stepRows,
  stepsChoice,
  whenOwn,
} from './shared';

// wedding-09 (Save the Date). Content mirrors src/content/wedding-demo.ts: the chosen
// supplier type's preset (packages, gallery, process, faqs), plus badge and fairs.
const types = { Photographer: 'photographer', Florist: 'florist', 'Cake maker': 'cakes' } as const;
const fairOptions = { yes: 'Yes, add our wedding fairs', no: 'No — leave this out' };

export const wedding09: TemplateBriefSchema = {
  id: 'wedding-09',
  prefix: 'wedding',
  files: {
    portfolio: 'Portfolio photos (up to 6)',
    portrait: 'Portrait of you or your team',
  },
  sections: [
    {
      title: 'Your weddings and packages',
      fields: [
        {
          id: 'weddingType',
          label: 'What do you do?',
          type: 'single',
          options: Object.keys(types),
          prefill: 'type',
          prefillMatch: Object.fromEntries(
            Object.entries(types).map(([label, key]) => [label, presets[key].match]),
          ),
          help: 'This chooses the template’s wording and illustrations.',
        },
        sampleChoice(
          'weddingBadgeSource',
          'Booking note',
          'Shown at the top, like Now booking 2027 weddings.',
        ),
        {
          id: 'weddingBadge',
          label: 'Your booking note',
          type: 'text',
          maxLength: 40,
          when: whenOwn('weddingBadgeSource'),
        },
        sampleChoice('weddingPackagesSource', 'Packages and prices', '3 or 4 packages.'),
        {
          id: 'weddingPackages',
          label: 'Your packages',
          type: 'rows',
          when: whenOwn('weddingPackagesSource'),
          repeat: {
            title: (n) => `Package ${n}`,
            add: 'Add a package',
            remove: (n) => `Remove package ${n}`,
            min: 3,
            max: 4,
            single: {
              key: 'popular',
              value: 'Yes',
              message: 'Mark only one package as most popular.',
            },
            fields: [
              { key: 'name', label: 'Package name', type: 'text', maxLength: 28 },
              {
                key: 'price',
                label: 'Price from, like £1,150',
                type: 'text',
                maxLength: 12,
                format: price,
              },
              { key: 'detail', label: 'Detail, like Up to 6 hours', type: 'text', maxLength: 28 },
              { key: 'item1', label: 'Included 1', type: 'text', maxLength: 30 },
              {
                key: 'item2',
                label: 'Included 2 (optional)',
                type: 'text',
                maxLength: 30,
                optional: true,
              },
              {
                key: 'item3',
                label: 'Included 3 (optional)',
                type: 'text',
                maxLength: 30,
                optional: true,
              },
              { key: 'popular', label: 'Most popular', type: 'single', options: ['Yes', 'No'] },
            ],
          },
        },
        {
          id: 'weddingAllergens',
          label: 'Allergens',
          type: 'confirm',
          when: { id: 'weddingType', values: ['Cake maker'] },
          confirmText: `Show this on my website: “${allergenLine}” I will confirm allergens and dietary needs with each couple.`,
        },
      ],
    },
    {
      title: 'Your gallery, process and questions',
      fields: [
        sampleChoice(
          'weddingGallerySource',
          'Gallery captions',
          'Six captions. Your portfolio photos are sent separately.',
        ),
        {
          id: 'weddingGallery',
          label: 'Your captions',
          type: 'rows',
          when: whenOwn('weddingGallerySource'),
          repeat: {
            title: (n) => `Caption ${n}`,
            add: 'Add a caption',
            remove: (n) => `Remove caption ${n}`,
            min: 6,
            max: 6,
            fields: [
              {
                key: 'label',
                label: 'Caption, like Golden hour portraits',
                type: 'text',
                maxLength: 26,
              },
            ],
          },
        },
        stepsChoice('weddingProcessSource', 'The four process steps'),
        stepRows('weddingProcess', 'weddingProcessSource', 4, { title: 26, line: 90 }),
        sampleChoice('weddingFaqSource', 'Frequently asked questions', '3 to 6 questions.'),
        faqRows(
          'weddingFaq',
          'weddingFaqSource',
          { min: 3, max: 6 },
          { question: 50, answer: 160 },
        ),
        {
          id: 'weddingFairs',
          label: 'Wedding fairs',
          type: 'single',
          options: Object.values(fairOptions),
        },
        {
          id: 'weddingFairDates',
          label: 'Your wedding fairs',
          type: 'rows',
          when: { id: 'weddingFairs', values: [fairOptions.yes] },
          repeat: {
            title: (n) => `Fair ${n}`,
            add: 'Add a fair',
            remove: (n) => `Remove fair ${n}`,
            max: 4,
            fields: [
              { key: 'event', label: 'Event', type: 'text', maxLength: 40 },
              {
                key: 'date',
                label: 'Date, like Sunday 14 March 2027',
                type: 'text',
                maxLength: 30,
              },
              { key: 'place', label: 'Place', type: 'text', maxLength: 40 },
            ],
          },
        },
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const type = types[answers.weddingType as keyof typeof types];
    const packages = rowValues(answers, rows, 'weddingPackagesSource', 'weddingPackages');
    const gallery = rowValues(answers, rows, 'weddingGallerySource', 'weddingGallery');
    const kinds = presets[type].gallery.map((tile) => tile.kind);
    return {
      defaultType: type,
      badge: answers.weddingBadgeSource === 'I’ll enter my own' ? answers.weddingBadge : null,
      presets: {
        [type]: {
          packages:
            packages?.map(({ name, price, detail, item1, item2, item3, popular }) => ({
              id: slug(name),
              name,
              price,
              detail,
              items: [item1, item2, item3].filter(Boolean),
              ...(popular === 'Yes' ? { popular: true } : {}),
            })) ?? null,
          gallery:
            gallery?.map((row, index) => ({ kind: cycle(kinds, index), label: row.label })) ?? null,
          process: stepPairs(answers, rows, 'weddingProcessSource', 'weddingProcess'),
          faqs: faqPairs(answers, rows, 'weddingFaqSource', 'weddingFaq'),
        },
      },
      // Dated fairs; the template's own fairs copy stays as the section heading.
      fairDates:
        answers.weddingFairs === fairOptions.yes
          ? (rows.weddingFairDates ?? []).map(({ values }) => ({ ...values }))
          : [],
      allergenLine: type === 'cakes' && answers.weddingAllergens === true ? allergenLine : null,
    };
  },
};
