import type { TemplateBriefSchema } from './index';
import { optionKey, rowValues, sampleChoice, whenOwn } from './shared';

// kitchens-13 (Plinth & Plumb, 3D). Content mirrors src/content/kitchens-demo.ts:
// the named styles in the showcase. Each style reuses a 3D look from the
// template in order; the customer's words replace the names and lines.
// Adds rooms (what they fit) and visits (how design visits work).
export const roomOptions = {
  both: 'Kitchens and bathrooms',
  kitchens: 'Kitchens only',
  bathrooms: 'Bathrooms only',
};
export const visitOptions = {
  home: 'We visit to measure and design',
  showroom: 'Customers come to our showroom',
  both: 'Both',
};

export const kitchens13: TemplateBriefSchema = {
  id: 'kitchens-13',
  prefix: 'kitchens',
  files: {
    work: 'Photos of finished kitchens or bathrooms (up to 8)',
    showroom: 'Showroom or workshop photos',
    team: 'Team photos',
  },
  sections: [
    {
      title: 'Your kitchens and bathrooms',
      fields: [
        {
          id: 'kitchensRooms',
          label: 'What you fit',
          type: 'single',
          options: Object.values(roomOptions),
          help: 'The 3D designer can switch between a kitchen and a bathroom. We leave out the room you don’t fit.',
        },
        sampleChoice(
          'kitchensStylesSource',
          'Styles',
          'Name 3 to 6 looks you fit often, with one line each. Each one reuses a 3D look from the template.',
        ),
        {
          id: 'kitchensStyles',
          label: 'Your styles',
          type: 'rows',
          when: whenOwn('kitchensStylesSource'),
          repeat: {
            title: (n) => `Style ${n}`,
            add: 'Add a style',
            remove: (n) => `Remove style ${n}`,
            min: 3,
            max: 6,
            fields: [
              { key: 'name', label: 'Style name, like Sunday Shaker', type: 'text', maxLength: 24 },
              { key: 'line', label: 'One line about it', type: 'text', maxLength: 100 },
            ],
          },
        },
        {
          id: 'kitchensVisits',
          label: 'Design visits',
          type: 'single',
          options: Object.values(visitOptions),
          help: 'The template ends with “Book a design visit”. We word it to match how you really work.',
        },
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const styles = rowValues(answers, rows, 'kitchensStylesSource', 'kitchensStyles');
    return {
      styles: styles?.map(({ name, line }) => ({ name, line })) ?? null,
      rooms: optionKey(roomOptions, answers.kitchensRooms),
      visits: optionKey(visitOptions, answers.kitchensVisits),
    };
  },
};
