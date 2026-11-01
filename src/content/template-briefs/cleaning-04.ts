import type { TemplateBriefSchema } from './index';
import { cleaningDemo } from '../cleaning-demo';
import {
  captionRows,
  cycle,
  faqPairs,
  faqRows,
  optionKey,
  price,
  rowValues,
  sampleChoice,
  stepPairs,
  stepRows,
  stepsChoice,
  whenOwn,
} from './shared';

// cleaning-04 (Fresh Start). Content mirrors src/content/cleaning-demo.ts:
// services, process, work and questions. Service ids, icons and work artwork are reused in order.
const products = {
  included: 'We bring products and equipment',
  'customer-own': 'We use the customer’s own',
  both: 'Either — customers choose',
};

export const cleaning04: TemplateBriefSchema = {
  id: 'cleaning-04',
  prefix: 'cleaning',
  files: {
    work: 'Photos of your work (up to 3)',
    team: 'Team photos',
    van: 'Van or equipment photos',
  },
  sections: [
    {
      title: 'Your cleaning services',
      fields: [
        sampleChoice('cleaningServicesSource', 'Services and prices', 'List 3 to 5 services.'),
        {
          id: 'cleaningServices',
          label: 'Your services',
          type: 'rows',
          when: whenOwn('cleaningServicesSource'),
          repeat: {
            title: (n) => `Service ${n}`,
            add: 'Add a service',
            remove: (n) => `Remove service ${n}`,
            min: 3,
            max: 5,
            fields: [
              { key: 'name', label: 'Service name', type: 'text', maxLength: 30 },
              {
                key: 'type',
                label: 'Type, like REGULAR CLEANING',
                type: 'text',
                maxLength: 24,
              },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 110 },
              {
                key: 'price',
                label: 'Price, like £20 / hour, From £120 or By quotation',
                type: 'text',
                maxLength: 24,
                format: { ...price, per: true, words: ['By quotation'] },
              },
              {
                key: 'detail',
                label: 'Detail, like 2-hour minimum',
                type: 'text',
                maxLength: 32,
              },
            ],
          },
        },
        {
          id: 'cleaningProducts',
          label: 'Products and equipment',
          type: 'single',
          options: Object.values(products),
        },
      ],
    },
    {
      title: 'Your process, examples and questions',
      fields: [
        stepsChoice('cleaningProcessSource', 'The three process steps'),
        stepRows('cleaningProcess', 'cleaningProcessSource', 3, { title: 28, line: 110 }),
        sampleChoice(
          'cleaningWorkSource',
          'Example captions',
          'Three rooms or jobs. Your photos are sent separately.',
        ),
        captionRows(
          'cleaningWork',
          'cleaningWorkSource',
          3,
          { title: 'Title, like A kitchen fresh start', caption: 'One line about it' },
          { title: 30, caption: 60 },
        ),
        sampleChoice('cleaningFaqSource', 'Frequently asked questions', '3 to 6 questions.'),
        faqRows(
          'cleaningFaq',
          'cleaningFaqSource',
          { min: 3, max: 6 },
          { question: 50, answer: 180 },
        ),
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'cleaningServicesSource', 'cleaningServices');
    const work = rowValues(answers, rows, 'cleaningWorkSource', 'cleaningWork');
    const kinds = cleaningDemo.work.map(([kind]) => kind);
    return {
      services:
        services?.map(({ name, type, description, price, detail }, index) => ({
          id: cycle(cleaningDemo.services, index).id,
          name,
          type: type.toUpperCase(),
          description,
          price,
          detail,
          icon: cycle(cleaningDemo.services, index).icon,
        })) ?? null,
      process: stepPairs(answers, rows, 'cleaningProcessSource', 'cleaningProcess'),
      work: work?.map(({ title, caption }, index) => [cycle(kinds, index), title, caption]) ?? null,
      questions: faqPairs(answers, rows, 'cleaningFaqSource', 'cleaningFaq'),
      products: optionKey(products, answers.cleaningProducts),
    };
  },
};
