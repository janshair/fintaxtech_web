import type { Answers } from './answers';
import type { PriceItem } from './schema';
export type QuotationState = 'draft' | 'indicative' | 'needs_review' | 'approved' | 'issued';
export interface Line extends PriceItem {
  component: string;
}
export interface Finding {
  rule_id: string;
  severity: 'information' | 'warning' | 'blocking';
  explanation: string;
  affected_line_item_ids: string[];
  recommended_review_action: string;
  resolution_status: 'unresolved' | 'resolved' | 'accepted_with_reason' | 'not_applicable';
  blocks_fixed_price_approval: boolean;
}
export interface TaxResult {
  status: 'not_calculated_unverified' | 'not_registered' | 'not_taxable' | 'calculated';
  verified: boolean;
  message: string;
  one_time_vat_pence: number | null;
  monthly_vat_pence: number | null;
  one_time_including_vat_pence: number | null;
  monthly_including_vat_pence: number | null;
}
export interface MobileEstimate {
  answers: Answers;
  lines: Line[];
  backend_tier: string;
  backend_rule: string;
  one_time_subtotal_pence: number;
  monthly_subtotal_pence: number;
  pending_item_ids: string[];
  has_pending_scope: boolean;
  is_lower_bound: boolean;
  is_non_binding: true;
  tax: TaxResult;
  findings: Finding[];
  state: 'indicative' | 'needs_review';
  versions: { services: string; pricing: string; calculation: string };
  manual_adjustments: never[];
  approval: null;
  assumptions: string[];
  exclusions: string[];
}
