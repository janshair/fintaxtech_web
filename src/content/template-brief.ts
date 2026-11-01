import { briefCopy, websiteDeliveryCopy, type BriefCopy } from './client-brief';
import { allTemplates } from './templates';
import { templateBriefSchemas } from './template-briefs';
import { ownWords, sampleChoice, useSample, whenOwn } from './template-briefs/shared';
import type { BriefField, BriefSection } from '../lib/client-brief/types';

const route = '/client/website-brief/templates/';
export const templateBriefCopy: BriefCopy = {
  ...briefCopy,
  shareHelp:
    'Download the .txt file for your records; it is the copy we build from. Download PDF also creates a readable copy. Email and WhatsApp open a blank message, where you can attach either file. If you change your answers, download them again.',
  downloaded:
    'Your PDF download has been requested. Slack delivery status is shown separately. The PDF itself has not been uploaded.',
  route,
  title: 'Template Website Brief',
  description:
    'Choose a FinTaxTech website template and enter the real details for your business. Review your answers, download them as a .txt file and send them to FinTaxTech.',
  intro:
    'Choose one of our website templates, then enter the real details for your business: services, prices, opening hours, contact details and reviews. We build your website from that template using your answers. Anything you are not ready to write can use the template’s sample for now.',
  privacy:
    'Answers stay in this page’s memory while you complete the brief. After review, Download .txt, Download PDF, Open email or Open WhatsApp sends the reviewed answers to FinTaxTech through Slack. The website does not save a resumable brief. Refreshing or closing clears your local answers; it does not delete information already delivered to Slack.',
  workflow:
    'After review, download your answers as a .txt file. We use it to build your website from the chosen template, then check the details with you before anything goes live. Your logo and photos are sent separately; nothing is uploaded here.',
  begin: 'Begin template brief',
  reviewTitle: 'Review your template brief',
  reviewIntro:
    'Check your details. Anything marked “Use the template’s sample for now” keeps the template’s wording until you send your own. Use a final action below when you are ready to send these reviewed answers.',
  disclaimer:
    'Only include details you are happy to publish. Reviews, qualifications and memberships must be real and yours to use. You approve the business details used on your website.',
  pdfFilename: 'FinTaxTech-template-brief.pdf',
  deliveryNotice:
    'Continuing with Download .txt, Download PDF, Open email or Open WhatsApp sends these reviewed answers to FinTaxTech through Slack. The downloads work independently of Slack delivery. Do not include passwords, access tokens, sensitive records or unnecessary personal information.',
};
export const templateTextCopy = {
  download: 'Download .txt',
  downloaded:
    'Your .txt download has been requested. Slack delivery status is shown separately. Keep the file: it is the copy we build your website from.',
  error: 'The .txt file could not be created. Your answers are still here. Please try again.',
};

// Picker options use the design name; the brief maps it back to the template id.
export const templateChoices = allTemplates.map((template) => ({
  ...template,
  available: !!templateBriefSchemas[template.id],
}));
export const templateByChoice = (name: unknown) =>
  templateChoices.find((template) => template.available && template.name === name);

const url = (id: string, label: string): BriefField => ({ id, label, type: 'url', optional: true });
const schemas = Object.values(templateBriefSchemas);
const reviewStars = ['5', '4', '3', '2', '1'];
export const reviewOptions = {
  yes: 'Yes, I have real reviews to add',
  no: 'Not yet — leave reviews out',
};
export const qualificationOptions = {
  yes: 'Yes, I’ll list them',
  no: 'No — leave this out',
};
export const fileOptions = {
  logo: 'Logo',
  gallery: 'Gallery / work photos (up to 6)',
  team: 'Team or portrait photos',
  premises: 'Premises photos',
  none: 'None for now',
} as const;

const choose: BriefSection = {
  title: 'Choose your template',
  fields: [
    {
      id: 'templateChoice',
      label: 'Which template should your website use?',
      type: 'single',
      prefill: 'template',
      options: templateChoices.filter((t) => t.available).map((t) => t.name),
      comingSoon: templateChoices.filter((t) => !t.available).map((t) => t.name),
      help: 'Templates marked Coming soon can’t be chosen here yet. Contact FinTaxTech if you’d like one of them.',
      examples: Object.fromEntries(
        templateChoices.map((t) => [
          t.name,
          { image: t.preview.src, alt: t.preview.alt, description: t.industry },
        ]),
      ),
    },
    // From the demo link, for FinTaxTech: never shown or asked.
    {
      id: 'ref',
      label: 'Reference',
      type: 'hidden',
      optional: true,
      prefill: 'ref',
      maxLength: 32,
      pattern: { source: '^[A-Za-z0-9_-]{1,32}$', message: '' },
    },
    {
      id: 'presetRole',
      label: 'Demo role',
      type: 'hidden',
      optional: true,
      prefill: 'role',
      maxLength: 60,
    },
    {
      id: 'presetType',
      label: 'Demo type',
      type: 'hidden',
      optional: true,
      prefill: 'type',
      maxLength: 60,
    },
  ],
};

