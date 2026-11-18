import type { ServiceId } from './types';

export type AssistantService = ServiceId | 'unsure';
export type AssistantScreenId =
  | 'home'
  | 'pricing'
  | 'work'
  | 'project'
  | 'contact'
  | `price-help-${AssistantService}`
  | `project-${AssistantService}`;

export type AssistantChoice = { label: string } & (
  { next: AssistantScreenId } | { href: string; description?: string; image?: ImageMetadata }
);

export interface AssistantScreen {
  id: AssistantScreenId;
  heading: string;
  description?: string;
  back?: AssistantScreenId;
  choices: AssistantChoice[];
}
