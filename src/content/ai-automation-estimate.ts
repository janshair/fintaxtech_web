import definitions from './ai-automation-estimate/services.json';
export const aiEstimateCopy = {
  route: definitions.route,
  title: 'Get Your AI Automation Estimate',
  description:
    'Describe a business workflow, review indicative implementation and support costs, and download a private AI automation estimate.',
  intro:
    'Tell us which repetitive work you want to simplify. Six short sections help you prepare an indicative estimate for scope review.',
  privacy:
    'Answers stay in this tab. Refreshing or closing clears them. Nothing is sent automatically. Do not enter credentials, confidential records or personal data.',
  privacyLink: 'Read our privacy policy',
  begin: 'Prepare my automation estimate',
  noScript: 'Enable JavaScript to prepare an estimate, or contact FinTaxTech.',
  contactLink: 'Discuss your project',
  back: 'Back',
  next: 'Continue',
  progress: (n: number) => `Step ${n} of 6`,
  from: 'From',
  monthly: 'Monthly FinTaxTech support',
  implementation: 'Indicative implementation',
  known: 'Priced items',
  pending: 'Not yet priced — manual quotation required',
  status: 'Indicative / subject to review',
  disclaimer: 'Indicative Estimate — Not a Binding Quotation',
  scopeNote:
    'Technical step and actual connection counts require scope confirmation. Selecting tasks or tools does not add connection or step charges. Merely linking to a booking page is not a data connection.',
  scopeCaveat:
    'From-price scope applies to one defined workflow, up to five standard steps and two supported connections. Suitability and access require confirmation.',
  thirdParty:
    'AI, platform, messaging and hosting fees are separate and variable. Provider pricing is to be confirmed; customer-owned billing is preferred.',
  vat: 'VAT treatment to be confirmed. VAT has not been calculated or added.',
  nextSteps:
    'Contact FinTaxTech to validate the scope and obtain a formal quotation. Downloading this PDF submits nothing and reserves no capacity.',
  extraWork: 'Work outside the agreed scope is quoted and approved before work or charges.',
  safety:
    'Automation may use deterministic rules where sufficient. AI-assisted outputs need appropriate human review. No fully autonomous, unlimited or error-free operation is promised.',
  revision: (n: number) => `${n} consolidated revision included.`,
  warranty: (n: number) =>
    `${n}-day defect warranty against the agreed specification; new requirements and third-party failures are outside this warranty.`,
  delivery: (min: number, max: number) =>
    `Target ${min}–${max} working days for a straightforward Starter only, after scope, access, required content and start date are confirmed. Expanded scope needs timeline confirmation.`,
  minimum:
    'Starting from — includes provisional workflow minimums. The final project price is not confirmed.',
  incomplete:
    'Known-priced items only. Unpriced work is excluded; this is not the complete project price.',
  download: 'Download PDF Estimate',
  downloadError: 'The PDF could not be created. Your answers are still here. Please try again.',
  error: 'Please complete the required fields and check your answers.',
  review: 'Scope review required',
  requirements: 'Your requirements',
  pdfTitle: 'AI Automation — Indicative Estimate',
  reference: 'Local estimate reference',
  date: 'Prepared on',
  version: 'Configuration versions',
  none: 'None',
  yes: 'Yes',
  no: 'No',
  starterInclusions: {
    standard_error_notification: 'Standard error notification',
    basic_logging: 'Basic logging',
    configuration: 'Configuration',
    testing: 'Testing',
    deployment: 'Deployment',
    basic_documentation: 'Basic documentation',
    handover: 'Handover',
  },
  starter: 'AI Automation Starter',
  extraSteps: 'Additional standard workflow steps',
  extraConnections: 'Additional supported application connections',
  extraWorkflows: 'Additional independent workflows',
  faqSetup: 'Knowledge-base setup',
  extraTemplates: 'Additional document templates',
  unit: 'Unit rate',
  quantity: 'Quantity',
  lineTotal: 'Line total',
  supportDescriptions: {
    self: 'Handover and defect warranty; no monitoring or ongoing maintenance.',
    care: 'Basic automated health monitoring, error-alert review, routine maintenance of the agreed workflow and business-hours email support.',
    plus: 'Automation Care plus minor configuration changes and priority handling in business hours. No rollover is assumed for this estimate; contract terms need confirmation.',
  },
  minutes: (n: number) => `Up to ${n} minutes of minor configuration changes per month.`,
  reviewReasons: {
    unknown_scope:
      'Technical workflow steps, actual data connections and suitability require scope confirmation.',
    unsupported_integration: 'Other or unsupported systems need a compatibility assessment.',
    complex_api: 'A custom connection or API needs technical assessment.',
    complex_logic: 'Custom logic or multilingual behaviour requires scope and quality review.',
    sensitive_data:
      'Information sensitivity and security requirements need review. Do not provide actual records here.',
    high_volume_processing: 'Usage, capacity and variable provider charges require review.',
    complex_knowledge: 'Large, changing or unprepared information sources require assessment.',
    complex_recommendations: 'Recommendation rules and human oversight need confirmation.',
    direct_booking_unverified:
      'Direct booking capability and provider access have not been verified.',
    additional_workflows:
      'Each independent workflow and its support coverage needs separate scoping.',
    file_upload: 'Document-upload validation, storage and data handling need assessment.',
    booking: 'Booking behaviour and confirmation responsibilities need assessment.',
    custom_requirement: 'Written or Other requirements need scope and pricing review.',
  },
};
export type Question = {
  id: string;
  label: string;
  type: 'one' | 'many' | 'text' | 'long' | 'number';
  options?: { id: string; label: string; description?: string }[];
  required?: boolean;
  show?: (a: Record<string, unknown>) => boolean;
  help?: string;
};
const options = (ids: string[], labels: string[]) => ids.map((id, i) => ({ id, label: labels[i] }));
const w = definitions.websiteAssistant;
export const outcomeOptions: Record<string, { id: string; label: string }[]> = {
  website_assistant: options(w.outcomes, [
    'Answer approved FAQs',
    'Capture enquiries',
    'Help with booking',
    'Recommend products or services',
    'Other',
  ]),
  lead_automation: options(
    ['organise', 'records', 'notify', 'other'],
    ['Organise enquiries', 'Create records', 'Notify staff', 'Other'],
  ),
  booking_automation: options(
    ['booking', 'reminders', 'calendar', 'other'],
    [
      'Handle booking requests',
      'Send reminders',
      'Use a supported booking or calendar tool',
      'Other',
    ],
  ),
  document_automation: options(
    ['extract', 'records', 'verify', 'other'],
    ['Extract agreed information', 'Prepare records', 'Human verification', 'Other'],
  ),
  unsure: [{ id: 'other', label: 'Describe the work you need help with' }],
};
const has = (a: Record<string, unknown>, key: string, id: string) =>
  ((a[key] as string[]) ?? []).includes(id);
