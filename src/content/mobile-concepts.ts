import { mobileAppGallery } from './mobile-app-templates';

export const mobileConcepts = [
  {
    id: 'field',
    slug: 'field-service-inspections',
    title: 'Field service & inspections',
    app: 'Northline Service',
    description:
      'Open a site job, complete an inspection offline and hand the report to dispatch when the connection returns.',
    steps: ['Open a job', 'Complete the checklist', 'Review the report', 'Reconnect & sync'],
    actions: [
      'Open checklist',
      'Review inspection',
      'Queue report offline',
      'Simulate reconnect & sync',
    ],
    complete: ['Report synced', 'Dispatch has received the sample report for pump P-04.'],
    audiences: [
      [
        'For engineers',
        'Carry the job details to site, tick off observations and flag an item that needs a follow-up.',
      ],
      [
        'For dispatch',
        'See which reports have arrived, which jobs need attention and which uploads are still pending.',
      ],
    ],
    faqs: [
      [
        'What could work offline?',
        'A live app could download assigned jobs before a visit and keep observations on the device until a connection returns. We would agree how to protect drafts and handle changes made by dispatch.',
      ],
      [
        'Can our team use different checklists?',
        'Yes. Start with one asset type, such as a pump, and agree the required observations with your team before adding other equipment.',
      ],
    ],
    enquiry: 'Discuss my field service app',
  },
  {
    id: 'loyalty',
    slug: 'customer-loyalty-rewards',
    title: 'Customer loyalty & rewards',
    app: 'Ember Coffee',
    description:
      'Collect a café stamp, see when a free drink is ready and redeem it at the counter.',
    steps: ['Open the stamp card', 'Record a purchase', 'View the reward', 'Redeem at the counter'],
    actions: [
      'View sample purchase',
      'Collect one stamp',
      'Use this reward',
      'Confirm sample redemption',
    ],
    complete: [
      'Reward redeemed',
      'One regular coffee redeemed. Your next card starts at 0 of 5 stamps.',
    ],
    audiences: [
      [
        'For customers',
        'Check a stamp balance and see exactly what the next qualifying purchase earns.',
      ],
      [
        'For the café',
        'Set qualifying purchases and reward rules, then let staff verify redemptions at the counter.',
      ],
    ],
    faqs: [
      [
        'Could stamps come from our till?',
        'We would check whether the till can share eligible purchases and returns. A first release could also use staff-approved stamps.',
      ],
      [
        'How would repeat scans be handled?',
        'A live scheme should identify each qualifying purchase and record each redemption once. We would agree how all tills check that record, including when connectivity is poor.',
      ],
    ],
    enquiry: 'Discuss my loyalty app',
  },
  {
    id: 'learning',
    slug: 'learning-training',
    title: 'Learning & training',
    app: 'Fold Print Studio',
    description:
      'Follow a short onboarding lesson, check what you learned and see when a supervisor has signed off your practical work.',
    steps: ['Open a module', 'Try the lesson', 'Request observation', 'Sign off the skill'],
    actions: ['Start lesson', 'Check answer', 'Request observation', 'Confirm sample sign-off'],
    complete: [
      'Skill signed off',
      'Your sample training record now includes the ink-roll lesson and the supervisor’s practical sign-off.',
    ],
    audiences: [
      [
        'For learners',
        'Practise one task at a time and see which skills still need an in-person observation.',
      ],
      [
        'For supervisors',
        'Separate lesson completion from observed practice and sign off a skill after seeing it demonstrated.',
      ],
    ],
    faqs: [
      [
        'Does passing a quiz complete practical training?',
        'The quiz records understanding of the lesson. Practical completion requires a separate observation by an authorised supervisor.',
      ],
      [
        'Can we use our own training material?',
        'Yes. Start with an approved lesson, a short knowledge check and a clear observation criterion. Your team owns the content and decides when to update it.',
      ],
    ],
    enquiry: 'Discuss my training app',
  },
] as const;
export type MobileConcept = (typeof mobileConcepts)[number];
export function mobileConceptRoute(concept: MobileConcept) {
  return mobileAppGallery.route + concept.slug + '/';
}
