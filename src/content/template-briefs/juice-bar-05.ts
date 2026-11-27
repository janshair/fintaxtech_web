import type { TemplateBriefSchema } from './index';
import { juiceBarDemo } from '../juice-bar-demo';
import { optionKey, price, rowValues, sampleChoice, whenOwn } from './shared';

// juice-bar-05 (Tumble Cup, 3D). Content mirrors src/content/juice-bar-demo.ts:
// a menu of drinks with first names, opening hours and the allergen line.
// Each drink picks one of the template's liquid colours for the 3D cup.
const tones = [...new Set(juiceBarDemo.menu.map((item) => item.tone))];
const toneLabel = (tone: string) => tone[0].toUpperCase() + tone.slice(1);
export const juiceAllergens =
  'Ask us about allergens. Full allergen information is kept behind the counter.';
const ordering = {
  collection: 'Order ahead for collection',
  delivery: 'Delivery apps, like Deliveroo or Just Eat',
  both: 'Both',
  neither: 'Neither — walk in and order',
};

export const juiceBar05: TemplateBriefSchema = {
  id: 'juice-bar-05',
  prefix: 'juice',
  files: {
    menu: 'Menu or product photos (up to 8)',
    premises: 'Shop or counter photos',
    team: 'Team photos',
  },
  sections: [
    {
      title: 'Your menu',
      fields: [
        sampleChoice(
          'juiceMenuSource',
          'Menu',
          'List 4 to 8 drinks. Describe what is in each one; please don’t add health or nutrition claims.',
        ),
        {
          id: 'juiceMenu',
          label: 'Your drinks',
          type: 'rows',
          when: whenOwn('juiceMenuSource'),
          repeat: {
            title: (n) => `Drink ${n}`,
            add: 'Add a drink',
            remove: (n) => `Remove drink ${n}`,
            min: 4,
            max: 8,
            fields: [
              { key: 'name', label: 'Drink name, like Mango Marge', type: 'text', maxLength: 24 },
              { key: 'ingredients', label: 'What’s in it', type: 'text', maxLength: 80 },
              {
                key: 'line',
                label: 'One line about it, like Loud, golden and everyone’s first order.',
                type: 'text',
                maxLength: 60,
              },
              {
                key: 'price',
                label: 'Price',
                type: 'text',
                maxLength: 12,
                format: price,
              },
              {
                key: 'tone',
                label: 'Colour in the cup',
                type: 'single',
                options: tones.map(toneLabel),
              },
            ],
          },
        },
        {
          id: 'juiceOrdering',
          label: 'Ordering',
          type: 'single',
          options: Object.values(ordering),
        },
        {
          id: 'juiceAllergens',
          label: 'Allergen wording',
          type: 'confirm',
          confirmText: `Use this wording on my menu: “${juiceAllergens}” I will keep full allergen information available in store.`,
        },
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const menu = rowValues(answers, rows, 'juiceMenuSource', 'juiceMenu');
    return {
      menu:
        menu?.map(({ name, ingredients, line, price, tone }) => ({
          name,
          ingredients,
          line,
          price,
          tone: tone.toLowerCase(),
        })) ?? null,
      allergens: answers.juiceAllergens === true ? juiceAllergens : null,
      ordering: optionKey(ordering, answers.juiceOrdering),
    };
  },
};
