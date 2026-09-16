import { briefCopy } from './client-brief';
import type { BriefSection } from '../lib/logo-brief/types';

export const logoBriefCopy = {
  ...briefCopy,
  route: '/client/logo-brief/',
  title: 'Logo Design Brief',
  description:
    'Prepare your post-payment logo design brief locally, review your answers and download a PDF to share manually with FinTaxTech.',
  intro:
    'This brief is for clients whose advance payment has been confirmed by FinTaxTech. It helps us understand your business and design direction; it is not a quote request.',
  privacy:
    'Your answers and reference images stay in this page’s memory. Nothing is sent automatically or saved by this website. Refreshing or closing the page clears the brief. Download your PDF before leaving.',
  workflow:
    'After receiving and reviewing your PDF, FinTaxTech will prepare an internal creative prompt and use Adobe Firefly for concept exploration, followed by human refinement and appropriate originality and trade-mark checks.',
  begin: 'Begin logo brief',
  reviewTitle: 'Review your logo brief',
  reviewIntro:
    'Check your details and reference-image explanations. Only applicable answers will appear in the PDF. Nothing has been sent.',
  disclaimer:
    'This is a design brief, not a finished logo or a guarantee of originality or trade-mark availability.',
  pdfFilename: 'FinTaxTech-logo-design-brief.pdf',
};

const formatExamples = {
  Wordmark: {
    file: 'logo-wordmark.svg',
    alt: 'Wordmark format: a business name styled as lettering.',
  },
  'Symbol plus name': {
    file: 'logo-symbol-plus-name.svg',
    alt: 'Symbol plus name format: a simple abstract symbol beside a business name.',
  },
  'Monogram/initials': {
    file: 'logo-monogram.svg',
    alt: 'Monogram format: initials used as the main mark.',
  },
  'Emblem/badge': {
    file: 'logo-emblem.svg',
    alt: 'Emblem format: lettering enclosed within a badge.',
  },
};
const styleExamples = {
  'Script fonts': {
    file: 'avoid-script.svg',
    alt: 'Script lettering example with flowing, handwritten-style text.',
  },
  Gradients: {
    file: 'avoid-gradient.svg',
    alt: 'Gradient example with a smooth transition between colours.',
  },
  'Detailed illustrations': {
    file: 'avoid-detailed-illustration.svg',
    alt: 'Illustration example showing a framed mountain scene with a sun.',
  },
  'Generic stock-style icons': {
    file: 'avoid-generic-icon.svg',
    alt: 'Generic icon example using a simple house outline.',
  },
  '3D effects': {
    file: 'avoid-3d-effects.svg',
    alt: 'Three-dimensional effect example with depth and shading.',
  },
  Mascots: { file: 'avoid-mascot.svg', alt: 'Mascot example using an illustrated character.' },
  'Industry clichés': {
    file: 'avoid-industry-cliche.svg',
    alt: 'Industry cliché example using a familiar trade-related symbol.',
  },
  'Very bright colours': {
    file: 'avoid-bright-colours.svg',
    alt: 'Very bright colour example with overlapping, strongly saturated circles.',
  },
  'Very dark designs': {
    file: 'avoid-dark-design.svg',
    alt: 'Very dark design example with a dark background and a low-contrast ring.',
  },
};

