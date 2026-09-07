export type ServiceId = 'branding' | 'websites' | 'mobile-apps' | 'prompt-services';
export type Answer = string | string[];
export type Answers = Record<string, Answer>;
export interface Question {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'text';
  optional: boolean;
  stage: number;
  options?: string[];
  max?: number;
  when?: { id: string; includes: string };
}
export interface Journey {
  service: ServiceId;
  stage: '1' | '2';
  answers: Answers;
  promo: boolean;
  short: boolean;
}
export interface SummaryRow {
  label: string;
  value: string;
}
