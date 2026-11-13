import type { ServiceId } from '../lib/types';

// Illustration labels only. Approved homepage copy remains in site.ts.
export const heroProcess = {
  label:
    'Branding, websites, mobile apps and AI automation feed into a project brief, followed by human review.',
  brief: 'Project brief',
  review: 'Human review',
  services: [
    { id: 'branding', label: 'Brand' },
    { id: 'websites', label: 'Website' },
    { id: 'mobile-apps', label: 'Mobile App' },
    { id: 'ai-automation', label: 'AI Automation' },
  ] satisfies { id: ServiceId; label: string }[],
};

// "A capable partner asking clear questions": one guided question, answered by choosing.
export const questionVisual = {
  label:
    'A guided question with three answers to choose from. One answer is selected, then a person checks it.',
  progress: 'Question 2 of 6',
  question: 'Who are your customers?',
  options: ['Local households', 'Other businesses', 'Both'],
  selected: 2,
  review: 'Checked by a person',
};

// "Pricing follows the scope": the written proposal is ticked off, then agreed.
export const scopeVisual = {
  label:
    'A written proposal with deliverables, exclusions, timing and cost each ticked off, then agreed before work starts.',
  title: 'Written proposal',
  rows: ['Deliverables', 'Exclusions', 'Timing', 'Cost'],
  agreed: 'Agreed before work starts',
};

// "A little clarity, before you start": two of the FAQ answers as a short message thread.
export const answersVisual = {
  label:
    'A message thread. Do you work outside the UK? Yes, remotely, worldwide. How do payments work? 50% to start, 50% at final approval.',
  thread: [
    ['Do you work outside the UK?', 'Yes, remotely, worldwide.'],
    ['How do payments work?', '50% to start, 50% at final approval.'],
  ],
};
