import { quizCopy } from './questionnaire';
import type { BriefField } from '../lib/client-brief/types';

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
  'Other',
];
export const visitorActionOptions = [
  'Enquire',
  'Call',
  'Email',
  'Book',
  'Buy',
  'Download',
  'Other',
];
export const priorityOfferingsField: BriefField = {
  id: 'priorityOfferings',
  label: 'Priority services or products',
  type: 'rows',
  optional: true,
  help: 'Add up to three, in priority order. A short description is enough.',
  repeat: {
    title: (n) => `Priority service or product ${n}`,
    add: 'Add priority service or product',
    remove: (n) => `Remove priority service or product ${n}`,
    max: 3,
    fields: [
      { key: 'description', label: 'Service or product and short description', type: 'text' },
    ],
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
