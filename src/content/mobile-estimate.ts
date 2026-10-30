import data from './mobile-estimate/services.json' with { type: 'json' };
import { servicesSchema } from '../lib/mobile-estimate/schema';
export const mobileServices = servicesSchema.parse(data);
export const mobileEstimateCopy = {
  route: '/estimate/mobile/',
  title: 'Mobile App Development Estimate',
  description:
    'Describe your mobile app in five straightforward steps, review your requirements and see an itemised, non-binding development estimate.',
  intro:
    'Choose what your app needs. Answer five short sections, review your requirements, then view an indicative estimate. No prices are shown until you confirm.',
  privacy:
    'Your answers and contact details stay in this tab. Refreshing or closing clears them. Nothing is sent automatically. Do not enter credentials, payment details or real customer records.',
  privacyLink: 'Read our privacy policy',
  begin: 'Prepare my mobile app estimate',
  noScript: 'Enable JavaScript to prepare an estimate, or contact FinTaxTech to discuss your app.',
  contact: 'Discuss your project',
  back: 'Back',
  next: 'Continue',
  edit: 'Edit',
  progress: (n: number) => `Step ${n} of 5`,
  review: 'Review your app requirements',
  reviewIntro:
    'Check each section before confirming. Your estimate will be provisional and will need technical review.',
  details: 'Your details',
  name: 'Full name',
  business: 'Business name (optional)',
  email: 'Email address',
  phone: 'Phone number (optional)',
  consent:
    'I understand this is a non-binding indicative estimate and nothing is sent automatically.',
  errorRequired: 'Please answer this question.',
  errorInvalid: 'Please check this answer.',
  errorLength:
    'Please use no more than 5,000 characters and remove unsupported control characters.',
  errorContact: 'Enter your full name and a valid email address. Check your optional phone number.',
  errorConsent: 'Please confirm that you understand how this estimate works.',
  errorGenerate:
    'We could not prepare your estimate. Your answers are still here. Please try again, or contact FinTaxTech.',
  busy: 'Preparing your estimate…',
  resultTitle: 'Your indicative mobile app estimate',
  nonBinding:
    'Non-binding indicative estimate. A fixed-price quotation requires FinTaxTech technical review and approval. This is not an order or a payment request.',
  reference: 'Estimate reference',
  issued: 'Prepared on',
  oneTime: 'One-time development',
  monthly: 'Monthly recurring',
  subtotal: 'Known one-time charges before any applicable VAT',
  monthlySubtotal: 'Monthly maintenance before any applicable VAT',
  pending: 'Pending — excluded',
  manual: 'Manual quotation — excluded',
  included: 'Included',
  provisional: 'Provisional',
  from: (value: string) => `From ${value}`,
  perMonth: (value: string) => `${value}/month`,
  pendingTitle: 'Pending decisions and scope',
  pendingNote:
    'Unpriced items are excluded from these figures. These are known charges, not a complete fixed-price quotation.',
  lowerBound:
    'This estimate contains starting allowances. The total is a lower bound and may increase after assessment.',
  reviewNeeded: 'Needs review',
  assumptions: 'Scope assumptions',
  exclusions: 'Exclusions',
  backendNote:
    'The proposed backend supports shared data and app workflows. Its suitability and scope require technical review.',
  otherPending: 'Your written requirements need separate scope and price assessment.',
  integrationPending: 'Connections to existing systems have not been assessed.',
  noneWritten: 'No other requirements entered',
  noFeatures: 'No features selected — scope to be confirmed',
  vat: 'VAT treatment',
  vatUnregistered: 'VAT has not been added: verified as not VAT registered.',
  vatNontaxable: 'VAT has not been added under the verified transaction treatment.',
  vatApplied: (rate: number) => `VAT applied at the verified rate of ${rate}%.`,
  oneTax: 'One-time VAT',
  monthlyTax: 'Monthly VAT',
  oneIncluding: 'Known one-time charges including VAT',
  monthlyIncluding: 'Monthly maintenance including VAT',
  conditions: [
    'Hosting, storage usage, developer accounts, provider licences, transaction fees and AI usage costs are excluded unless separately agreed.',
    'Feature packages, screens, backend and management workflows require a scope check for overlap. No automatic discounts or extra fees have been applied.',
    'Standard QA is included. Other testing packages require an authorised technical review.',
    'Maintenance response times are initial response targets, not resolution guarantees. Contract terms and store review apply.',
  ],
  download: 'Download indicative estimate',
  downloadError:
    'The PDF could not be created. Your estimate is still available. Try again, or contact FinTaxTech if your text uses characters the document cannot display.',
  pdfTitle: 'Mobile App Indicative Estimate',
  pdfFilename: 'FinTaxTech-mobile-app-estimate',
  versions: 'Calculation versions',
  approvalUnavailable:
    'Fixed-price approval, adjustments and issuance require authenticated server-side review and persistent audit storage. They are disabled here.',
  status: {
    draft: 'Draft',
    indicative: 'Indicative',
    needs_review: 'Needs review',
    approved: 'Approved',
    issued: 'Issued',
  },
};
