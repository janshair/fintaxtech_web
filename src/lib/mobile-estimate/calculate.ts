import { mobileServices, mobileEstimateCopy as c } from '../../content/mobile-estimate';
import { validateAnswers } from './answers';
import { evaluate } from './predicates';
import type { CalculationConfig } from './schema';
import { calculateTax } from './tax';
import { validatePricing } from './review';
import type { Line, MobileEstimate } from './types';
export function calculateMobileEstimate(input: unknown, config: CalculationConfig): MobileEstimate {
  const answers = validateAnswers(input);
  if (config.compatible_services_version !== mobileServices.version)
    throw new Error('Configuration version mismatch');
  // There is intentionally no caller-supplied review context or override parameter.
  const context: Record<string, unknown> = { answers, review_context: {} };
  const backend = config.backend_recommendation.rules.find((rule) => evaluate(rule.when, context));
  if (!backend?.tier || backend.tier_from) throw new Error('Backend recommendation unresolved');
  const derived = {
    backend_tier: backend.tier,
    qa_package: 'standard',
    vat_configuration_verified: false,
  };
  context.derived = derived;
  const lines: Line[] = [];
  for (const component of config.calculation.components) {
    const ids =
      component.selection === 'for_each_unique'
        ? (answers.features as string[]).map((id) => `${component.item_id_prefix}${id}`)
        : [component.choices.find((choice) => evaluate(choice.when, context))?.item_id];
    for (const id of ids) {
      if (!id || !config.catalogue[id])
        throw new Error(`Unresolved pricing component: ${component.id}`);
      if (lines.some((line) => line.id === id)) throw new Error('Duplicate item');
      lines.push({ ...config.catalogue[id], component: component.id });
    }
  }
  const sum = (type: 'one_time' | 'monthly') => {
    const total = lines
      .filter((line) => line.charge_type === type)
      .reduce((sum, line) => sum + (line.amount_pence ?? 0), 0);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid calculation');
    return total;
  };
  const one = sum('one_time'),
    monthly = sum('monthly');
  const pending = lines.filter((line) => line.amount_pence === null).map((line) => line.id);
  const tax = calculateTax(config.vat, one, monthly);
  derived.vat_configuration_verified = tax.verified;
  context.calculation = {
    feature_ids: lines.filter((line) => line.component === 'features').map((line) => line.id),
    pending_item_ids: pending,
    arithmetic_reconciled: one === sum('one_time') && monthly === sum('monthly'),
  };
  const findings = validatePricing(config, context, lines);
  const hasPending =
    pending.length > 0 ||
    !!String(answers.other_requirements).trim() ||
    ['not_assessed', 'undecided', 'existing'].includes(String(answers.existing_system));
  const lowerBound = lines.some((line) => line.price_mode === 'from');
  const needsReview =
    hasPending ||
    lowerBound ||
    lines.some((line) => line.price_mode === 'provisional' || line.requires_review) ||
    findings.some((f) => f.severity !== 'information');
  return {
    answers,
    lines,
    backend_tier: backend.tier,
    backend_rule: backend.id,
    one_time_subtotal_pence: one,
    monthly_subtotal_pence: monthly,
    pending_item_ids: pending,
    has_pending_scope: hasPending,
    is_lower_bound: lowerBound,
    is_non_binding: true,
    tax,
    findings,
    state: needsReview ? 'needs_review' : 'indicative',
    versions: {
      services: mobileServices.version,
      pricing: config.version,
      calculation: config.calculation.version,
    },
    manual_adjustments: [],
    approval: null,
    assumptions: [
      ...new Set([
        c.backendNote,
        ...lines.flatMap((line) =>
          [line.assumption, line.scope, ...(line.inclusions ?? [])].filter((v): v is string => !!v),
        ),
      ]),
    ],
    exclusions: [...new Set([...c.conditions, ...lines.flatMap((line) => line.exclusions ?? [])])],
  };
}