const business: BriefSection = {
  title: 'Your business',
  fields: [
    {
      id: 'businessName',
      label: 'Business name',
      type: 'text',
      maxLength: 100,
      prefill: 'name',
      help: 'Exactly as it should appear on your website.',
    },
    {
      id: 'monogram',
      label: 'Short name or monogram',
      type: 'text',
      optional: true,
      maxLength: 3,
      pattern: { source: '^[\\p{L}\\p{N}]{2,3}$', message: 'Use 2 or 3 letters or numbers.' },
      help: '2 or 3 letters. Leave blank to use your initials.',
    },
    {
      id: 'businessArea',
      label: 'Town or area',
      type: 'text',
      maxLength: 60,
      prefill: 'area',
    },
    sampleChoice('heroSource', 'Headline under your name', 'One line about what you do.'),
    {
      id: 'heroLine',
      label: 'Your headline',
      type: 'text',
      maxLength: 120,
      when: whenOwn('heroSource'),
    },
    sampleChoice('introSource', 'Short introduction', 'A few sentences about your business.'),
    {
      id: 'intro',
      label: 'Your introduction',
      type: 'long',
      maxLength: 280,
      when: whenOwn('introSource'),
    },
  ],
};

const contact: BriefSection = {
  title: 'Contact details',
  fields: [
    {
      id: 'contactPhone',
      label: 'Phone number',
      type: 'phone',
      maxLength: 20,
      prefill: 'phone',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      type: 'single',
      options: ['Same as my phone number', 'A different number', 'No WhatsApp'],
    },
    {
      id: 'whatsappNumber',
      label: 'WhatsApp number',
      type: 'phone',
      maxLength: 20,
      when: { id: 'whatsapp', values: ['A different number'] },
    },
    { id: 'contactEmail', label: 'Email address', type: 'email' },
    {
      id: 'addressChoice',
      label: 'Address',
      type: 'single',
      options: ['Show my address', 'Service area only — no public address'],
    },
    {
      id: 'address',
      label: 'Your address',
      type: 'long',
      maxLength: 200,
      when: { id: 'addressChoice', values: ['Show my address'] },
    },
    {
      id: 'serviceArea',
      label: 'Towns or areas you serve',
      type: 'text',
      optional: true,
      maxLength: 120,
      help: 'For mobile or delivery businesses.',
    },
  ],
};

const hours: BriefSection = {
  title: 'Opening hours',
  fields: [
    sampleChoice('hoursSource', 'Opening hours'),
    {
      id: 'hours',
      label: 'Your opening hours',
      type: 'rows',
      when: whenOwn('hoursSource'),
      help: 'One line per day or group of days, like Monday – Friday. Up to 7 lines.',
      repeat: {
        title: (n) => `Hours line ${n}`,
        add: 'Add a line',
        remove: (n) => `Remove hours line ${n}`,
        max: 7,
        fields: [
          { key: 'days', label: 'Day or days', type: 'text', maxLength: 30 },
          {
            key: 'status',
            label: 'Open?',
            type: 'single',
            options: ['Open', 'Closed', 'By appointment'],
          },
          {
            key: 'times',
            label: 'Times, like 09:00 – 18:00',
            type: 'text',
            maxLength: 30,
            when: { id: 'status', values: ['Open'] },
          },
        ],
      },
    },
  ],
};

const online: BriefSection = {
  title: 'Online',
  fields: [
    url('instagram', 'Instagram'),
    url('facebook', 'Facebook'),
    url('tiktok', 'TikTok'),
    url('pinterest', 'Pinterest'),
    url('linkedin', 'LinkedIn'),
    {
      ...url('bookingLink', 'Booking or ordering link'),
      help: 'From Fresha, Booksy, Treatwell or a similar tool.',
      requiredWhen: schemas.flatMap((schema) => schema.bookingLinkWhen ?? []),
    },
    {
      id: 'googleProfile',
      label: 'Google Business Profile',
      type: 'single',
      options: ['I have one', 'I need one', 'Not sure'],
    },
    {
      ...url('googleProfileLink', 'Google Business Profile link'),
      when: { id: 'googleProfile', values: ['I have one'] },
    },
    {
      id: 'existingSite',
      label: 'Existing website or domain',
      type: 'text',
      optional: true,
      maxLength: 100,
      help: 'Like yourbusiness.co.uk, if you have one.',
    },
  ],
};

