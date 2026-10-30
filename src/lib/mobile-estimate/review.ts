import type { CalculationConfig } from './schema';
import { evaluate } from './predicates';
import type { Finding, Line } from './types';
export function validatePricing(
  config: CalculationConfig,
  context: Record<string, unknown>,
  lines: Line[],
): Finding[] {
  return config.internal_validation.rules
    .filter((rule) => evaluate(rule.when, context))
    .map((rule) => ({
      rule_id: rule.id,
      severity: rule.severity,
      explanation: rule.explanation,
      affected_line_item_ids: lines
        .filter(
          (line) =>
            rule.affected_components.includes('all') ||
            rule.affected_components.includes(line.component),
        )
        .map((line) => line.id),
      recommended_review_action: rule.recommended_review_action,
      resolution_status: 'unresolved',
      blocks_fixed_price_approval: rule.blocks_fixed_price_approval,
    }));
}
