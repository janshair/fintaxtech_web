import type { TemplateBriefSchema } from './index';
import { juiceBarDemo } from '../juice-bar-demo';
import {
  optionKey,
  price,
  rowValues,
  sampleChoice,
  stepPairs,
  stepRows,
  stepsChoice,
  whenOwn,
} from './shared';

// juice-bar-05 (Daybreak Blend, 3D). Content mirrors src/content/juice-bar-demo.ts:
// menu, stages, allergens and loyalty. Each menu item picks one of the template's colour tones.
const tones = [...new Set(juiceBarDemo.menu.map((item) => item.tone))];
const toneLabel = (tone: string) => tone[0].toUpperCase() + tone.slice(1);
export const juiceAllergens =
  'Ask us about allergens — full allergen information is available in store.';
const ordering = {
  collection: 'Order ahead for collection',
  delivery: 'Delivery apps, like Deliveroo or Just Eat',
  both: 'Both',
  neither: 'Neither — walk in and order',
};
const loyalty = {
  own: 'I’ll enter my own offer',
  sample: 'Use the template’s sample for now',
  none: 'No loyalty offer',
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
          'List 4 to 8 items. Describe what is in each one; please don’t add health or nutrition claims.',
        ),
        {
          id: 'juiceMenu',
          label: 'Your menu items',
          type: 'rows',
          when: whenOwn('juiceMenuSource'),
          repeat: {
            title: (n) => `Item ${n}`,
            add: 'Add an item',
            remove: (n) => `Remove item ${n}`,
            min: 4,
            max: 8,
            fields: [
              { key: 'category', label: 'Category, like Smoothies', type: 'text', maxLength: 24 },
              { key: 'name', label: 'Item name', type: 'text', maxLength: 24 },
              { key: 'ingredients', label: 'Ingredients', type: 'text', maxLength: 80 },
              {
                key: 'price',
                label: 'Price, like £4.50',
                type: 'text',
                maxLength: 12,
                format: price,
              },
              {
                key: 'tone',
                label: 'Colour on the menu',
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
    {
      title: 'Your story and loyalty offer',
      fields: [
        stepsChoice(
          'juiceStagesSource',
          'The three story stages',
          'The 3D cup fills as you scroll past three short lines.',
        ),
        stepRows('juiceStages', 'juiceStagesSource', 3, { title: 26, line: 80 }),
        {
          id: 'juiceLoyaltySource',
          label: 'Loyalty card',
          type: 'single',
          options: Object.values(loyalty),
        },
        {
          id: 'juiceLoyalty',
          label: 'Your offer, like Your 10th drink is on us.',
          type: 'text',
          maxLength: 40,
          when: { id: 'juiceLoyaltySource', values: [loyalty.own] },
        },
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const menu = rowValues(answers, rows, 'juiceMenuSource', 'juiceMenu');
    const offer = optionKey(loyalty, answers.juiceLoyaltySource);
    return {
      menu:
        menu?.map(({ category, name, ingredients, price, tone }, index) => ({
          category,
          name,
          ingredients,
          price,
          mark: String(index + 1).padStart(2, '0'),
          tone: tone.toLowerCase(),
        })) ?? null,
      stages: stepPairs(answers, rows, 'juiceStagesSource', 'juiceStages'),
      allergens: answers.juiceAllergens === true ? juiceAllergens : null,
      // An offer of your own, false for none, or null to keep the sample.
      loyalty:
        offer === 'own'
          ? { offer: answers.juiceLoyalty, note: null }
          : offer === 'none'
            ? false
            : null,
      ordering: optionKey(ordering, answers.juiceOrdering),
    };
  },
};
