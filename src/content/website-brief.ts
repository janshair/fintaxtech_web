import { briefCopy, websiteDeliveryCopy, type BriefCopy } from './client-brief';
import { logoBriefCopy } from './logo-brief';
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

export const websiteBriefCopy: BriefCopy = {
  ...briefCopy,
  downloaded: websiteDeliveryCopy.downloaded,
  shareHelp: websiteDeliveryCopy.shareHelp,
  route: '/client/website-brief/',
  title: 'Website Production Brief',
  description:
    'Prepare your post-payment website production brief, review your requirements, send the reviewed text to FinTaxTech through Slack and download your PDF.',
  intro:
    'Complete this brief after FinTaxTech has confirmed your advance payment. It records the production details for your new website or complete redesign; it is not a quote request.',
  privacy: websiteDeliveryCopy.privacy,
  workflow:
    'A final review action sends the reviewed text to FinTaxTech through Slack; the PDF is downloaded separately. FinTaxTech reviews your details against the agreed proposal. Accounts, online payments and complex booking require scope review and are not automatically included. Production follows agreed scope and payment; deployment requires your authorization. Submission does not verify payment or approval. Confirm existing proposal details only where useful.',
  begin: 'Begin website brief',
  reviewTitle: 'Review your website brief',
  reviewIntro:
    'Check your page list and production details. Only applicable answers appear in the PDF and Slack submission. Use a final action below when you are ready to send these reviewed answers.',
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
        ...tradingNameField,
        label: 'Business name',
        optional: true,
        help: 'Confirm the customer-facing name if needed. You can leave proposal details blank when they are already correct.',
      },
      { id: 'sector', label: 'Business sector', type: 'text', optional: true },
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
        label: 'Primary website goal',
        type: 'single',
        help: 'Choose one main outcome.',
        options: websiteGoalOptions,
      },
      {
        id: 'secondaryGoals',
        label: 'Secondary website goals',
        type: 'multi',
        optional: true,
        max: 2,
        help: 'Optionally choose up to two supporting outcomes.',
        options: websiteGoalOptions,
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
      {
        id: 'customerProblem',
        label: 'Primary customer and the problem you solve',
        type: 'long',
        optional: true,
        help: 'Add any detail needed beyond the agreed proposal.',
      },
      priorityOfferingsField,
      {
        id: 'differentiators',
        label: 'What makes the business different?',
        type: 'long',
        optional: true,
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
        label: 'Pages essential for launch',
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
        help: 'Confirm launch pages from the agreed scope, add additional launch pages below, or both. Selection does not expand the agreed scope; extra pages must be agreed separately.',
      },
      {
        id: 'additionalPages',
        label: 'Additional pages essential for launch',
        type: 'pages',
        optional: true,
        help: 'Add up to 10 launch pages, such as Careers or Press. Each needs a unique name; its purpose is optional. Additional work must be agreed separately.',
      },
      {
        id: 'laterPages',
        label: 'Pages for later additions',
        type: 'long',
        optional: true,
        help: 'List any future pages separately. This does not add them to the launch scope or commission later work.',
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
        options: visitorActionOptions,
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
        help: 'Choose one approach for the whole website. Content work remains subject to the agreed proposal. You approve the business facts and claims in the final copy.',
      },
      {
        id: 'sourceMaterial',
        label: 'Source material available for copywriting',
        type: 'long',
        optional: true,
        when: {
          id: 'content',
          values: ['FinTaxTech creates all copy from agreed source material'],
        },
        help: 'Describe approved brochures, service details, verified facts or other material you can share manually. Avoid sensitive records. You approve business facts and claims; copywriting remains subject to the proposal.',
      },
    ],
  },
  {
    title: 'Your design direction',
    fields: [referenceWebsitesField, ...designPreferenceFields],
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
      {
        id: 'assetNotes',
        label: 'Brand guidance and available asset details',
        type: 'long',
        optional: true,
        help: 'Describe existing logo files, brand colours, fonts and photos. Share files manually. Branding or asset creation is included only if separately agreed.',
      },
      {
        id: 'assetPermission',
        label: 'Do you have permission to use the supplied assets on this website?',
        type: 'single',
        optional: true,
        when: {
          id: 'assets',
          values: ['Logo/brand guidelines', 'Photos', 'Videos', 'Illustrations'],
        },
        options: ['Yes, for website use', 'Some assets need permission', 'Not sure'],
        help: 'Confirm ownership or the appropriate licence for website use. Public availability alone does not grant reuse rights.',
        followUp: {
          values: ['Some assets need permission', 'Not sure'],
          text: 'Confirm usage permission before the affected assets are used.',
          pdfNote: 'Confirm usage permission before the affected assets are used.',
        },
      },
    ],
  },
  {
    title: 'Website capabilities',
    fields: [
      {
        id: 'capabilities',
        label: 'Features essential for launch',
        type: 'multi',
        options: [
          'Enquiry form',
          'Blog',
          'Search',
          'Booking integration',
          'Custom booking functionality',
          'Newsletter integration',
          'Product catalogue',
          'Online payments',
          'Multiple languages',
          'None',
          'Other',
        ],
        exclusive: ['None'],
        help: `Confirm launch features against the proposal. A product catalogue displays products; checkout and online payments are separate. Booking integration connects a third-party provider; custom booking is separate functionality. ${scopeNote}`,
        followUp: {
          values: [
            'Online payments',
            'Booking integration',
            'Custom booking functionality',
            'Other',
          ],
          text: scopeNote,
          pdfNote: scopeNote,
        },
      },
      {
        id: 'catalogueBehaviour',
        label: 'Product catalogue behaviour',
        type: 'long',
        optional: true,
        when: { id: 'capabilities', values: ['Product catalogue'] },
        help: 'Describe product information, categories, prices and enquiry links. Catalogue selection does not include checkout or payment processing.',
      },
      {
        id: 'paymentProvider',
        label: 'Checkout or payment provider',
        type: 'text',
        optional: true,
        when: { id: 'capabilities', values: ['Online payments'] },
        help: 'For example, Stripe, PayPal or an existing shop platform. Provider name only; no credentials or payment data.',
      },
      {
        id: 'paymentBehaviour',
        label: 'Intended checkout and payment behaviour',
        type: 'long',
        optional: true,
        when: { id: 'capabilities', values: ['Online payments'] },
        help: 'For example, a hosted payment link or a cart and checkout. Confirm what is already agreed; selection does not include new transaction functionality.',
      },
      {
        id: 'bookingProvider',
        label: 'Third-party booking provider',
        type: 'text',
        optional: true,
        when: { id: 'capabilities', values: ['Booking integration'] },
        help: 'For example, Calendly or your existing booking service. Provider name only; no credentials.',
      },
      {
        id: 'bookingBehaviour',
        label: 'Intended booking integration behaviour',
        type: 'long',
        optional: true,
        when: { id: 'capabilities', values: ['Booking integration'] },
        help: 'For example, link to the provider or embed its booking widget. Custom scheduling is separately agreed.',
      },
      {
        id: 'customBookingBehaviour',
        label: 'Intended custom booking behaviour',
        type: 'long',
        optional: true,
        when: { id: 'capabilities', values: ['Custom booking functionality'] },
        help: 'Describe availability, confirmation, cancellation and staff needs already agreed. Custom booking requires scope review.',
      },
      {
        id: 'languageRequirements',
        label: 'Languages and translation requirements',
        type: 'long',
        optional: true,
        when: { id: 'capabilities', values: ['Multiple languages'] },
        help: 'List languages, the default language, who supplies and approves translations, and any language-switching needs. Translation work must be within the agreed scope.',
      },
      {
        id: 'laterFeatures',
        label: 'Features for later additions',
        type: 'long',
        optional: true,
        help: 'Keep future capabilities separate from launch essentials. Later work and any additional scope must be agreed separately.',
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
      {
        id: 'updateNeeds',
        label: 'Content-update needs',
        type: 'long',
        optional: true,
        when: {
          id: 'updates',
          values: ['Customer', 'FinTaxTech through separately agreed changes'],
        },
        help: 'Describe what changes, how often and who will edit it. A CMS, training or maintenance is included only where agreed.',
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
        id: 'domainName',
        label: 'Actual or intended domain name',
        type: 'text',
        optional: true,
        when: { id: 'domain', values: ['Already owned', 'Not yet purchased'] },
        help: 'For example, example.co.uk. Enter the domain itself, separately from its provider; availability is not checked here.',
      },
      {
        id: 'domainProvider',
        label: 'Domain provider',
        type: 'text',
        when: { id: 'domain', values: ['Already owned'] },
        help: 'Provider name only. Do not enter account credentials.',
      },
      {
        id: 'hostingOwner',
        label: 'Who owns or manages the hosting account?',
        type: 'single',
        optional: true,
        when: { id: 'domain', values: ['Already owned', 'Not yet purchased'] },
        options: ['Customer account', 'FinTaxTech manages hosting as agreed', 'Not sure', 'Other'],
        help: 'Confirm responsibility where needed for launch. Hosting arrangements remain subject to the proposal. Do not provide credentials.',
      },
      {
        id: 'hostingProvider',
        label: 'Hosting provider, if known',
        type: 'text',
        optional: true,
        when: { id: 'domain', values: ['Already owned', 'Not yet purchased'] },
        help: 'Provider name only. Access is arranged separately; do not enter credentials.',
      },
      {
        id: 'dnsOwner',
        label: 'Who controls DNS and can authorize domain changes?',
        type: 'text',
        optional: true,
        when: { id: 'domain', values: ['Already owned'] },
        help: 'Give the responsible person or organisation. Access and deployment authorization are arranged separately; no passwords or access tokens.',
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
        help: 'For example, Google Workspace or Microsoft 365. Provider name only, separately from your email address. Do not enter account credentials.',
      },
      {
        id: 'businessEmailAddress',
        label: 'Business email address',
        type: 'email',
        optional: true,
        when: { id: 'email', values: ['Already owned'] },
        help: 'For example, hello@example.co.uk. Confirm the public contact address if needed; the provider is recorded separately.',
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
      {
        id: 'existingURLs',
        label: 'Important existing URLs to preserve or redirect',
        type: 'urls',
        optional: true,
        when: redesign,
        help: 'Enter one complete http:// or https:// URL per line, including important pages and campaign links.',
      },
      {
        id: 'redirectNotes',
        label: 'Preservation and redirect instructions',
        type: 'long',
        optional: true,
        when: redesign,
        help: 'Explain which URLs should stay and any agreed redirect destinations. Redirect work remains subject to the proposal.',
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
      {
        id: 'launchRequirements',
        label: 'Agreed launch requirements to confirm',
        type: 'long',
        optional: true,
        help: 'Confirm any agreed launch date, approvals, dependencies or acceptance requirements that need attention. There is no need to repeat correct proposal details. Deployment requires your authorization.',
      },
      {
        ...approverNameField,
        label: 'Final approval contact name',
        optional: true,
        help: 'Confirm who signs off the completed website if needed. A group should nominate one contact for a consolidated decision.',
      },
      { ...approvalEmailField, label: 'Final approval contact email' },
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
