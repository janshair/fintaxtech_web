import { brandingDesignQuestion } from './branding-design';
import { briefCopy } from './client-brief';
import { tradingNameField } from './client-brief-fields';
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
export const logoBriefSections: BriefSection[] = [
  {
    title: 'Your project and name',
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
        when: {
          id: 'project',
          values: ['Complete redesign'],
        },
      },
      {
        id: 'identityImprovements',
        label: 'What would you like improved about your current identity?',
        type: 'long',
        help: 'For example: make it feel more modern, simpler, more professional, easier to read, more distinctive or better suited to digital use.',
        when: {
          id: 'project',
          values: ['Complete redesign'],
        },
      },
      {
        id: 'identityRetain',
        label: 'Are there any existing visual elements you would like us to retain?',
        type: 'long',
        optional: true,
        help: 'For example: an established colour, symbol, initials, typography style or another recognisable feature. Leave this blank if nothing needs to be retained.',
        when: {
          id: 'project',
          values: ['Complete redesign'],
        },
      },
      {
        id: 'currentLogo',
        label: 'Your current logo',
        type: 'images',
        imagePurpose: 'current-logo',
        optional: true,
        when: {
          id: 'project',
          values: ['Complete redesign'],
        },
        help: 'Optionally choose one PNG, JPEG or WebP image, maximum 5 MB. It will appear in your PDF. Its filename is submitted; share the PDF with FinTaxTech to provide the image.',
      },
      tradingNameField,
      {
        id: 'nameConfirmed',
        label: 'Confirm your trading name',
        type: 'confirm',
      },
      {
        id: 'brandStory',
        label: 'Does your business name or brand have a story or meaning we should know about?',
        type: 'long',
        optional: true,
        help: 'Optional: explain the meaning behind the name or anything in the business story that could inspire the design.',
      },
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
        when: {
          id: 'tagline',
          values: ['Must appear with logo', 'Exists but separate from logo'],
        },
      },
    ],
  },
  {
    title: 'Your business and customers',
    fields: [
      {
        id: 'service1',
        label: 'What does your business do?',
        type: 'long',
        help: 'Briefly describe your main products, services or content, and what makes them different. One short answer is enough.',
      },
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
    ],
  },
  {
    title: 'Your design direction',
    fields: [
      {
        id: 'designStyle',
        label: 'Choose desired design',
        type: 'single',
        options: brandingDesignQuestion.options,
        examples: brandingDesignQuestion.examples,
        help: 'Choose the look closest to your taste. These existing designs are visual references to discuss with your designer. You can also ask us to help you choose or share a reference later.',
      },
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
        when: {
          id: 'welcomeIdeas',
          matches: '\\S',
        },
      },
      {
        id: 'avoidSymbols',
        label: 'Is there anything the design should avoid?',
        type: 'long',
        optional: true,
        help: 'Optional: mention any unwanted styles, symbols or visual details here.',
      },
    ],
  },
  {
    title: 'Colours and logo use',
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
        when: {
          id: 'colour',
          values: ['Use existing colours', 'I have preferences'],
        },
      },
      {
        id: 'avoidedColours',
        label: 'Colours to avoid',
        type: 'text',
        help: 'Optional. Leave this blank if you have no colours to avoid.',
        optional: true,
      },
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
    title: 'References and inspiration',
    fields: [
      {
        id: 'references',
        label: 'Do you have reference logos or images?',
        type: 'single',
        options: ['Yes', 'No', 'Share a reference later'],
      },
      {
        id: 'images',
        label: 'Reference logos/images',
        type: 'images',
        when: {
          id: 'references',
          values: ['Yes'],
        },
        help: 'Choose up to five PNG, JPEG or WebP images, maximum 5 MB each. Images are resized in your browser for your PDF. Filenames and explanations are submitted; share the PDF with FinTaxTech to provide the images.',
        imageExplanationMin: 10,
        imageExplanationHelp:
          'For example: simplicity, typography, symbol shape, spacing, layout, colours, badge style or overall feel. We use references to understand your taste, not to copy another brand.',
      },
      {
        id: 'competitors',
        label: 'Competitors',
        type: 'competitors',
        optional: true,
        help: 'Optionally list up to five competitors. These details are for our later review; this form does not check their websites.',
      },
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