export const colourOptions = {
  template: 'Use the template’s colours',
  own: 'Choose my own colours',
};
export const logoOptions = {
  have: 'I have a logo and will send it',
  need: 'I need a logo',
  monogram: 'Use my monogram for now',
};
const brand: BriefSection = {
  title: 'Brand',
  fields: [
    {
      id: 'colours',
      label: 'Colours',
      type: 'single',
      options: Object.values(colourOptions),
    },
    {
      id: 'brandColour',
      label: 'Main colour',
      type: 'colour',
      when: { id: 'colours', values: [colourOptions.own] },
      help: 'Used for the header, buttons and headings.',
    },
    {
      id: 'accentColour',
      label: 'Accent colour',
      type: 'colour',
      when: { id: 'colours', values: [colourOptions.own] },
      help: 'Used for highlights and the main call to action. We check both colours are readable.',
    },
    { id: 'logo', label: 'Logo', type: 'single', options: Object.values(logoOptions) },
  ],
};

const proof: BriefSection = {
  title: 'Reviews and qualifications',
  fields: [
    {
      id: 'hasReviews',
      label: 'Customer reviews',
      type: 'single',
      options: Object.values(reviewOptions),
      help: 'Without real reviews, the reviews section is left out. Example reviews never go live.',
    },
    {
      id: 'reviews',
      label: 'Your reviews',
      type: 'rows',
      when: { id: 'hasReviews', values: [reviewOptions.yes] },
      repeat: {
        title: (n) => `Review ${n}`,
        add: 'Add a review',
        remove: (n) => `Remove review ${n}`,
        max: 6,
        fields: [
          {
            key: 'name',
            label: 'First name and initial, like Sam T.',
            type: 'text',
            maxLength: 40,
            pattern: {
              source: "^[\\p{L}][\\p{L}’'-]*(?: [\\p{L}][\\p{L}’'-]*)* [\\p{L}]\\.?$",
              message: 'Use a first name and initial, like Sam T.',
            },
          },
          { key: 'text', label: 'Review', type: 'long', maxLength: 300 },
          { key: 'stars', label: 'Star rating', type: 'single', options: reviewStars },
          { key: 'source', label: 'Where it was posted, like Google', type: 'text', maxLength: 40 },
        ],
      },
    },
    {
      id: 'reviewPermission',
      label: 'Permission',
      type: 'confirm',
      when: { id: 'hasReviews', values: [reviewOptions.yes] },
      confirmText: 'I have permission to use these reviews on my website.',
    },
    {
      id: 'hasQualifications',
      label: 'Qualifications, memberships or insurance',
      type: 'single',
      options: Object.values(qualificationOptions),
      help: 'Only list what you actually hold.',
    },
    {
      id: 'qualifications',
      label: 'What you hold',
      type: 'rows',
      when: { id: 'hasQualifications', values: [qualificationOptions.yes] },
      repeat: {
        title: (n) => `Qualification ${n}`,
        add: 'Add a qualification',
        remove: (n) => `Remove qualification ${n}`,
        max: 6,
        fields: [
          { key: 'name', label: 'Name, like NVQ Level 2 Barbering', type: 'text', maxLength: 80 },
          {
            key: 'detail',
            label: 'Awarding body or year (optional)',
            type: 'text',
            maxLength: 80,
            optional: true,
          },
        ],
      },
    },
  ],
};

const files: BriefSection = {
  title: 'Files you will send',
  fields: [
    {
      id: 'files',
      label: 'Which files will you send us?',
      type: 'multi',
      options: Object.values(fileOptions),
      exclusive: [fileOptions.none],
      help: 'Send them by email or WhatsApp after this brief. Nothing is uploaded here.',
    },
  ],
};

const confirm: BriefSection = {
  title: 'Confirm',
  fields: [
    {
      id: 'approve',
      label: 'Approval',
      type: 'confirm',
      confirmText: 'These details are accurate and I approve them for my website.',
    },
  ],
};

// Template sections show only when that template is chosen.
const templateSections = schemas.flatMap((schema) =>
  schema.sections.map((section) => ({
    ...section,
    when: {
      id: 'templateChoice',
      values: [templateChoices.find((t) => t.id === schema.id)!.name],
    },
  })),
);
export const templateBriefSections: BriefSection[] = [
  choose,
  business,
  ...templateSections,
  contact,
  hours,
  online,
  brand,
  proof,
  files,
  confirm,
];
export { ownWords, useSample };
