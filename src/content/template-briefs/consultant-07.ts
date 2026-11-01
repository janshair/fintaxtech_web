import type { TemplateBriefSchema } from './index';
import { caseKinds, serviceIds } from '../consultant-demo';
import { ownWords, price, rowValues, sampleChoice, whenOwn } from './shared';

// consultant-07 (Signature). Content mirrors src/content/consultant-demo.ts:
// role, services, clients, cases, about, heroCall and flow. The role text picks
// the matching role preset, as ?role does on the demo.
export const caseOptions = {
  yes: 'Yes — real ones, with my clients’ permission',
  no: 'No — leave case studies out',
};
const callDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const listDays = (days: string[]) =>
  days.length > 1 ? `${days.slice(0, -1).join(', ')} and ${days.at(-1)}` : (days[0] ?? '');

export const consultant07: TemplateBriefSchema = {
  id: 'consultant-07',
  prefix: 'consultant',
  files: {
    portrait: 'Portrait photo (for About me)',
    working: 'Photos of you at work (optional)',
  },
  sections: [
    {
      title: 'Your role and packages',
      fields: [
        {
          id: 'consultantRole',
          label: 'What you do, like Bookkeeper or Business coach',
          type: 'text',
          maxLength: 40,
          prefill: 'role',
        },
        sampleChoice('consultantServicesSource', 'Packages and prices', '3 or 4 packages.'),
        {
          id: 'consultantServices',
          label: 'Your packages',
          type: 'rows',
          when: whenOwn('consultantServicesSource'),
          repeat: {
            title: (n) => `Package ${n}`,
            add: 'Add a package',
            remove: (n) => `Remove package ${n}`,
            min: 3,
            max: 4,
            fields: [
              { key: 'name', label: 'Package name', type: 'text', maxLength: 28 },
              { key: 'type', label: 'Tag, like ONE-OFF', type: 'text', maxLength: 22 },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 100 },
              {
                key: 'price',
                label: 'Price, like From £350 / month or By quotation',
                type: 'text',
                maxLength: 24,
                format: { ...price, per: true, words: ['By quotation'] },
              },
              { key: 'note', label: 'Note, like Online or in person', type: 'text', maxLength: 32 },
            ],
          },
        },
        sampleChoice('consultantClientsSource', 'Who you work with', 'Up to 6 kinds of client.'),
        {
          id: 'consultantClients',
          label: 'Your clients',
          type: 'rows',
          when: whenOwn('consultantClientsSource'),
          repeat: {
            title: (n) => `Client type ${n}`,
            add: 'Add a client type',
            remove: (n) => `Remove client type ${n}`,
            max: 6,
            fields: [
              { key: 'label', label: 'Like Family businesses', type: 'text', maxLength: 32 },
            ],
          },
        },
      ],
    },
    {
      title: 'Your case studies and about you',
      fields: [
        {
          id: 'consultantCasesChoice',
          label: 'Case studies',
          type: 'single',
          options: Object.values(caseOptions),
          help: 'Only real work. Without case studies, that section is left out.',
        },
        {
          id: 'consultantCases',
          label: 'Your case studies',
          type: 'rows',
          when: { id: 'consultantCasesChoice', values: [caseOptions.yes] },
          repeat: {
            title: (n) => `Case study ${n}`,
            add: 'Add a case study',
            remove: (n) => `Remove case study ${n}`,
            max: 3,
            fields: [
              {
                key: 'sector',
                label: 'Client type, like Local charity',
                type: 'text',
                maxLength: 30,
              },
              { key: 'title', label: 'Title', type: 'text', maxLength: 40 },
              { key: 'problem', label: 'The problem', type: 'text', maxLength: 80 },
              { key: 'outcome', label: 'The outcome', type: 'text', maxLength: 80 },
            ],
          },
        },
        {
          id: 'consultantCasesPermission',
          label: 'Permission',
          type: 'confirm',
          when: { id: 'consultantCasesChoice', values: [caseOptions.yes] },
          confirmText: 'These are real and my clients have given permission to describe them.',
        },
        sampleChoice('consultantAboutSource', 'About me', 'A short paragraph or two.'),
        {
          id: 'consultantAbout',
          label: 'About you',
          type: 'long',
          maxLength: 600,
          when: whenOwn('consultantAboutSource'),
          help: 'Leave a blank line between paragraphs. Your portrait is sent separately.',
        },
      ],
    },
    {
      title: 'Your discovery call',
      fields: [
        sampleChoice(
          'consultantCallSource',
          'Free call length and days',
          'The template offers free 15-minute calls on Tuesday and Thursday.',
        ),
        {
          id: 'consultantCallLength',
          label: 'Free call length',
          type: 'single',
          options: ['15 minutes', '30 minutes'],
          when: whenOwn('consultantCallSource'),
        },
        {
          id: 'consultantCallDays',
          label: 'Days you take calls',
          type: 'multi',
          options: callDays,
          when: whenOwn('consultantCallSource'),
        },
        sampleChoice(
          'consultantTopicsSource',
          'What clients can choose to talk about',
          'Up to 4 topics.',
        ),
        {
          id: 'consultantTopics',
          label: 'Your topics',
          type: 'rows',
          when: whenOwn('consultantTopicsSource'),
          repeat: {
            title: (n) => `Topic ${n}`,
            add: 'Add a topic',
            remove: (n) => `Remove topic ${n}`,
            max: 4,
            fields: [
              { key: 'label', label: 'Like A one-off advice session', type: 'text', maxLength: 36 },
            ],
          },
        },
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const services = rowValues(answers, rows, 'consultantServicesSource', 'consultantServices');
    const clients = rowValues(answers, rows, 'consultantClientsSource', 'consultantClients');
    const topics = rowValues(answers, rows, 'consultantTopicsSource', 'consultantTopics');
    const about =
      answers.consultantAboutSource === ownWords ? String(answers.consultantAbout) : null;
    const call = answers.consultantCallSource === ownWords;
    const minutes = String(answers.consultantCallLength ?? '').split(' ')[0];
    const days = Array.isArray(answers.consultantCallDays)
      ? callDays.filter((day) => (answers.consultantCallDays as string[]).includes(day))
      : null;
    return {
      role: answers.consultantRole,
      services:
        services?.map(({ name, type, description, price, note }, index) => ({
          id: serviceIds[index],
          name,
          type: type.toUpperCase(),
          description,
          price,
          detail: note,
        })) ?? null,
      clients: clients?.map((row) => row.label) ?? null,
      cases:
        answers.consultantCasesChoice === caseOptions.yes
          ? (rows.consultantCases ?? []).map(({ values }, index) => ({
              kind: caseKinds[index],
              sector: values.sector,
              title: values.title,
              problem: values.problem,
              outcome: values.outcome,
            }))
          : [],
      about: about?.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\n/g, ' ')) ?? null,
      hero: call ? { action: `Book a free ${minutes}-minute call` } : null,
      heroCall:
        call && days ? { title: `Free ${minutes}-minute calls`, days: listDays(days) } : null,
      flow: { topics: topics?.map((row) => row.label) ?? null, days: call ? days : null },
    };
  },
};
