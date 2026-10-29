export interface EstimateQuestion {
  id: string;
  sectionId: string;
  order: number;
  label: string;
  helpText: string;
  answerType: 'single_select' | 'multi_select';
  required: boolean;
  selectionRules: { minimum: number; maximum: number | null };
  visibility: {
    logic: 'all';
    rules: {
      questionId: string;
      operator: 'contains' | 'contains_any';
      value: string | string[];
    }[];
  };
  options: { id: string; label: string; pricingItemId: string; pricingRole: string }[];
  otherOption: {
    enabled: boolean;
    label?: string;
    fieldLabel?: string | null;
    placeholder?: string | null;
    requiredWhenSelected?: boolean;
    minimumEntries?: number;
    maximumEntries?: number | null;
    addButtonLabel?: string;
    allowRemove?: boolean;
    clearOnDeselect?: boolean;
    pricingItemId?: string;
    requiresScopeReview?: boolean;
  };
}
export interface EstimateAnswer {
  selected: string[];
  other: string[];
}
export type EstimateAnswers = Record<string, EstimateAnswer>;
export interface EstimateCustomer {
  name: string;
  business: string;
  email: string;
  phone: string;
}
export interface EstimateLine {
  id: string;
  name: string;
  quantity: number;
  deliverables: string[];
  amountMinor: number | null;
}
export interface EstimateResult {
  lines: EstimateLine[];
  subtotalMinor: number;
  vatMinor: number;
  vatRatePercent: number;
  totalMinor: number | null;
  knownTotalMinor: number;
  reviewReasons: string[];
  incomplete: boolean;
  catalogVersion: string;
}
export interface EstimateDocument {
  estimate: EstimateResult;
  customer: EstimateCustomer;
  reference: string;
  issued: string;
}
export interface CatalogItem {
  id: string;
  quoteName: string;
  pricing: {
    type: 'fixed' | 'manual_quote' | 'selection' | 'category_minimum_with_included_quantity';
    amountMinor?: number | null;
    selectionQuestionId?: string;
    optionPricingItemIds?: Record<string, string>;
    quantitySourceQuestionId?: string;
    minimumAmountMinor?: number;
    includedQuantity?: number;
    additionalItemAmountMinor?: number;
  };
  includes: { label: string; quantity: number; minimumPages?: number; maximumPages?: number }[];
  extras: { name: string; amountMinor: number; calculatedFromCategoryQuantity?: boolean }[];
  assumptions: string[];
  exclusions: string[];
  manualReviewReasons: string[];
  quote?: { additionalWorkNotice?: string };
}
