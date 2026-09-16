export interface BriefField {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'text' | 'long' | 'date' | 'confirm' | 'competitors' | 'images';
  options?: string[];
  optional?: boolean;
  max?: number;
  help?: string;
  when?: { id: string; values: string[] };
  examples?: Record<string, { file: string; alt: string }>;
}
export interface BriefSection {
  title: string;
  fields: BriefField[];
}
export type BriefAnswers = Record<string, string | string[] | boolean>;
export interface Competitor {
  id: string;
  name: string;
  website: string;
}
export interface ReferenceImage {
  id: string;
  data: string;
  width: number;
  height: number;
  explanation: string;
}
export interface BriefState {
  answers: BriefAnswers;
  competitors: Competitor[];
  images: ReferenceImage[];
}
export interface BriefRow {
  label: string;
  value: string;
}
export interface BriefSummary {
  title: string;
  rows: BriefRow[];
  references: boolean;
}
