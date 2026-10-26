import type { ServiceId } from '../lib/types';

export const serviceMotion: Record<
  ServiceId,
  { heroLabel: string; outcomeLabel: string; steps: string[] }
> = {
  branding: {
    heroLabel:
      'Logo, colours, typography and stationery come together as a consistent brand system.',
    outcomeLabel: 'From identity to a visual system and business materials.',
    steps: ['Identity', 'Visual system', 'Business materials'],
  },
  websites: {
    heroLabel:
      'A page structure becomes a finished website, arranged across desktop, tablet and mobile screens.',
    outcomeLabel: 'A visitor arrives, understands the offer, and enquires, books or buys.',
    steps: ['Visitor arrives', 'Understands the offer', 'Enquires, books or buys'],
  },
  'mobile-apps': {
    heroLabel:
      'An app idea becomes connected screens, with a user action leading to a confirmation.',
    outcomeLabel: 'Open the app, complete a useful task and receive confirmation.',
    steps: ['Open app', 'Complete a useful task', 'Receive confirmation'],
  },
  'ai-automation': {
    heroLabel:
      'Business documents enter structured processing, followed by human review and an approved output.',
    outcomeLabel: 'Input passes through AI-assisted processing, human review and approved output.',
    steps: ['Input', 'AI-assisted processing', 'Human review', 'Approved output'],
  },
};
export const serviceMotionSamples = { typography: 'Aa' };
