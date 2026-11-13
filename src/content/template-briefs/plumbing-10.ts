import type { TemplateBriefSchema } from './index';
import { plumbingDemo } from '../plumbing-demo';
import {
  cycle,
  faqPairs,
  faqRows,
  rowValues,
  sampleChoice,
  stepPairs,
  stepRows,
  stepsChoice,
  whenOwn,
} from './shared';

// plumbing-10 (Copperwell). Content mirrors src/content/plumbing-demo.ts:
// services, process and questions. Service icons are reused in order.
// Adds gasSafe (boiler and gas work only for a Gas Safe registered business)
// and reminders (keep the yearly service reminder sign-up only if it is really sent).
export const gasSafeOptions = {
  yes: 'Yes — our engineers are Gas Safe registered',
  no: 'No — we don’t do gas work',
};
export const reminderOptions = {
  yes: 'Yes — we’ll message customers when their service is due',
  no: 'No — leave the reminder sign-up out',
};

export const plumbing10: TemplateBriefSchema = {
  id: 'plumbing-10',
  prefix: 'plumbing',
  files: {
    work: 'Photos of your work (up to 6)',
    team: 'Team or engineer photos',
    van: 'Van photos',
  },
  sections: [
    {
      title: 'Your plumbing and heating services',
      fields: [
        sampleChoice(
          'plumbingServicesSource',
          'Services',
          'List 3 to 6 services. Icons are reused from the template.',
        ),
        {
          id: 'plumbingServices',
          label: 'Your services',
          type: 'rows',
          when: whenOwn('plumbingServicesSource'),
          repeat: {
            title: (n) => `Service ${n}`,
            add: 'Add a service',
            remove: (n) => `Remove service ${n}`,
            min: 3,
            max: 6,
            fields: [
              { key: 'name', label: 'Service name', type: 'text', maxLength: 28 },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 90 },
            ],
          },
        },
        {
          id: 'plumbingGasSafe',
          label: 'Boiler and gas work',
          type: 'single',
          options: Object.values(gasSafeOptions),
          help: 'By law, anyone working on gas boilers or appliances must be on the Gas Safe Register. If you are not registered, boiler and gas work and the service reminder are left off your site.',
        },
      ],
    },
    {
      title: 'Your process, reminders and questions',
      fields: [
        stepsChoice('plumbingProcessSource', 'The three “how it works” steps'),
        stepRows('plumbingProcess', 'plumbingProcessSource', 3, { title: 28, line: 90 }),
        {
          id: 'plumbingReminders',
          label: 'Boiler service reminders',
          type: 'single',
          options: Object.values(reminderOptions),
          when: { id: 'plumbingGasSafe', values: [gasSafeOptions.yes] },
          help: 'The template has a “Remind me” sign-up. Keep it only if you will really message customers when their yearly service is due.',
        },
        sampleChoice('plumbingFaqSource', 'Frequently asked questions', '3 to 6 questions.'),
        faqRows(
          'plumbingFaq',
          'plumbingFaqSource',
          { min: 3, max: 6 },
          { question: 60, answer: 220 },
        ),
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'plumbingServicesSource', 'plumbingServices');
    const gasSafe = answers.plumbingGasSafe === gasSafeOptions.yes;
    return {
      services:
        services?.map(({ name, description }, index) => ({
          icon: cycle(plumbingDemo.services, index).icon,
          name,
          description,
        })) ?? null,
      process: stepPairs(answers, rows, 'plumbingProcessSource', 'plumbingProcess'),
      questions: faqPairs(answers, rows, 'plumbingFaqSource', 'plumbingFaq'),
      gasSafe,
      reminders: gasSafe && answers.plumbingReminders === reminderOptions.yes,
    };
  },
};
