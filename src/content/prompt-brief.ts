import { briefCopy, type BriefCopy } from './client-brief';
import type { BriefSection } from '../lib/client-brief/types';

export const promptBriefCopy: BriefCopy = {
  ...briefCopy,
  route: '/client/prompt-brief/',
  title: 'AI Content Production Brief',
  description:
    'Prepare your post-payment AI-assisted content brief locally, review your requirements and download a PDF to share manually with FinTaxTech.',
  intro:
    'Complete this brief after FinTaxTech has confirmed your advance payment. It records the production requirements for your agreed AI-assisted content project; it is not a quote request.',
  privacy:
    'Your answers stay in this page’s memory. Nothing is sent automatically or saved by this website. Refreshing or closing clears the brief. Download your PDF before leaving. Do not enter confidential records, credentials or personal data.',
  workflow:
    'This form does not upload or store source documents. Download the brief PDF, then share it and your source material separately with FinTaxTech through the agreed channel. Confirm permission to use the sources and identify any specialist reviewer or final approver separately. Public availability does not automatically mean permission to reuse. AI-assisted content needs human checking before publication or use.',
  begin: 'Begin AI content brief',
  reviewTitle: 'Review your AI content brief',
  reviewIntro:
    'Check your content choices, source readiness, review requirements and output formats. Only applicable answers appear in the PDF. Nothing has been sent. Share source documents separately after downloading your brief.',
  disclaimer:
    'This brief records production requirements and does not alter the agreed proposal, scope or price. Source permissions, factual accuracy and any specialist review must be confirmed before publication or use.',
  pdfFilename: 'FinTaxTech-ai-content-production-brief.pdf',
};

const sensitivityNote =
  'These content categories need accuracy, scope and privacy review. Agree who will check any specialist claims before use. Do not enter confidential records, credentials or personal data; describe the content category only.';

export const promptBriefSections: BriefSection[] = [
  {
    title: 'The content you need',
    fields: [
      {
        id: 'content',
        label: 'Content required',
        type: 'multi',
        help: 'Choose all that apply to the agreed project.',
        options: [
          'Website content',
          'Blog/article',
          'Social posts',
          'Email/newsletter',
          'Product or service descriptions',
          'Presentation content',
          'Business document',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'What the content should achieve',
    fields: [
      {
        id: 'purpose',
        label: 'Primary purpose',
        type: 'single',
        options: [
          'Explain',
          'Educate',
          'Generate enquiries',
          'Summarise',
          'Persuade',
          'Instruct',
          'Repurpose existing material',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Who the content is for',
    fields: [
      {
        id: 'audience',
        label: 'Intended audience',
        type: 'multi',
        options: [
          'Prospective customers',
          'Existing customers',
          'Employees',
          'Partners/suppliers',
          'Investors/funders',
          'Professional or regulatory reviewers',
          'General public',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Where the content will appear',
    fields: [
      {
        id: 'usage',
        label: 'Where it will be used',
        type: 'multi',
        options: [
          'Website',
          'Blog',
          'Social media',
          'Email',
          'Presentation',
          'Downloadable PDF/document',
          'Mobile app',
          'Print',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Your source material',
    fields: [
      {
        id: 'sourceStatus',
        label: 'Source material status',
        type: 'single',
        options: ['All ready', 'Partly ready', 'Not ready', 'FinTaxTech to advise'],
        help: 'Do not paste source documents into this brief. Share them separately after downloading the PDF.',
      },
    ],
  },
  {
    title: 'Available source formats',
    fields: [
      {
        id: 'sourceFormats',
        label: 'Source formats available',
        type: 'multi',
        optional: true,
        options: [
          'PDF',
          'Word',
          'PowerPoint',
          'Spreadsheet',
          'Existing web pages/URLs',
          'Images/scans',
          'Plain text',
          'Other',
        ],
        help: 'Choose the formats you already have. Leave this unanswered if no material is available yet or the formats are not known. No files or source URLs are collected here.',
      },
    ],
  },
  {
    title: 'Permission to use your sources',
    fields: [
      {
        id: 'permission',
        label: 'Permission to use sources',
        type: 'single',
        options: ['I own them', 'I have permission', 'Publicly available', 'Not sure'],
        help: 'If sources have different permissions, choose Not sure so we can review them together.',
        followUp: {
          values: ['Publicly available', 'Not sure'],
          text: 'Public availability does not automatically grant reuse rights. Source permissions must be checked before content production.',
          pdfNote:
            'Source permissions must be checked before content production; public availability does not automatically grant reuse rights.',
        },
      },
    ],
  },
  {
    title: 'Your preferred tone',
    fields: [
      {
        id: 'tone',
        label: 'Tone',
        type: 'multi',
        max: 3,
        options: [
          'Professional',
          'Friendly',
          'Authoritative',
          'Straightforward',
          'Reassuring',
          'Technical',
          'Concise',
          'Persuasive',
          'Match existing brand voice',
          'FinTaxTech to recommend',
          'Other',
        ],
        exclusive: ['FinTaxTech to recommend'],
        help: 'Choose up to three, or let FinTaxTech recommend a tone.',
      },
    ],
  },
  {
    title: 'Language',
    fields: [
      {
        id: 'language',
        label: 'Language',
        type: 'single',
        options: ['UK English', 'US English', 'Another language', 'FinTaxTech to recommend'],
      },
      {
        id: 'languageDetail',
        label: 'Which language?',
        type: 'text',
        when: { id: 'language', values: ['Another language'] },
      },
    ],
  },
  {
    title: 'Accuracy and sensitivity',
    fields: [
      {
        id: 'sensitivity',
        label: 'Accuracy/sensitivity',
        type: 'multi',
        options: [
          'General business',
          'Technical',
          'Financial',
          'Legal/regulatory',
          'Medical/health',
          'Personal or sensitive information',
          'Other',
        ],
        help: 'Select categories only. Do not enter confidential records, credentials or personal data anywhere in this brief.',
        followUp: {
          values: [
            'Technical',
            'Financial',
            'Legal/regulatory',
            'Medical/health',
            'Personal or sensitive information',
          ],
          text: sensitivityNote,
          pdfNote: sensitivityNote,
        },
      },
    ],
  },
  {
    title: 'Checking the content',
    fields: [
      {
        id: 'humanReview',
        label: 'Human review required',
        type: 'single',
        options: ['Customer review', 'Named specialist review', 'Both', 'Not sure'],
        help: 'Choose who should review the content. Identify any named specialist separately when sharing your brief; do not enter their personal details here.',
      },
    ],
  },
  {
    title: 'Your deliverables',
    fields: [
      {
        id: 'output',
        label: 'Output formats',
        type: 'single',
        options: [
          'Word',
          'PDF',
          'Markdown',
          'Plain text',
          'Copy-ready website content',
          'Combination',
        ],
        help: 'Choose the intended delivery format. Any combination will be confirmed against the agreed proposal.',
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
    title: 'Final approval',
    fields: [
      {
        id: 'approver',
        label: 'Final approver',
        type: 'single',
        options: ['Me', 'One named person', 'Group providing one consolidated decision'],
        help: 'Confirm the named approver or group contact separately when sharing your brief. A group should provide one consolidated decision.',
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
        help: 'Describe any remaining requirements only. Do not paste source material, confidential records, credentials or personal data.',
      },
    ],
  },
];
