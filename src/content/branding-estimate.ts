import definitions from './branding-estimate/services.json' with { type: 'json' };
import type { EstimateQuestion } from '../lib/branding-estimate/types';
export const estimateQuestions = (definitions as EstimateQuestion[])
  .slice()
  .sort((a, b) => a.order - b.order);
export const brandingEstimateCopy = {
  route: '/estimate/branding/',
  title: 'Branding Estimate Questionnaire',
  description:
    'Choose your branding requirements and generate an itemised, indicative PDF estimate privately in your browser.',
  intro:
    'Tell us which branding services you need. Review your requirements, then generate your estimate. Prices appear only after you submit.',
  privacy:
    'Your answers and contact details stay in this browser tab. Refreshing or closing clears them. Nothing is sent automatically. Your downloaded PDF includes your contact details; share it only when you choose.',
  privacyLink: 'Read our privacy policy',
  begin: 'Prepare my estimate',
  noScript:
    'Enable JavaScript to prepare an estimate, or contact FinTaxTech to discuss your requirements.',
  contactLink: 'Discuss your requirements',
  previous: 'Previous',
  next: 'Continue',
  edit: 'Edit',
  remove: 'Remove item',
  progress: (current: number, total: number) => `Step ${current} of ${total}`,
  review: 'Review your requirements',
  reviewHelp:
    'Check your choices and add your contact details for the PDF. You can edit any answer before generating your estimate.',
  customerHeading: 'Your details',
  customer: {
    name: 'Customer name',
    business: 'Business name (optional)',
    email: 'Email address',
    phone: 'Phone number (optional)',
  },
  consent:
    'I understand this is an indicative estimate, subject to scope confirmation, and that nothing will be sent automatically.',
  submit: 'Generate my estimate',
  busy: 'Preparing your PDF…',
  thanks: 'Thank you. Your branding estimate is ready.',
  ready:
    'Download your estimate and share it with FinTaxTech when you are ready to discuss the scope. It has not been emailed or submitted to us.',
  download: 'Download PDF Estimate',
  revise: 'Revise requirements',
  reference: 'Estimate reference',
  issued: 'Date of issue',
  documentTitle: 'Branding Project Estimate',
  indicative:
    'Indicative estimate only. Prices and suitability are subject to final scope confirmation and an agreed written proposal.',
  manual: 'Manual review required',
  incomplete:
    'Some requirements are unpriced. The figures below cover priced items only, not a complete project total.',
  reviewNote:
    'Custom items use the category pricing shown, subject to a scope review. The final scope and price must be agreed before work begins.',
  scopeReason: (question: string) => `${question} Custom requirements need scope confirmation.`,
  subtotal: 'Subtotal (excluding VAT)',
  vat: (rate: number) => `VAT (${rate}%)`,
  total: 'Estimated total (including VAT)',
  knownSubtotal: 'Priced items subtotal (excluding VAT)',
  knownTotal: 'Priced items including VAT — incomplete estimate',
  pending: 'To be quoted',
  table: ['Service / selected deliverables', 'Quantity', 'GBP excluding VAT'],
  packages: 'Package inclusions',
  extras: 'Optional additional work',
  exclusions: 'Exclusions and conditions',
  requirements: 'Selected requirements',
  assumptions: 'Scope assumptions',
  perItem: (name: string, price: string) => `${name}: ${price} each (excluding VAT).`,
  included: (label: string, quantity: number, min?: number, max?: number) =>
    `${label}${quantity > 1 ? ` (${quantity})` : ''}${min ? ` (${min}–${max} pages)` : ''}`,
  quantity: (n: number) => `${n} selected design${n === 1 ? '' : 's'}`,
  page: (n: number, total: number) => `Page ${n} of ${total}`,
  catalogue: 'Price catalogue',
  conditions: [
    'Printing, manufacturing and shipping are excluded.',
    'Animation and interactive development are excluded.',
    'Third-party services are quoted separately.',
    'Complex or unusual requirements may require manual review.',
    'Optional extras are not automatically added. Additional work must be discussed and agreed before commencement.',
    'This document is generated locally from the published catalogue. It is not a binding quotation or confirmation of an order.',
  ],
  errorRequired: 'Select an option to continue.',
  errorSelection: 'Check your selection before continuing.',
  errorOther: 'Enter each custom item, using up to 300 characters per item. Remove any empty rows.',
  errorDuplicate: 'Each custom item must be different from the other entries and selected designs.',
  errorCustomer:
    'Enter your name and a valid email address. Check that names are no longer than 150 characters and the optional phone number is valid.',
  errorConsent: 'Please confirm that you understand how this estimate works.',
  errorGenerate:
    'We could not generate the PDF. Your answers are still here. Check unusual characters in your text, then try again. If it continues, contact FinTaxTech.',
};
