import type { TemplateBriefSchema } from './index';
import { gymDemo } from '../gym-demo';
import { weekDays } from '../../lib/client-brief/formats';
import {
  cycle,
  duration,
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

// gym-06 (Full Circuit). Content mirrors src/content/gym-demo.ts: services,
// memberships, timetable, facilities, process and questions.
const timetableOptions = {
  own: 'I’ll add my classes',
  link: 'Link to my timetable instead',
  sample: 'Use the template’s sample for now',
};
const firstVisit = {
  free: 'A free first visit',
  'day-pass': 'A paid day pass',
  none: 'No first-visit offer',
};
const facilityIcons = Object.fromEntries(
  gymDemo.facilities.map(([icon, label]) => [label, icon]),
) as Record<string, string>;
const periods = ['/ month', '/ week', '/ year', '/ visit', '/ class'];

export const gym06: TemplateBriefSchema = {
  id: 'gym-06',
  prefix: 'gym',
  files: {
    floor: 'Gym floor and studio photos (up to 3)',
    classes: 'Class photos',
    team: 'Coach or team photos',
  },
  sections: [
    {
      title: 'Your training and memberships',
      fields: [
        sampleChoice(
          'gymServicesSource',
          'Ways to train',
          '3 to 5 options, like the gym floor, classes and personal training. Please don’t add health or weight-loss claims.',
        ),
        {
          id: 'gymServices',
          label: 'Your ways to train',
          type: 'rows',
          when: whenOwn('gymServicesSource'),
          repeat: {
            title: (n) => `Option ${n}`,
            add: 'Add an option',
            remove: (n) => `Remove option ${n}`,
            min: 3,
            max: 5,
            fields: [
              { key: 'name', label: 'Name, like Small group classes', type: 'text', maxLength: 26 },
              { key: 'type', label: 'Tag, like TRAIN TOGETHER', type: 'text', maxLength: 18 },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 90 },
              {
                key: 'price',
                label: 'Price, like £32 / session or Free',
                type: 'text',
                maxLength: 22,
                format: { ...price, per: true, words: ['Free'] },
              },
              {
                key: 'detail',
                label: 'Detail, like Blocks of 5 available',
                type: 'text',
                maxLength: 32,
              },
            ],
          },
        },
        sampleChoice('gymMembershipsSource', 'Memberships', '2 to 4 memberships.'),
        {
          id: 'gymMemberships',
          label: 'Your memberships',
          type: 'rows',
          when: whenOwn('gymMembershipsSource'),
          repeat: {
            title: (n) => `Membership ${n}`,
            add: 'Add a membership',
            remove: (n) => `Remove membership ${n}`,
            min: 2,
            max: 4,
            single: {
              key: 'popular',
              value: 'Yes',
              message: 'Mark only one membership as most popular.',
            },
            fields: [
              { key: 'name', label: 'Name, like Anytime', type: 'text', maxLength: 16 },
              {
                key: 'price',
                label: 'Price, like £34',
                type: 'text',
                maxLength: 10,
                format: price,
              },
              { key: 'period', label: 'Per', type: 'single', options: periods },
              { key: 'note', label: 'Note, like All opening hours', type: 'text', maxLength: 40 },
              { key: 'perk1', label: 'What’s included 1', type: 'text', maxLength: 24 },
              {
                key: 'perk2',
                label: 'What’s included 2 (optional)',
                type: 'text',
                maxLength: 24,
                optional: true,
              },
              {
                key: 'perk3',
                label: 'What’s included 3 (optional)',
                type: 'text',
                maxLength: 24,
                optional: true,
              },
              {
                key: 'perk4',
                label: 'What’s included 4 (optional)',
                type: 'text',
                maxLength: 24,
                optional: true,
              },
              {
                key: 'popular',
                label: 'Most popular',
                type: 'single',
                options: ['Yes', 'No'],
              },
            ],
          },
        },
        {
          id: 'gymFirstVisit',
          label: 'First visit',
          type: 'single',
          options: Object.values(firstVisit),
        },
        {
          id: 'gymDayPass',
          label: 'Day pass price, like £8',
          type: 'text',
          maxLength: 10,
          format: price,
          when: { id: 'gymFirstVisit', values: [firstVisit['day-pass']] },
        },
      ],
    },
    {
      title: 'Your timetable and facilities',
      fields: [
        {
          id: 'gymTimetableSource',
          label: 'Class timetable',
          type: 'single',
          options: Object.values(timetableOptions),
        },
        {
          id: 'gymTimetable',
          label: 'Your classes',
          type: 'rows',
          when: { id: 'gymTimetableSource', values: [timetableOptions.own] },
          help: 'One line per class. The website groups them by day, in time order.',
          repeat: {
            title: (n) => `Class ${n}`,
            add: 'Add a class',
            remove: (n) => `Remove class ${n}`,
            max: 30,
            fields: [
              { key: 'day', label: 'Day', type: 'single', options: [...weekDays] },
              {
                key: 'time',
                label: 'Start time, like 18:30',
                type: 'text',
                maxLength: 5,
                pattern: {
                  source: '^([01]\\d|2[0-3]):[0-5]\\d$',
                  message: 'Enter a start time on the 24-hour clock, like 18:30.',
                },
              },
              { key: 'name', label: 'Class name', type: 'text', maxLength: 24 },
              {
                key: 'length',
                label: 'Length, like 45',
                type: 'text',
                maxLength: 12,
                format: duration,
              },
            ],
          },
        },
        {
          id: 'gymTimetableLink',
          label: 'Timetable link',
          type: 'url',
          when: { id: 'gymTimetableSource', values: [timetableOptions.link] },
        },
        {
          id: 'gymFacilities',
          label: 'Facilities',
          type: 'multi',
          options: [...Object.keys(facilityIcons), 'Other'],
          help: 'Only what you actually have.',
        },
        stepsChoice('gymProcessSource', 'The three first-visit steps'),
        stepRows('gymProcess', 'gymProcessSource', 3, { title: 30, line: 120 }),
        sampleChoice('gymFaqSource', 'Frequently asked questions', '3 to 6 questions.'),
        faqRows('gymFaq', 'gymFaqSource', { min: 3, max: 6 }, { question: 50, answer: 180 }),
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'gymServicesSource', 'gymServices');
    const memberships = rowValues(answers, rows, 'gymMembershipsSource', 'gymMemberships');
    const classes =
      answers.gymTimetableSource === timetableOptions.own
        ? (rows.gymTimetable ?? []).map((row) => row.values)
        : null;
    const facilities = Array.isArray(answers.gymFacilities) ? answers.gymFacilities : [];
    return {
      services:
        services?.map(({ name, type, description, price, detail }, index) => ({
          id: cycle(gymDemo.services, index).id,
          name,
          type: type.toUpperCase(),
          description,
          price,
          detail,
        })) ?? null,
      memberships:
        memberships?.map(({ name, price, period, note, popular, ...perks }) => ({
          name,
          price,
          period,
          note,
          perks: [perks.perk1, perks.perk2, perks.perk3, perks.perk4].filter(Boolean),
          ...(popular === 'Yes' ? { featured: true } : {}),
        })) ?? null,
      // Days with classes, in week order; each day's classes in time order.
      timetable:
        classes &&
        weekDays
          .map((label) => ({
            day: label.slice(0, 3),
            label,
            classes: classes
              .filter((row) => row.day === label)
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((row) => [row.time, row.name, row.length]),
          }))
          .filter((day) => day.classes.length),
      timetableLink: typeof answers.gymTimetableLink === 'string' ? answers.gymTimetableLink : null,
      facilities: facilities.map((label) =>
        label === 'Other'
          ? ['✳', String(answers.gymFacilitiesOther ?? '')]
          : [facilityIcons[label], label],
      ),
      firstVisit: {
        offer: optionKey(firstVisit, answers.gymFirstVisit),
        price: typeof answers.gymDayPass === 'string' ? answers.gymDayPass : null,
      },
      process: stepPairs(answers, rows, 'gymProcessSource', 'gymProcess'),
      questions: faqPairs(answers, rows, 'gymFaqSource', 'gymFaq'),
    };
  },
};
