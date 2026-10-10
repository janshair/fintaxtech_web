import { briefCopy, websiteDeliveryCopy, type BriefCopy } from './client-brief';
import {
  tradingNameField,
  approverNameField,
  approvalEmailField,
  websiteGoalOptions,
  visitorActionOptions,
  priorityOfferingsField,
  referenceWebsitesField,
  designPreferenceFields,
} from './client-brief-fields';
import type { BriefSection } from '../lib/client-brief/types';

export const websiteDemoBriefCopy: BriefCopy = {
  ...briefCopy,
  downloaded: websiteDeliveryCopy.downloaded,
  shareHelp: websiteDeliveryCopy.shareHelp,
  route: '/client/website-demo-brief/',
  title: 'Free Website Demo Brief',
  description:
    'Describe your business and references for a free website demo. Review your answers, send the reviewed text to FinTaxTech through Slack and download your PDF.',
  intro:
    'Tell us about your business and the websites you like. This short brief establishes the design direction for your free website demo. It does not include a full production website, live transactions or deployment unless separately agreed.',
  privacy: websiteDeliveryCopy.privacy,
  workflow:
    'A final review action sends the reviewed text to FinTaxTech through Slack; Download PDF also creates your local copy. If you approve the demo, we agree the full website scope and payment, complete production, and deploy only with your authorization. Submission itself does not verify payment or approval. Describe assets here and share files manually; no uploads are required.',
  begin: 'Begin demo brief',
  reviewTitle: 'Review your demo brief',
  reviewIntro:
    'Check your business information, references and design direction. Only applicable answers appear in the PDF and Slack submission. Use a final action below when you are ready to send these reviewed answers.',
  disclaimer:
    'The free demo establishes design direction. It does not include a full production website, live transactions or deployment unless separately agreed. You approve the business facts and claims used in the demo.',
  pdfFilename: 'FinTaxTech-free-website-demo-brief.pdf',
};

