export interface BriefField {
  id: string;
  label: string;
  type:
    | 'single'
    | 'multi'
    | 'text'
    | 'long'
    | 'date'
    | 'confirm'
    | 'competitors'
    | 'images'
    | 'url'
    | 'pages';
  options?: string[];
  optional?: boolean;
  max?: number;
  help?: string;
  when?: { id: string; values: string[] };
  exclusive?: string[];
  followUp?: {
    values: string[];
    text: string;
    link?: { label: string; href: string };
    pdfNote?: string;
  };
  examples?: Record<string, { file: string; alt: string }>;
}
export interface BriefSection {
  when?: { id: string; values: string[] };
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
export interface AdditionalPage {
  id: string;
  name: string;
  purpose: string;
}
export interface BriefState {
  answers: BriefAnswers;
  competitors: Competitor[];
  additionalPages: AdditionalPage[];
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
