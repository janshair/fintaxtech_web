import { briefCopy, type BriefCopy } from './client-brief';
import { logoBriefCopy } from './logo-brief';
import type { BriefSection } from '../lib/client-brief/types';

export const mobileAppBriefCopy: BriefCopy = {
  ...briefCopy,
  route: '/client/mobile-app-brief/',
  title: 'Mobile App Production Brief',
  description:
    'Prepare your post-payment mobile app production brief locally, review features and first-release priorities, and download a PDF to share manually with FinTaxTech.',
  intro:
    'Complete this brief after FinTaxTech has confirmed your advance payment. It records production details for your new app or complete redesign; it is not a quote request.',
  privacy:
    'Your answers stay in this page’s memory. Nothing is sent automatically or saved by this website. Refreshing or closing clears the brief. Download your PDF before leaving. Please do not enter passwords or real customer records.',
  workflow:
    'FinTaxTech will review your requirements and first-release priorities against the written proposal. Features, integrations, sensitive information and offline synchronisation may need further scope and privacy review.',
  begin: 'Begin mobile app brief',
  reviewTitle: 'Review your mobile app brief',
  reviewIntro:
    'Check your selected features, custom-feature descriptions and first-release priorities. Only applicable answers will appear in the PDF. Nothing has been sent.',
  disclaimer:
    'This brief does not alter the written proposal or guarantee app-store approval. Any changes to the agreed scope must be confirmed separately.',
  pdfFilename: 'FinTaxTech-mobile-app-production-brief.pdf',
};

const standardFeatures = [
  'Accounts/login',
  'Profiles',
  'Search',
  'Camera/photos',
  'Location/maps',
  'Notifications',
  'Messaging',
  'Booking',
  'Payments',
  'File upload',
  'Reporting',
];
const privacyNote =
  'These information types need scope and privacy review, including appropriate security, permissions and retention. Do not provide actual sensitive records, payment details or credentials in this brief.';
