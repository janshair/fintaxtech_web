import { briefCopy, type BriefCopy } from './client-brief';
import { logoBriefCopy } from './logo-brief';
import type { BriefSection } from '../lib/client-brief/types';

export const websiteBriefCopy: BriefCopy = {
  ...briefCopy,
  route: '/client/website-brief/',
  title: 'Website Production Brief',
  description:
    'Prepare your post-payment website production brief locally, review your requirements and download a PDF to share manually with FinTaxTech.',
  intro:
    'Complete this brief after FinTaxTech has confirmed your advance payment. It records the production details for your new website or complete redesign; it is not a quote request.',
  privacy:
    'Your answers stay in this page’s memory. Nothing is sent automatically or saved by this website. Refreshing or closing the page clears your answers. Download your PDF before leaving.',
  workflow:
    'FinTaxTech will review the PDF you choose to share against your agreed proposal. Accounts, online payments and complex booking require scope review and are not automatically included.',
  begin: 'Begin website brief',
  reviewTitle: 'Review your website brief',
  reviewIntro:
    'Check your page list and production details. Only applicable answers will appear in the PDF. Nothing has been sent.',
  disclaimer:
    'These answers are subject to the agreed proposal and do not automatically change scope or price. Any additional work must be agreed separately.',
  pdfFilename: 'FinTaxTech-website-production-brief.pdf',
};

const scopeNote =
  'Accounts, online payments and complex booking require scope review. Selecting a capability does not mean it is included in the agreed proposal.';
const redesign = { id: 'project', values: ['Complete redesign'] };
export const websiteBriefSections: BriefSection[] = [
  {
    title: 'Your website project',
    fields: [
      {
        id: 'project',
        label: 'Project',
        type: 'single',
        options: ['New website', 'Complete redesign'],
        help: 'We create new websites and complete redesigns. Partial repairs and legacy-code fixes are outside this brief.',
      },
      {
        id: 'existingURL',
        label: 'Existing website URL',
        type: 'url',
        when: redesign,
        help: 'Use the full address, including https://. This form does not check the website.',
      },
    ],
  },
  {
    title: 'Your main goals',
    fields: [
      {
        id: 'goals',
        label: 'Main goal',
        type: 'multi',
        max: 2,
        help: 'Choose up to two.',
        options: [
          'Enquiries',
          'Explain services',
          'Sell products',
          'Bookings',
          'Publish information',
          'Credibility',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Your audience',
    fields: [
      {
        id: 'audience',
        label: 'Audience',
        type: 'multi',
        options: [
          'Consumers',
          'Businesses',
          'Professionals',
          'Public sector',
          'Charities',
          'Existing customers',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Where your customers are',
    fields: [
      {
        id: 'location',
        label: 'Customer location',
        type: 'multi',
        options: ['Local', 'One country', 'International'],
      },
      {
        id: 'localPlaces',
        label: 'Local towns, cities or areas',
        type: 'text',
        when: { id: 'location', values: ['Local'] },
      },
      {
        id: 'country',
        label: 'Country',
        type: 'text',
        when: { id: 'location', values: ['One country'] },
      },
      {
        id: 'internationalPlaces',
        label: 'International countries or regions',
        type: 'text',
        when: { id: 'location', values: ['International'] },
        help: 'List the markets you serve, or write Worldwide if there is no specific region.',
      },
    ],
  },
  {
    title: 'Your website pages',
    fields: [
      {
        id: 'pages',
        label: 'Pages',
        type: 'multi',
        optional: true,
        options: [
          'Home',
          'About',
          'Services',
          'Individual service pages',
          'Contact',
          'Blog',
          'FAQ',
          'Portfolio/work',
          'Pricing',
          'Policies',
        ],
        help: 'Choose the pages you need, add additional pages below, or both.',
      },
      {
        id: 'additionalPages',
        label: 'Additional pages',
        type: 'pages',
        optional: true,
        help: 'Add up to 10 pages, such as Careers or Press. Each added page needs a unique name; its purpose is optional.',
      },
    ],
  },
  {
    title: 'What visitors should do',
    fields: [
      {
        id: 'action',
        label: 'Primary visitor action',
        type: 'single',
        options: ['Enquire', 'Call', 'Email', 'Book', 'Buy', 'Download', 'Other'],
      },
    ],
  },
  {
    title: 'Your written content',
    fields: [
      {
        id: 'content',
        label: 'Written content',
        type: 'single',
        options: [
          'Customer provides all final copy',
          'FinTaxTech creates all copy from agreed source material',
        ],
        help: 'Choose one approach for the whole website. Content work remains subject to the agreed proposal.',
      },
    ],
  },
  {
    title: 'Your visual assets',
    fields: [
      {
        id: 'assets',
        label: 'Available visual assets',
        type: 'multi',
        options: ['Logo/brand guidelines', 'Photos', 'Videos', 'Illustrations', 'None'],
        exclusive: ['None'],
        help: 'Choose all that apply, or None on its own.',
        followUp: {
          values: ['None'],
          text: 'You may open the separate logo brief in a new tab and keep this website brief open. Completing it does not add branding to your scope; any branding work must be agreed separately.',
          link: { label: 'Open the separate logo brief in a new tab', href: logoBriefCopy.route },
        },
      },
    ],
  },
  {
    title: 'Website capabilities',
    fields: [
      {
        id: 'capabilities',
        label: 'Capabilities',
        type: 'multi',
        options: [
          'Enquiry form',
          'Blog',
          'Search',
          'Booking integration',
          'Newsletter integration',
          'Product catalogue',
          'Online payments',
          'Multiple languages',
          'None',
          'Other',
        ],
        exclusive: ['None'],
        help: scopeNote,
        followUp: {
          values: ['Online payments', 'Booking integration', 'Other'],
          text: scopeNote,
          pdfNote: scopeNote,
        },
      },
    ],
  },
  {
    title: 'After launch',
    fields: [
      {
        id: 'updates',
        label: 'Post-launch updates',
        type: 'single',
        options: ['Customer', 'FinTaxTech through separately agreed changes', 'Not sure'],
      },
    ],
  },
  {
    title: 'Your domain and business email',
    fields: [
      {
        id: 'domain',
        label: 'Domain status',
        type: 'single',
        options: ['Already owned', 'Not yet purchased', 'Not needed'],
        help: 'Domain purchase, renewal and provider costs remain your responsibility. FinTaxTech does not pay these costs.',
      },
      {
        id: 'domainProvider',
        label: 'Domain provider',
        type: 'text',
        when: { id: 'domain', values: ['Already owned'] },
        help: 'Provider name only. Do not enter account credentials.',
      },
      {
        id: 'email',
        label: 'Business email status',
        type: 'single',
        options: ['Already owned', 'Not yet purchased', 'Not needed'],
        help: 'Business email subscriptions and provider costs remain your responsibility. FinTaxTech does not pay these costs.',
      },
      {
        id: 'emailProvider',
        label: 'Business email provider',
        type: 'text',
        when: { id: 'email', values: ['Already owned'] },
        help: 'Provider name only. Do not enter account credentials.',
      },
    ],
  },
  {
    title: 'What to retain from your existing website',
    when: redesign,
    fields: [
      {
        id: 'retain',
        label: 'Retain from the existing website',
        type: 'multi',
        when: redesign,
        options: ['Retain existing content', 'Images', 'Domain', 'Nothing—start again'],
        exclusive: ['Nothing—start again'],
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