export const logoBriefSections: BriefSection[] = [
  {
    title: 'Your project',
    fields: [
      {
        id: 'project',
        label: 'New brand or complete redesign?',
        type: 'single',
        options: ['New brand', 'Complete redesign'],
      },
    ],
  },
  {
    title: 'Your business name',
    fields: [
      {
        id: 'trading',
        label: 'Trading name',
        type: 'text',
        help: 'Use the exact spelling and capitalisation you want us to work with.',
      },
      {
        id: 'legalDifferent',
        label: 'Is the legal name different?',
        type: 'single',
        options: ['Yes', 'No'],
      },
      {
        id: 'legal',
        label: 'Legal name',
        type: 'text',
        when: { id: 'legalDifferent', values: ['Yes'] },
      },
      { id: 'nameConfirmed', label: 'Confirm your trading name', type: 'confirm' },
    ],
  },
  {
    title: 'Your tagline',
    fields: [
      {
        id: 'tagline',
        label: 'Tagline',
        type: 'single',
        options: ['Must appear with logo', 'Exists but separate from logo', 'No tagline'],
      },
      {
        id: 'taglineText',
        label: 'Exact tagline text',
        type: 'text',
        when: { id: 'tagline', values: ['Must appear with logo', 'Exists but separate from logo'] },
      },
    ],
  },
  {
    title: 'What your business provides',
    fields: [
      {
        id: 'provides',
        label: 'What does the business provide?',
        type: 'multi',
        options: [
          'Products',
          'Professional services',
          'Local/trade services',
          'Technology',
          'Hospitality',
          'Retail/e-commerce',
          'Health/wellbeing',
          'Education',
          'Finance',
          'Property',
          'Other',
        ],
      },
      {
        id: 'service1',
        label: 'Main product or service',
        type: 'text',
        help: 'A short customer-facing description. You can add up to three.',
      },
      { id: 'service2', label: 'Second product or service', type: 'text', optional: true },
      { id: 'service3', label: 'Third product or service', type: 'text', optional: true },
    ],
  },
  {
    title: 'Looking ahead',
    fields: [
      {
        id: 'future',
        label: 'Future services?',
        type: 'single',
        options: ['No', 'Yes', 'Not sure'],
      },
      {
        id: 'futureDetail',
        label: 'Possible additions',
        type: 'text',
        help: 'Describe what might change, or tell us what is still undecided.',
        when: { id: 'future', values: ['Yes', 'Not sure'] },
      },
    ],
  },
  {
    title: 'Your customers',
    fields: [
      {
        id: 'customers',
        label: 'Main customers',
        type: 'multi',
        options: [
          'Consumers',
          'Small businesses',
          'Larger organisations',
          'Public sector',
          'Charities',
          'Professionals',
          'Families',
          'Young adults',
          'Older adults',
          'Other',
        ],
      },
      {
        id: 'geography',
        label: 'Customer geography',
        type: 'single',
        options: ['Local', 'UK-wide', 'International', 'Combination'],
      },
    ],
  },
  {
    title: 'Your brand personality',
    fields: [
      {
        id: 'personality',
        label: 'Brand personality',
        type: 'multi',
        max: 5,
        help: 'Choose up to five qualities.',
        options: [
          'Professional',
          'Trustworthy',
          'Friendly',
          'Modern',
          'Established',
          'Innovative',
          'Premium',
          'Accessible',
          'Bold',
          'Calm',
          'Practical',
          'Playful',
          'Technical',
          'Creative',
          'Sustainable',
          'Other',
        ],
      },
      {
        id: 'boundaries',
        label: 'Brand boundaries',
        type: 'multi',
        options: [
          'Professional—not corporate',
          'Friendly—not childish',
          'Modern—not trend-led',
          'Premium—not exclusive',
          'Bold—not aggressive',
          'Simple—not generic',
          'Technical—not complicated',
          'Traditional—not old-fashioned',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Your preferred logo format',
    fields: [
      {
        id: 'format',
        label: 'Preferred logo type',
        type: 'single',
        options: [
          'Designer to recommend',
          'Wordmark',
          'Symbol plus name',
          'Monogram/initials',
          'Emblem/badge',
          'Not sure',
        ],
        examples: formatExamples,
        help: 'These original examples illustrate formats, not proposed designs for your business.',
      },
    ],
  },
  {
    title: 'What to avoid',
    fields: [
      {
        id: 'avoid',
        label: 'Styles to avoid',
        type: 'multi',
        options: [...Object.keys(styleExamples), 'No preference', 'Other'],
        examples: styleExamples,
        help: 'Choose styles you do not want. “No preference” cannot be combined with other selections. Illustrations are examples, not proposed designs.',
      },
      { id: 'avoidSymbols', label: 'Specific symbols to avoid', type: 'text', optional: true },
    ],
  },
  {
    title: 'Your competitors',
    fields: [
      {
        id: 'competitors',
        label: 'Competitors',
        type: 'competitors',
        optional: true,
        help: 'Optionally list up to five competitors. These details are for our later review; this form does not check their websites.',
      },
    ],
  },
  {
    title: 'Your reference images',
    fields: [
      {
        id: 'references',
        label: 'Do you have reference logos or images?',
        type: 'single',
        options: ['Yes', 'No'],
      },
      {
        id: 'images',
        label: 'Reference logos/images',
        type: 'images',
        when: { id: 'references', values: ['Yes'] },
        help: logoBriefCopy.imageHelp,
      },
    ],
  },
  {
    title: 'Your colour direction',
    fields: [
      {
        id: 'colour',
        label: 'Colour direction',
        type: 'single',
        options: ['Use existing colours', 'I have preferences', 'Designer to recommend'],
      },
      {
        id: 'preferredColours',
        label: 'Preferred colours',
        type: 'text',
        when: { id: 'colour', values: ['Use existing colours', 'I have preferences'] },
      },
      {
        id: 'avoidedColours',
        label: 'Colours to avoid',
        type: 'text',
        help: 'You can write “No colours to avoid”.',
        when: { id: 'colour', values: ['Use existing colours', 'I have preferences'] },
      },
    ],
  },
  {
    title: 'Where your logo will appear',
    fields: [
      {
        id: 'uses',
        label: 'Where will the logo be used?',
        type: 'multi',
        options: [
          'Website',
          'Favicon',
          'Social media',
          'Email',
          'Stationery',
          'Invoices',
          'Packaging',
          'Signage',
          'Vehicles',
          'Workwear',
          'Merchandise',
          'Mobile app',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Who gives final approval',
    fields: [
      {
        id: 'approver',
        label: 'Final approver',
        type: 'single',
        options: ['Me', 'One named person', 'Group providing one consolidated decision'],
      },
      {
        id: 'approverName',
        label: 'Approver name',
        type: 'text',
        when: { id: 'approver', values: ['Me', 'One named person'] },
      },
      {
        id: 'groupContact',
        label: 'Group contact name',
        type: 'text',
        when: { id: 'approver', values: ['Group providing one consolidated decision'] },
      },
    ],
  },
  {
    title: 'Your deadline',
    fields: [
      {
        id: 'deadline',
        label: 'Is there a deadline?',
        type: 'single',
        options: ['No fixed deadline', 'Yes'],
      },
      {
        id: 'deadlineDate',
        label: 'Deadline date',
        type: 'date',
        when: { id: 'deadline', values: ['Yes'] },
      },
      {
        id: 'deadlineReason',
        label: 'Deadline reason',
        type: 'single',
        options: [
          'Business launch',
          'Event',
          'Printing',
          'Website release',
          'Registration',
          'Other',
        ],
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
