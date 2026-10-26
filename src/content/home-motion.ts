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
