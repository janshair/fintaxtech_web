import { quizCopy } from './questionnaire';
import type { BriefCondition, BriefField } from '../lib/client-brief/types';

// Keep the identity and approval IDs used by the logo brief.
export const tradingNameField: BriefField = {
  id: 'trading',
  label: 'Trading name',
  type: 'text',
  help: 'Use the exact spelling and capitalisation you want us to work with.',
};
export const approverNameField: BriefField = {
  id: 'approverName',
  label: 'Approver name',
  type: 'text',
};
export const approvalEmailField: BriefField = {
  id: 'approvalEmail',
  label: quizCopy.emailLabel,
  type: 'email',
  optional: true,
  help: 'Optional contact address for the approver. Included in the reviewed brief, its PDF and the Slack submission when you use a final review action.',
};
export const websiteGoalOptions = [
  'Enquiries',
  'Explain services',
  'Sell products',
  'Bookings',
  'Publish information',
  'Credibility',
  'Quote requests',
  'Appointments / reservations',
  'Product orders',
  'Membership / trial interest',
  'Waitlist / sign-up',
  'Applications',
  'Information browsing',
  'Other',
];
export const visitorActionOptions = [
  'Enquire',
  'Call',
  'Email',
  'Book',
  'Buy',
  'Download',
  'Request a quote',
  'Reserve',
  'Place an order',
  'Join / request a trial',
  'Join a waitlist / sign up',
  'Apply',
  'Browse information',
  'Other',
];
export const priorityOfferingsField: BriefField = {
  id: 'priorityOfferings',
  label: 'Priority offerings',
  type: 'rows',
  optional: true,
  help: 'Add up to three services, products, treatments, classes or other offers, in priority order. For example, haircuts, equipment hire, sportswear or training courses. A short description is enough.',
  repeat: {
    title: (n) => `Priority offering ${n}`,
    add: 'Add priority offering',
    remove: (n) => `Remove priority offering ${n}`,
    max: 3,
    fields: [{ key: 'description', label: 'Offering and short description', type: 'text' }],
  },
};
export const referenceWebsitesField: BriefField = {
  id: 'referenceWebsites',
  label: 'Reference websites',
  type: 'rows',
  optional: true,
  help: 'Add one to three full http:// or https:// URLs. For each, explain the layout, colours, typography, imagery, navigation or particular sections you like. References guide the direction; we will not copy another brand. Links are not opened or checked by this form.',
  repeat: {
    title: (n) => `Reference website ${n}`,
    add: 'Add reference website',
    remove: (n) => `Remove reference website ${n}`,
    max: 3,
    fields: [
      { key: 'url', label: 'Reference website URL', type: 'url' },
      { key: 'explanation', label: 'What do you like about this website?', type: 'long' },
    ],
  },
};
export const designPreferenceFields: BriefField[] = [
  {
    id: 'designPreferences',
    label: 'Design preferences',
    type: 'long',
    optional: true,
    help: 'Describe preferred layout, colours, typography, imagery, navigation or overall tone. Existing brand guidance can be described here.',
  },
  {
    id: 'designAvoid',
    label: 'Anything the design should avoid?',
    type: 'long',
    optional: true,
  },
];

