export type BriefKind = 'logo' | 'website' | 'websiteDemo' | 'mobile' | 'prompt' | 'template';

export interface BriefCondition {
  id: string;
  values?: string[];
  matches?: string;
}
// A format rule with the message shown when a value does not match (Unicode flag).
export interface BriefPattern {
  source: string;
  message: string;
}

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
    | 'email'
    | 'pages'
    | 'urls'
    | 'rows'
    | 'phone'
    | 'colour'
    | 'hidden';
  imagePurpose?: 'current-logo';
  imageExplanationMin?: number;
  imageExplanationHelp?: string;
  options?: string[];
  optionsFrom?: { id: string; exclude?: string[] };
  otherField?: string;
  repeat?: {
    title: (n: number) => string;
    add: string;
    remove: (n: number) => string;
    max?: number;
    min?: number;
    unique?: { key: string; againstOptionsFrom?: string };
    fields: {
      key: string;
      label: string;
      type: 'text' | 'long' | 'url' | 'single';
      options?: string[];
      optional?: boolean;
      when?: BriefCondition;
      maxLength?: number;
      pattern?: BriefPattern;
    }[];
  };
  optional?: boolean;
  max?: number;
  // Character limit for text answers, replacing the default short/long limit.
  maxLength?: number;
  pattern?: BriefPattern;
  // Shown beside a confirm checkbox instead of the business-name spelling confirmation.
  confirmText?: string;
  // Options listed for context but not selectable yet.
  comingSoon?: string[];
  // Query parameter that pre-fills this field, sanitised before use.
  prefill?: string;
  help?: string;
  when?: BriefCondition | BriefCondition[];
  requiredWhen?: BriefCondition | BriefCondition[];
  exclusive?: string[];
  followUp?: {
    values: string[];
    text: string;
    link?: { label: string; href: string };
    pdfNote?: string;
  };
  examples?: Record<
    string,
    {
      file?: string;
      image?: string;
      alt: string;
      description?: string;
      credit?: string;
      source?: string;
    }
  >;
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
  filename?: string;
  purpose?: 'current-logo';
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
  rows: Record<string, { id: string; values: Record<string, string> }[]>;
}
export interface BriefRow {
  label: string;
  value: string;
}
export interface BriefSummary {
  sectionIndex: number;
  title: string;
  rows: BriefRow[];
  references: boolean;
  imagePurpose?: 'current-logo';
}
