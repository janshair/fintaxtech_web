import { briefCopy } from './client-brief';
import { tradingNameField, approverNameField } from './client-brief-fields';
import type { BriefSection } from '../lib/logo-brief/types';

export const logoBriefCopy = {
  ...briefCopy,
  route: '/client/logo-brief/',
  title: 'Logo Design Brief',
  description:
    'Complete your logo and branding brief, review your answers and securely submit it to FinTaxTech. Download a PDF for your records.',
  intro:
    'This brief is for clients whose advance payment has been confirmed by FinTaxTech. It helps us understand your business and design direction; it is not a quote request.',
  privacy:
    'Your answers stay in this page’s memory until you click Submit brief after review. This securely sends your answers, image filenames and explanations to FinTaxTech. Images stay in your browser and your PDF; share the PDF with us to provide the images. Refreshing or closing clears your local copy, but does not delete a submitted brief. Download your PDF for your records.',
  workflow:
    'Complete the questionnaire, review your answers, then click Submit brief to securely send them to FinTaxTech. We will use the brief to develop logo concepts and coherent visual branding guidelines, with human refinement and appropriate originality and trade-mark checks. You can download a PDF copy, including your images.',
  begin: 'Begin logo brief',
  reviewTitle: 'Review your logo brief',
  reviewIntro:
    'Check your answers and image explanations. Nothing has been submitted yet. Click Submit brief to securely send the reviewed brief to FinTaxTech. The PDF uses the same answers and includes your images.',
  disclaimer:
    'This is a design brief, not a finished logo or a guarantee of originality or trade-mark availability.',
  explanation: 'What specifically do you like about this reference?',
  imageHelp:
    'Choose up to five PNG, JPEG or WebP images, maximum 5 MB each. Images are resized in your browser for your PDF. Filenames and explanations are submitted; share the PDF with FinTaxTech to provide the images.',
  shareHelp:
    'Submit brief securely sends your reviewed answers to FinTaxTech. Download PDF creates a copy for your records without submitting. To share the images, attach the PDF yourself using email or WhatsApp.',
  downloaded:
    'Your PDF download has been requested. Downloading does not submit your brief. Use Submit brief to send your answers to FinTaxTech.',
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
      {
        id: 'identityProblems',
        label: "What isn't working with your current identity?",
        type: 'long',
        when: { id: 'project', values: ['Complete redesign'] },
      },
      {
        id: 'identityImprovements',
        label: 'What would you like improved about your current identity?',
        type: 'long',
        help: 'For example: make it feel more modern, simpler, more professional, easier to read, more distinctive or better suited to digital use.',
        when: { id: 'project', values: ['Complete redesign'] },
      },
      {
        id: 'identityRetain',
        label: 'Are there any existing visual elements you would like us to retain?',
        type: 'long',
        optional: true,
        help: 'For example: an established colour, symbol, initials, typography style or another recognisable feature. Leave this blank if nothing needs to be retained.',
        when: { id: 'project', values: ['Complete redesign'] },
      },
      {
        id: 'currentLogo',
        label: 'Your current logo',
        type: 'images',
        imagePurpose: 'current-logo',
        optional: true,
        when: { id: 'project', values: ['Complete redesign'] },
        help: 'Optionally choose one PNG, JPEG or WebP image, maximum 5 MB. It will appear in your PDF. Its filename is submitted; share the PDF with FinTaxTech to provide the image.',
      },
    ],
  },
  {
    title: 'Your business name',
    fields: [
      tradingNameField,
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
      {
        id: 'brandStory',
        label: 'Does your business name or brand have a story or meaning we should know about?',
        type: 'long',
        optional: true,
        help: 'For example, the meaning behind the name, how the business started, a local connection or an idea that is important to the company.',
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
    title: 'What makes your business different',
    fields: [
      {
        id: 'difference',
        label: 'Why should a customer choose your business instead of an alternative?',
        type: 'long',
        help: 'Tell us what makes you different. This could be your service, experience, speed, expertise, pricing approach, customer care, process or something else.',
      },
      {
        id: 'remember',
        label: 'What is the one thing you most want customers to remember about your business?',
        type: 'text',
        help: 'Think about the impression you want someone to take away after seeing your brand.',
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
    title: 'How customers should feel',
    fields: [
      {
        id: 'feeling',
        label: 'How should people feel when they encounter your brand?',
        type: 'multi',
        max: 4,
        help: 'Choose up to four feelings.',
        options: [
          'Confident',
          'Reassured',
          'Welcome',
          'Excited',
          'Curious',
          'Safe',
          'Inspired',
          'Relaxed',
          'Energised',
          'Respected',
          'Comfortable',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Your brand voice',
    fields: [
      {
        id: 'voice',
        label: 'How should the business sound when communicating with customers?',
        type: 'multi',
        max: 4,
        help: 'Choose up to four qualities.',
        options: [
          'Clear',
          'Friendly',
          'Professional',
          'Expert',
          'Conversational',
          'Reassuring',
          'Direct',
          'Warm',
          'Confident',
          'Formal',
          'Energetic',
          'Simple',
          'Other',
        ],
      },
      {
        id: 'avoidVoice',
        label: 'Are there any words, phrases or communication styles the brand should avoid?',
        type: 'long',
        optional: true,
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
      {
        id: 'welcomeIdeas',
        label: 'Are there any ideas, symbols or themes you would like us to consider?',
        type: 'long',
        optional: true,
        help: 'If you already have an idea for the logo, symbol, initials, monogram, shape or visual concept, describe it here. These ideas can be explored by the designer but do not automatically have to appear in every concept.',
      },
      {
        id: 'welcomeIdeasPriority',
        label: 'How important is this idea to you?',
        type: 'single',
        options: [
          'Designer discretion',
          'Please explore it in at least one concept',
          'This is a core idea and should appear in most concepts',
          'This is mandatory and must appear in every concept',
        ],
        help: "This helps us understand whether your idea is simply inspiration or something you definitely want explored. Choosing 'mandatory' may reduce the variety of concepts.",
        when: { id: 'welcomeIdeas', matches: '\\S' },
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
        imageExplanationMin: 10,
        imageExplanationHelp:
          'For example: simplicity, typography, symbol shape, spacing, layout, colours, badge style or overall feel. We use references to understand your taste, not to copy another brand.',
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
      {
        id: 'primaryUse',
        label: 'Where does the identity need to work especially well?',
        type: 'single',
        optionsFrom: { id: 'uses' },
        options: ['No single use is more important'],
        otherField: 'usesOther',
        when: { id: 'uses', matches: '.+' },
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
        ...approverNameField,
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