export const websiteDemoBriefSections: BriefSection[] = [
  {
    title: 'Your business',
    fields: [
      { ...tradingNameField, label: 'Business name' },
      { id: 'sector', label: 'Business sector', type: 'text' },
      {
        id: 'prioritySource',
        label: 'How should we choose the priority services or products?',
        type: 'single',
        options: ['I will list up to three', 'Help me choose from my existing website'],
        help: 'Details taken from your website are provisional until you approve them. This form does not fetch or extract website content.',
      },
      {
        id: 'existingURL',
        label: 'Existing website URL, if any',
        type: 'url',
        optional: true,
        requiredWhen: { id: 'prioritySource', values: ['Help me choose from my existing website'] },
        help: 'Use the full address, including https://. Required if you want help choosing services from your website.',
      },
      {
        id: 'serviceArea',
        label: 'Service area — towns or regions',
        type: 'long',
        help: 'Enter towns or postcode areas, for example Richmond, Twickenham, TW1–TW20. Do not paste code. Ordinary pasted lists are welcome; use the postcode field below if helpful.',
      },
      {
        id: 'postcodeAreas',
        label: 'Postcode areas',
        type: 'long',
        optional: true,
        help: 'Optional, for example TW1–TW20. Paste an ordinary list; include only areas you actually cover.',
      },
    ],
  },
  {
    title: 'Customers and website focus',
    fields: [
      {
        id: 'primaryCustomers',
        label: 'Who are your main customers?',
        type: 'multi',
        options: ['Homeowners', 'Tenants', 'Landlords', 'Businesses', 'Other'],
      },
      {
        id: 'customerProblem',
        label: 'What problem do customers need your help with?',
        type: 'long',
        help: 'For example, “Customers need help fixing leaking taps or arranging reliable property repairs.” A short sentence is enough.',
      },
      {
        id: 'goals',
        label: 'Primary website goal',
        type: 'single',
        options: websiteGoalOptions,
      },
      {
        id: 'action',
        label: 'Primary visitor action',
        type: 'single',
        options: visitorActionOptions,
      },
      {
        id: 'demoBooking',
        label: 'What should booking look like in the demo?',
        type: 'single',
        when: [
          { id: 'goals', values: ['Bookings'] },
          { id: 'action', values: ['Book'] },
        ],
        options: [
          'Appointment enquiry / request',
          'Link to an existing booking service',
          'Illustrative booking flow',
        ],
        help: 'Live booking functionality requires separately agreed production scope. An illustrative flow is a labelled demonstration, not a working booking system.',
      },
      {
        id: 'bookingURL',
        label: 'Existing booking service URL',
        type: 'url',
        when: { id: 'demoBooking', values: ['Link to an existing booking service'] },
        help: 'Use the full http:// or https:// address. The demo will show the intended link; a live integration is separately agreed.',
      },
      {
        ...priorityOfferingsField,
        optional: false,
        when: { id: 'prioritySource', values: ['I will list up to three'] },
      },
      {
        id: 'differentiators',
        label: 'What makes your business different?',
        type: 'text',
        optional: true,
        help: 'If unsure, enter “Not sure”. Only include differences you can support; do not invent claims.',
      },
    ],
  },
  {
    title: 'References and design direction',
    fields: [
      {
        ...referenceWebsitesField,
        optional: false,
        repeat: {
          ...referenceWebsitesField.repeat!,
          fields: [
            ...referenceWebsitesField.repeat!.fields,
            {
              key: 'pricingFocus',
              label: 'What appeals to you about the pricing?',
              type: 'single',
              when: { id: 'explanation', matches: '\\bpric(?:e|es|ing)\\b' },
              options: [
                'Visible prices',
                'Price-card layout',
                'Clarity of charges',
                'Another reason',
              ],
            },
            {
              key: 'pricingReason',
              label: 'Other pricing preference',
              type: 'text',
              when: { id: 'pricingFocus', values: ['Another reason'] },
            },
          ],
        },
      },
      ...designPreferenceFields.map((field) =>
        field.id === 'designPreferences'
          ? { ...field, help: `${field.help} You can say “No preference” or “Please suggest”.` }
          : field,
      ),
      {
        id: 'pricingDirection',
        label: 'How should the demo present your charges?',
        type: 'single',
        options: [
          'I have approved prices to supply',
          'Request a quote',
          'Clearly labelled provisional content',
        ],
        help: 'We will not copy competitor prices or imply they apply to your business. Provisional content is illustrative and needs your approval before production.',
      },
      {
        id: 'approvedPrices',
        label: 'Approved prices or source material',
        type: 'long',
        optional: true,
        when: { id: 'pricingDirection', values: ['I have approved prices to supply'] },
        help: 'Supply approved prices or describe material you will share manually. Leave blank if you will send it later.',
      },
    ],
  },
  {
    title: 'Homepage content and assets',
    fields: [
      {
        id: 'assets',
        label: 'Which assets are available?',
        type: 'multi',
        options: ['Logo', 'Brand guidance', 'Photos', 'None', 'Not sure'],
        exclusive: ['None', 'Not sure'],
        help: 'Choose what you can share manually. No uploads are needed here.',
      },
      {
        id: 'assetNotes',
        label: 'Asset descriptions and brand guidance',
        type: 'long',
        optional: true,
        help: 'Describe what you have, or say None. Share files manually after this brief; only supply assets you have permission to use.',
      },
      {
        id: 'provisionalAssets',
        label: 'May we use provisional styling and placeholder imagery in the demo?',
        type: 'single',
        options: [
          'Both are acceptable',
          'Provisional styling only',
          'Placeholder imagery only',
          'Neither',
          'Please ask me first',
        ],
        help: 'This is permission for the demo direction only; branding work is separately agreed.',
      },
      {
        id: 'homepageSections',
        label: 'Essential homepage sections',
        type: 'text',
        optional: true,
        help: 'For example, introduction, priority services, about the team, approved testimonials and contact details. You can say “Please suggest”.',
      },
      {
        id: 'verifiedFacts',
        label: 'Verified business facts available for copy',
        type: 'long',
        optional: true,
        help: 'For example, services, opening hours, experience or qualifications you can verify. Describe source material you can share manually. You approve business facts and claims before they are used.',
      },
    ],
  },
  {
    title: 'Demo approval',
    fields: [
      {
        ...approverNameField,
        label: 'Who approves the demo?',
        help: 'Give the person’s name. For a group, nominate one contact for a consolidated decision.',
      },
      approvalEmailField,
      {
        id: 'success',
        label: 'What would make this demo successful?',
        type: 'text',
        help: 'For example, “Visitors can quickly find services, understand charges, and request an appointment.” A short answer is enough.',
      },
      {
        id: 'reviewDeadline',
        label: 'Preferred demo review deadline',
        type: 'date',
        optional: true,
        help: 'Optional preference; the review date is confirmed separately.',
      },
    ],
  },
];