// Website-only variants leave the optional shared contact field unchanged for other briefs.
export const websiteContactEmailField: BriefField = {
  ...approvalEmailField,
  label: 'Contact / approver email',
  optional: false,
  help: 'Required so we can contact you about this brief. Use an existing personal or business address, even if you do not need a business email service. Included in review, PDF and Slack.',
};
export const businessStageField: BriefField = {
  id: 'businessStage',
  label: 'Business stage',
  type: 'single',
  options: ['Planning / pre-launch', 'Newly trading', 'Established', 'Not sure'],
};
export const websiteAudienceField: BriefField = {
  id: 'primaryCustomers',
  label: 'Who should the website reach?',
  type: 'multi',
  options: [
    'Consumers / general public',
    'Businesses / organisations',
    'Members / subscribers',
    'Students / learners',
    'Employees / job applicants',
    'Existing customers',
    'Other',
    'Not sure',
  ],
  exclusive: ['Not sure'],
};
export const audienceDetailField: BriefField = {
  id: 'audienceDetail',
  label: 'More about these visitors',
  type: 'text',
  optional: true,
  help: 'For example, homeowners, contractors, diners, fitness beginners or prospective students.',
};
export const prioritySourceField: BriefField = {
  id: 'prioritySource',
  label: 'How should we choose your priority offerings?',
  type: 'single',
  options: [
    'I will list up to three',
    'Help me choose from my existing website',
    'Help me define my main offering',
  ],
  help: 'Offerings can be services, products, treatments, classes or other offers. Website details and suggested offerings need your approval; this form does not fetch websites.',
};
export const businessIdeaField: BriefField = {
  id: 'businessIdea',
  label: 'Describe your business idea',
  type: 'long',
  when: { id: 'prioritySource', values: ['Help me define my main offering'] },
  help: 'A short description of what you hope to offer and to whom is enough. You do not need a website, track record or final brand.',
};
export const operationField: BriefField = {
  id: 'operation',
  label: 'Where and how does the business operate?',
  type: 'single',
  options: [
    'Customer-facing premises',
    'Visiting / delivering to customers',
    'Online only',
    'A combination',
    'Not sure',
  ],
};
export const operationDetailsField: BriefField = {
  id: 'operationDetails',
  label: 'Which ways does the business operate?',
  type: 'multi',
  when: { id: 'operation', values: ['A combination'] },
  options: ['Customer-facing premises', 'Visiting / delivering to customers', 'Online'],
  help: 'Select the parts of your combination so we only ask for relevant public details.',
};
export const deliveryCoverageCondition: BriefCondition[] = [
  { id: 'operation', values: ['Visiting / delivering to customers'] },
  { id: 'operationDetails', values: ['Visiting / delivering to customers'] },
];
export const premisesCondition: BriefCondition[] = [
  { id: 'operation', values: ['Customer-facing premises'] },
  { id: 'operationDetails', values: ['Customer-facing premises'] },
];
export const publicPremisesFields: BriefField[] = [
  {
    id: 'publicLocation',
    label: 'Public location',
    type: 'long',
    optional: true,
    when: premisesCondition,
    help: 'Only provide a customer-facing location you want displayed publicly. A registered or home address is not assumed to be public.',
  },
  {
    id: 'openingHours',
    label: 'Public opening hours',
    type: 'long',
    optional: true,
    when: premisesCondition,
    help: 'Only include hours you want displayed publicly; leave blank if not yet decided.',
  },
];
export const referenceChoiceField: BriefField = {
  id: 'referenceChoice',
  label: 'Do you have reference websites?',
  type: 'single',
  options: ['I have examples', 'Please suggest a design direction'],
};
export const bookingCondition = [
  { id: 'goals', values: ['Bookings', 'Appointments / reservations'] },
  { id: 'action', values: ['Book', 'Reserve'] },
];
export const bookingSubjectField: BriefField = {
  id: 'bookingSubject',
  label: 'What would visitors book?',
  type: 'single',
  when: bookingCondition,
  options: ['Appointment / treatment', 'Table', 'Class', 'Equipment', 'Consultation', 'Other'],
};
export const visitorActionDetailField: BriefField = {
  id: 'visitorActionDetail',
  label: 'What should this visitor interest lead to?',
  type: 'text',
  optional: true,
  when: [
    {
      id: 'goals',
      values: [
        'Product orders',
        'Membership / trial interest',
        'Waitlist / sign-up',
        'Applications',
      ],
    },
    {
      id: 'action',
      values: [
        'Buy',
        'Place an order',
        'Join / request a trial',
        'Join a waitlist / sign up',
        'Apply',
      ],
    },
  ],
  help: 'For example, a product enquiry, trial request, launch mailing list or course/job application. Describe the intended next step; this does not include live commerce, subscriptions or accounts.',
};
export const contentPrioritiesField: BriefField = {
  id: 'contentPriorities',
  label: 'Content priorities',
  type: 'multi',
  optional: true,
  options: [
    'Services / treatments',
    'Products / equipment',
    'Menu',
    'Classes / timetable',
    'Memberships / plans',
    'Projects / gallery',
    'Team / story',
    'Location / opening hours',
    'FAQs',
    'Other',
    'Please suggest',
  ],
  exclusive: ['Please suggest'],
  help: 'Optional guidance for the design direction, not a promise of extra pages or functionality. Additional production scope must be agreed separately.',
};
export const pricingDirectionField: BriefField = {
  id: 'pricingDirection',
  label: 'How should the website present prices or charges?',
  type: 'single',
  options: [
    'I have approved prices to supply',
    'Request a quote',
    'Clearly labelled provisional content',
    'Do not display prices',
    'Not decided—please advise',
  ],
  help: 'This can cover menus, treatment prices, hire rates or membership plans. We do not copy reference-site prices or invent charges. Provisional content must be labelled and approved before production.',
};
export const approvedPricesField: BriefField = {
  id: 'approvedPrices',
  label: 'Approved prices or source material',
  type: 'long',
  optional: true,
  when: { id: 'pricingDirection', values: ['I have approved prices to supply'] },
  help: 'Supply approved prices or describe material you will share manually. Leave blank if you will send it later.',
};