export const mobileAppBriefSections: BriefSection[] = [
  {
    title: 'Your app project',
    fields: [
      {
        id: 'project',
        label: 'Project',
        type: 'single',
        options: ['New app', 'Complete redesign'],
        help: 'We create new apps and complete redesigns. Legacy-code repair is outside this brief.',
      },
      {
        id: 'appLinks',
        label: 'Current app links',
        type: 'urls',
        when: { id: 'project', values: ['Complete redesign'] },
        help: 'Enter one full app-store or current-app URL per line, including https://. This form does not open or check these links.',
      },
    ],
  },
  {
    title: 'Who will use the app',
    fields: [
      {
        id: 'users',
        label: 'Users',
        type: 'multi',
        options: [
          'General public',
          'Existing customers',
          'Employees',
          'Business partners',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'The main tasks',
    fields: [
      {
        id: 'tasks',
        label: 'Main tasks',
        type: 'multi',
        max: 3,
        help: 'Choose up to three.',
        options: [
          'Book',
          'Buy/pay',
          'Browse content',
          'Communicate',
          'Track progress',
          'Record work',
          'Manage an account',
          'Access a service',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Devices to support',
    fields: [
      {
        id: 'devices',
        label: 'Phone platforms',
        type: 'single',
        options: ['iPhone', 'Android phones', 'Both', 'FinTaxTech to recommend'],
        help: 'Both means iPhone and Android phones. Choose the phone platforms first, then tell us whether tablet support is needed.',
      },
      {
        id: 'tablets',
        label: 'Tablet support',
        type: 'single',
        options: ['Phones only', 'Tablets too', 'FinTaxTech to recommend'],
        when: { id: 'devices', values: ['iPhone', 'Android phones', 'Both'] },
      },
    ],
  },
  {
    title: 'How often the app will be used',
    fields: [
      {
        id: 'frequency',
        label: 'Use frequency',
        type: 'single',
        options: ['Several times daily', 'Daily', 'Weekly', 'Occasionally', 'Not sure'],
      },
    ],
  },
  {
    title: 'Features and first-release priorities',
    fields: [
      {
        id: 'features',
        label: 'Features',
        type: 'multi',
        options: [...standardFeatures, 'Other'],
        otherField: 'customFeatures',
        help: 'Choose the features you need. For Other, add each custom feature below. These selections do not automatically extend the agreed scope.',
      },
      {
        id: 'essentialFeatures',
        label: 'Which selected standard features are essential for the first release?',
        type: 'multi',
        optionsFrom: { id: 'features', exclude: ['Other'] },
        options: ['None of these in the first release', 'Not sure'],
        exclusive: ['None of these in the first release', 'Not sure'],
        when: { id: 'features', values: standardFeatures },
        help: 'Only your selected standard features are listed. Choose the essentials, or one of the separate None / Not sure answers. Set each custom feature’s priority in its own row.',
      },
      {
        id: 'customFeatures',
        label: 'Custom features',
        type: 'rows',
        when: { id: 'features', values: ['Other'] },
        help: 'Add up to 10 uniquely named features. You can edit each row directly or remove it.',
        repeat: {
          title: (n) => `Custom feature ${n}`,
          add: 'Add custom feature',
          remove: (n) => `Remove custom feature ${n}`,
          max: 10,
          unique: { key: 'name', againstOptionsFrom: 'features' },
          fields: [
            { key: 'name', label: 'Feature name', type: 'text' },
            { key: 'purpose', label: 'What should it do?', type: 'text' },
            {
              key: 'release',
              label: 'Needed in first release?',
              type: 'single',
              options: ['Yes', 'Later', 'Not sure'],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Using the app offline',
    fields: [
      {
        id: 'offline',
        label: 'Offline use',
        type: 'single',
        options: ['No', 'View information offline', 'Record work and sync later', 'Not sure'],
        help: 'Offline data and later synchronisation need to be reviewed against the agreed scope.',
      },
    ],
  },
  {
    title: 'Information the app will handle',
    fields: [
      {
        id: 'information',
        label: 'Information handled',
        type: 'multi',
        options: [
          'Contact details',
          'Payments',
          'Location',
          'Photos/files',
          'Health or other sensitive information',
          'Business records',
          'None',
          'Not sure',
        ],
        exclusive: ['None'],
        help: 'Select categories only, not real records. None cannot be combined with other choices.',
        followUp: {
          values: [
            'Contact details',
            'Payments',
            'Location',
            'Photos/files',
            'Health or other sensitive information',
            'Business records',
          ],
          text: privacyNote,
          pdfNote: privacyNote,
        },
      },
    ],
  },
  {
    title: 'Connections to other systems',
    fields: [
      {
        id: 'systems',
        label: 'Will the app connect to other systems?',
        type: 'single',
        options: ['No', 'Yes', 'Not sure'],
      },
      {
        id: 'systemDetails',
        label: 'Connected systems',
        type: 'rows',
        when: { id: 'systems', values: ['Yes'] },
        help: 'Name each system and explain the connection you need. Do not enter API keys or account credentials.',
        repeat: {
          title: (n) => `System ${n}`,
          add: 'Add system',
          remove: (n) => `Remove system ${n}`,
          fields: [
            { key: 'name', label: 'System name', type: 'text' },
            { key: 'purpose', label: 'Purpose of the connection', type: 'text' },
          ],
        },
      },
    ],
  },
  {
    title: 'Your app content',
    fields: [
      {
        id: 'content',
        label: 'App content',
        type: 'single',
        options: [
          'Customer provides all final content',
          'FinTaxTech creates all content from agreed sources',
        ],
        help: 'Choose one approach for all app content. Content work remains subject to the written proposal.',
      },
    ],
  },
  {
    title: 'Your existing assets',
    fields: [
      {
        id: 'assets',
        label: 'Existing assets',
        type: 'multi',
        options: ['Logo/brand guidelines', 'UI designs', 'Photos', 'Illustrations', 'None'],
        exclusive: ['None'],
        followUp: {
          values: ['None'],
          text: 'You may open the separate branding brief in a new tab while keeping this app brief open. This does not automatically add branding to scope; any branding work must be agreed separately.',
          link: { label: 'Open the separate logo brief in a new tab', href: logoBriefCopy.route },
        },
      },
    ],
  },
  {
    title: 'Your developer accounts',
    fields: [
      {
        id: 'appleAccount',
        label: 'Do you have an Apple developer account?',
        type: 'single',
        options: ['Yes', 'No', 'Not sure'],
        help: 'App-store developer accounts should belong to you, the client. Do not share account credentials in this brief.',
      },
      {
        id: 'googleAccount',
        label: 'Do you have a Google Play developer account?',
        type: 'single',
        options: ['Yes', 'No', 'Not sure'],
        help: 'The Google Play developer account should also belong to you, the client.',
      },
    ],
  },
  {
    title: 'What success looks like',
    fields: [
      {
        id: 'success',
        label: 'First-release success',
        type: 'multi',
        max: 2,
        help: 'Choose up to two measures that matter most.',
        options: [
          'Active users',
          'Bookings/orders',
          'Time saved',
          'Fewer manual tasks',
          'Customer feedback',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Your deadline',
    fields: [
      { id: 'deadline', label: 'Deadline', type: 'single', options: ['No fixed date', 'Yes'] },
      {
        id: 'deadlineDate',
        label: 'Deadline date',
        type: 'date',
        when: { id: 'deadline', values: ['Yes'] },
      },
      {
        id: 'deadlineReason',
        label: 'Reason for the deadline',
        type: 'text',
        when: { id: 'deadline', values: ['Yes'] },
      },
    ],
  },
  {
    title: 'Anything else',
    fields: [
      {
        id: 'anything',
        label: 'Anything else we should know?',
        type: 'long',
        optional: true,
        help: 'Please avoid passwords and unnecessary sensitive information.',
      },
    ],
  },
];
