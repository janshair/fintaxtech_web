import type { BriefField } from '../lib/client-brief/types';
import type { Question } from '../lib/types';

export const automationCopy = {
  name: 'AI Automation',
  description: 'Automate repetitive work using AI, structured workflows and human review.',
  headline: 'Turn repetitive business processes into reliable AI-assisted workflows.',
  boundary:
    'Every automation is scoped around a defined business process. Suitability depends on source quality, system access, available APIs, privacy and risk. FinTaxTech does not promise fully autonomous or error-free decision-making, and may decline highly sensitive or regulated workflows.',
  projectLabel: 'What would you like to automate?',
  projectOptions: [
    'Content or document processing',
    'Data extraction or classification',
    'Repetitive administrative workflow',
    'AI assistant or knowledge helper',
    'Connection between business systems',
    'Not sure',
    'Other',
  ],
  workflowSections: ['Current process', 'Systems and outputs', 'Volume, review and exceptions'],
  knowledgeLabel:
    'Which approved business information should the assistant use, and what must it not answer?',
  connectionLabel:
    'Which system should send information, which should receive it, and what changes are allowed?',
  privacy:
    'Describe the process and information categories only. Do not enter confidential records, personal data, passwords or API keys. If a detail is unknown, say Not sure; suitability and access will be reviewed before work begins.',
  otherLabel: 'What else would you like to automate?',
  pdfTitle: 'AI Automation Project Enquiry',
  pdfFilename: 'FinTaxTech-ai-automation-enquiry.pdf',
  redirect: {
    route: '/services/prompt-services/',
    destination: '/services/ai-automation/',
    title: 'Explore AI Automation',
    message:
      'This service is now called AI Automation. You are being redirected to its current service page.',
    link: 'Continue to AI Automation',
  },
};
export const contentAutomation = automationCopy.projectOptions[0];
export const workflowAutomations = automationCopy.projectOptions.slice(1);
// Shared question wording and choices for the public enquiry and post-payment brief.
type WorkflowField = Omit<BriefField, 'type'> & { type: 'single' | 'multi' | 'text' | 'long' };
export const automationWorkflowFields: WorkflowField[] = [
  {
    id: 'process',
    label: 'What is the current process, and what should improve?',
    type: 'long',
    help: automationCopy.privacy,
  },
  {
    id: 'trigger',
    label: 'What should trigger the workflow?',
    type: 'single',
    options: [
      'A person starts it',
      'A regular schedule',
      'A new record or document',
      'An incoming message or request',
      'A change in another system',
      'Not sure',
    ],
  },
  {
    id: 'inputs',
    label: 'What inputs does the process use?',
    type: 'text',
    help: 'Name information categories or document types, not actual records.',
  },
  { id: 'steps', label: 'What steps happen between input and output?', type: 'long' },
  {
    id: 'systems',
    label: 'Which systems or business tools are involved?',
    type: 'text',
    help: 'Names only; do not include credentials. Say None or Not sure where appropriate.',
  },
  {
    id: 'access',
    label: 'What system or API access is available?',
    type: 'single',
    options: [
      'Approved access and documented APIs',
      'Access exists; API availability is unknown',
      'Permission or access is pending',
      'No connected systems',
      'FinTaxTech to assess',
    ],
  },
  { id: 'output', label: 'What should the workflow produce or change?', type: 'text' },
  {
    id: 'frequency',
    label: 'How often should it run?',
    type: 'single',
    options: ['On demand', 'Several times daily', 'Daily', 'Weekly', 'Monthly', 'Not sure'],
  },
  {
    id: 'volume',
    label: 'How many items or requests should it handle per run?',
    type: 'single',
    options: ['1–10', '11–100', '101–1,000', 'More than 1,000', 'Not sure'],
  },
  {
    id: 'approval',
    label: 'Where is human approval needed?',
    type: 'single',
    options: [
      'Before every external action or publication',
      'At defined checkpoints',
      'Review every output before use',
      'FinTaxTech to recommend',
    ],
  },
  {
    id: 'exceptions',
    label: 'What should happen when information is missing or an action fails?',
    type: 'single',
    options: [
      'Stop and ask a person',
      'Flag for review without taking further action',
      'Follow agreed fallback rules with human escalation',
      'Not sure',
    ],
  },
  {
    id: 'sensitivity',
    label: 'What information sensitivity is involved?',
    type: 'multi',
    options: [
      'Public business information',
      'Internal business information',
      'Personal data',
      'Confidential commercial information',
      'Financial, health, legal or regulated information',
      'Not sure',
    ],
    exclusive: ['Not sure'],
    help: automationCopy.privacy,
  },
];
export function automationEnquiryQuestions(stage: '1' | '2', content: Question[]): Question[] {
  const kind = `ai-automation-${stage}-kind`;
  return [
    {
      id: kind,
      label: automationCopy.projectLabel,
      type: 'single',
      optional: false,
      stage: Number(stage),
      options: automationCopy.projectOptions,
    },
    {
      id: `${kind}-other`,
      label: automationCopy.otherLabel,
      type: 'text',
      optional: false,
      stage: Number(stage),
      when: { id: kind, includes: 'Other' },
    },
    ...content.slice(0, -1).map((q) => ({ ...q, when: { id: kind, includes: contentAutomation } })),
    ...automationWorkflowFields.map((f): Question => ({
      id: `ai-automation-${stage}-${f.id}`,
      label: f.label,
      type: f.type === 'long' ? 'text' : f.type,
      options: f.options,
      help: f.help,
      optional: false,
      stage: Number(stage),
      when: { id: kind, includes: workflowAutomations },
    })),
    {
      id: `ai-automation-${stage}-knowledge`,
      label: automationCopy.knowledgeLabel,
      type: 'text',
      optional: false,
      stage: Number(stage),
      when: { id: kind, includes: 'AI assistant or knowledge helper' },
    },
    {
      id: `ai-automation-${stage}-connection`,
      label: automationCopy.connectionLabel,
      type: 'text',
      optional: false,
      stage: Number(stage),
      when: { id: kind, includes: 'Connection between business systems' },
    },
    content.at(-1)!,
  ];
}
