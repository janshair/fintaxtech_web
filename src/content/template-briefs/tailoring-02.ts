import type { TemplateBriefSchema } from './index';
import { tailoringDemo } from '../tailoring-demo';
import {
  captionRows,
  cycle,
  optionKey,
  price,
  rowValues,
  sampleChoice,
  stepPairs,
  stepRows,
  stepsChoice,
  whenOwn,
} from './shared';

// tailoring-02 (The Fold Atelier). Content mirrors src/content/tailoring-demo.ts:
// services.items, process.steps and work.items. Illustration codes are reused in order.
const appointments = {
  appointment: 'By appointment only',
  'walk-in': 'Walk-ins welcome',
  both: 'Both — appointments and walk-ins',
};

export const tailoring02: TemplateBriefSchema = {
  id: 'tailoring-02',
  prefix: 'tailoring',
  files: {
    gallery: 'Before-and-after photos (up to 3 pairs)',
    workroom: 'Workroom or fitting room photos',
    team: 'Team or portrait photos',
  },
  sections: [
    {
      title: 'Your alterations and fittings',
      fields: [
        sampleChoice(
          'tailoringServicesSource',
          'Services and prices',
          'List 3 to 6 services. Your tailor confirms the final price after seeing the garment.',
        ),
        {
          id: 'tailoringServices',
          label: 'Your services',
          type: 'rows',
          when: whenOwn('tailoringServicesSource'),
          repeat: {
            title: (n) => `Service ${n}`,
            add: 'Add a service',
            remove: (n) => `Remove service ${n}`,
            min: 3,
            max: 6,
            fields: [
              { key: 'name', label: 'Service name', type: 'text', maxLength: 30 },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 90 },
              {
                key: 'price',
                label: 'Price, like From £18 or By consultation',
                type: 'text',
                maxLength: 20,
                format: { ...price, words: ['By consultation'] },
              },
              {
                key: 'turnaround',
                label: 'Usual turnaround, like 3–5 days (optional)',
                type: 'text',
                maxLength: 24,
                optional: true,
              },
            ],
          },
        },
        {
          id: 'tailoringAppointments',
          label: 'Fittings',
          type: 'single',
          options: Object.values(appointments),
        },
      ],
    },
    {
      title: 'Your process and examples',
      fields: [
        stepsChoice(
          'tailoringProcessSource',
          'The three process steps',
          'The template shows Bring it in, Find the line and Make it yours.',
        ),
        stepRows('tailoringProcess', 'tailoringProcessSource', 3, { title: 24, line: 110 }),
        sampleChoice(
          'tailoringWorkSource',
          'Before-and-after captions',
          'Three examples. Your before-and-after photos are sent separately.',
        ),
        captionRows(
          'tailoringWork',
          'tailoringWorkSource',
          3,
          { title: 'Garment, like The clean hem', caption: 'What was done' },
          { title: 30, caption: 50 },
        ),
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'tailoringServicesSource', 'tailoringServices');
    const work = rowValues(answers, rows, 'tailoringWorkSource', 'tailoringWork');
    const steps = stepPairs(answers, rows, 'tailoringProcessSource', 'tailoringProcess');
    const codes = tailoringDemo.services.items.map((item) => item.code);
    const kinds = tailoringDemo.work.items.map((item) => item.kind);
    return {
      services: services && {
        items: services.map(({ name, description, price, turnaround }, index) => ({
          name,
          description,
          price,
          code: cycle(codes, index),
          turnaround: turnaround || null,
        })),
      },
      process: steps && { steps },
      work: work && {
        items: work.map(({ title, caption }, index) => ({
          title,
          caption,
          kind: cycle(kinds, index),
        })),
      },
      appointments: optionKey(appointments, answers.tailoringAppointments),
    };
  },
};
