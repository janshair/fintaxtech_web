import { company, ui } from './site';
import type { AssistantService } from '../lib/project-assistant-types';

export const assistantCopy = {
  launcher: 'Get Started',
  invitationTitle: 'Need help finding the right service?',
  invitationDetail: 'I can point you in the right direction.',
  dismissInvitation: 'Dismiss Project Assistant invitation',
  title: `${company.name} Project Assistant`,
  welcome: 'What would you like help with?',
  introduction:
    'Find a service, ask for a proposal or send your project requirements to FinTaxTech for a personal review.',
  pricing: 'Request a proposal',
  work: 'View previous work',
  project: 'Discuss a project',
  other: 'Something else',
  servicePrompt: 'Which service are you interested in?',
  priceHelp: 'Tell us what you need',
  scope: 'Pricing depends on the scope of your project. Tell us what you need so we can help.',
  allWork: 'View all selected work',
  discussService: (service: string) => `Discuss your project: ${service}`,
  questionnaire: 'Continue to the questionnaire',
  email: `Email ${company.name}`,
  whatsapp: `WhatsApp ${company.name}`,
  contactPage: 'Contact page',
  close: 'Close',
  back: 'Back',
  restart: 'Restart',
};

export const assistantServices: Record<AssistantService, string> = {
  branding: 'Branding and graphic design',
  websites: 'Website development',
  'mobile-apps': 'Mobile app development',
  'ai-automation': 'AI automation',
  unsure: ui.notSure,
};