export const bookingRelevant = (a: Record<string, unknown>) =>
  a.service === 'booking_automation' || has(a, 'outcomes', 'booking');
export const enquiriesRelevant = (a: Record<string, unknown>) =>
  a.service === 'lead_automation' || has(a, 'outcomes', 'leads');
export function questions(step: number, a: Record<string, unknown>): Question[] {
  const many = (
    id: string,
    label: string,
    opts: { id: string; label: string }[],
    required = false,
  ): Question => ({ id, label, type: 'many', options: opts, required });
  const one = (id: string, label: string, ids: string[], labels: string[]): Question => ({
    id,
    label,
    type: 'one',
    options: options(ids, labels),
    required: true,
  });
  return [
    [
      {
        id: 'service',
        label: 'What would you like to automate?',
        type: 'one',
        required: true,
        options: [
          ...definitions.services.map((s) => ({
            id: s.id,
            label: s.title,
            description: s.description,
          })),
          { id: definitions.discoveryChoice.id, label: definitions.discoveryChoice.title },
        ],
      },
      {
        id: 'discovery',
        label: 'What repetitive work would you like help with?',
        type: 'long',
        required: true,
        show: (a: Record<string, unknown>) => a.service === 'unsure',
      },
    ],
    [
      many(
        'outcomes',
        'What should this automation help you do?',
        outcomeOptions[String(a.service)] ?? [],
        true,
      ),
      {
        id: 'otherOutcome',
        label: 'Describe the other task',
        type: 'text',
        required: true,
        show: (a: Record<string, unknown>) => has(a, 'outcomes', 'other'),
      },
      one('currentProcess', 'How is this work handled today?', w.currentProcesses, [
        'By the owner or team',
        'Contact form',
        'Existing chat',
        'No current process',
      ]),
      {
        id: 'processDetails',
        label: 'Describe the current process, inputs and the result you need',
        type: 'long',
        required: true,
      },
      one(
        'sources',
        'Where will the approved business information come from?',
        w.knowledgeSources,
        ['Existing website', 'Documents or approved FAQs', 'Both', 'Help preparing information'],
      ),
      one('usage', 'Expected monthly conversations or processing tasks', w.usageBands, [
        'Fewer than 100',
        '100–500',
        'More than 500',
        'Not sure',
      ]),
    ],
    [
      one('websiteStatus', 'Do you have a website?', w.websiteStatuses, [
        'Existing website',
        'Being developed',
        'No website',
      ]),
      {
        id: 'websiteUrl',
        label: 'Website address (optional)',
        type: 'text',
        show: (a: Record<string, unknown>) => a.websiteStatus === 'existing',
      },
      many(
        'tools',
        'Which applications do you currently use?',
        options(w.existingTools, [
          'Email',
          'Spreadsheets',
          'CRM',
          'Calendar',
          'Booking software',
          'Other',
          'None',
        ]),
        true,
      ),
      {
        id: 'otherTool',
        label: 'Name the other application',
        type: 'text',
        required: true,
        show: (a: Record<string, unknown>) => has(a, 'tools', 'other'),
      },
      {
        id: 'exchangeDetails',
        label: 'Which tools should exchange information, and what should move between them?',
        type: 'long',
        required: true,
        help: 'Existing tools are not automatically billable connections. Describe any unsupported, custom or multiple-system requirements.',
      },
      {
        ...one('bookingMode', 'How should booking work?', w.bookingModes, [
          'Link to an existing booking page',
          'Collect a request for human confirmation',
          'Book directly in the system',
          'Not sure',
        ]),
        show: bookingRelevant,
      },
      {
        ...one('destination', 'Where should enquiry information go?', w.enquiryDestinations, [
          'Email',
          'Spreadsheet',
          'CRM',
          'Multiple destinations',
          'Not sure',
        ]),
        show: enquiriesRelevant,
      },
      {
        id: 'systemDetails',
        label: 'Describe the booking, custom connection or multiple destinations',
        type: 'long',
        required: true,
        show: (a: Record<string, unknown>) =>
          (bookingRelevant(a) && a.bookingMode === 'direct_booking') ||
          (enquiriesRelevant(a) && a.destination === 'multiple') ||
          has(a, 'tools', 'other'),
      },
    ],
    [
      one('knowledge', 'How much information needs preparing?', w.knowledgeLevels, [
        'Basic approved business information',
        'Organise up to 20 approved FAQs',
        'Extensive or frequently changing sources',
      ]),
      many(
        'capabilities',
        'Optional capabilities',
        options(w.extraCapabilities, [
          'Human handoff',
          'Multilingual support',
          'Product or service recommendations',
          'Document upload',
        ]),
      ),
      {
        id: 'capabilityDetails',
        label: 'Describe the languages, recommendations or document-upload requirements',
        type: 'long',
        required: true,
        show: (a: Record<string, unknown>) =>
          ((a.capabilities as string[]) ?? []).some((id) => id !== 'human_handoff'),
      },
      {
        id: 'additionalWorkflows',
        label: 'Additional independent workflows',
        type: 'number',
        required: true,
      },
      {
        id: 'workflowDetails',
        label: 'Describe each additional workflow and how it is independent',
        type: 'long',
        required: true,
        show: (a: Record<string, unknown>) => Number(a.additionalWorkflows) > 0,
      },
      {
        id: 'additionalTemplates',
        label: 'Additional standard document templates',
        type: 'number',
        required: true,
        show: (a: Record<string, unknown>) => a.service === 'document_automation',
      },
      {
        id: 'templateDetails',
        label: 'Describe the extra templates and agreed information they should contain',
        type: 'long',
        required: true,
        show: (a: Record<string, unknown>) =>
          a.service === 'document_automation' && Number(a.additionalTemplates) > 0,
      },
      one(
        'sensitivity',
        'Does this involve sensitive information or special security requirements?',
        ['ordinary', 'sensitive', 'unknown'],
        ['Ordinary business information', 'Sensitive information or custom security', 'Not sure'],
      ),
      { id: 'notes', label: 'Anything else we should know? (optional)', type: 'long' },
    ],
    [
      {
        id: 'support',
        label: 'Choose your monthly support plan',
        type: 'one',
        required: true,
        options: [],
      },
    ],
    [],
  ][step] as Question[];
}
