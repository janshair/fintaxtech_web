import catalogue from '../../content/branding-estimate/pricing.json' with { type: 'json' };
import { brandingEstimateCopy as c } from '../../content/branding-estimate';
import {
  answerLabels,
  customEntries,
  selected,
  validateEstimate,
  visibleQuestions,
  OTHER,
} from './rules';
import type { CatalogItem, EstimateAnswers, EstimateLine, EstimateResult } from './types';
export const catalogItems = catalogue.items as Record<string, CatalogItem>;
export const tax = catalogue.tax;
export const money = (minor: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: catalogue.currency }).format(
    minor / 100,
  );
export function calculateEstimate(answers: EstimateAnswers): EstimateResult {
  const invalid = validateEstimate(answers);
  if (invalid) throw new Error(invalid.message);
  const questions = visibleQuestions(answers);
  const lines = new Map<string, EstimateLine>();
  const reviewReasons = new Set<string>();
  const add = (id: string) => {
    if (lines.has(id)) return;
    const item = catalogItems[id];
    if (!item) throw new Error(`Unknown catalogue item: ${id}`);
    const p = item.pricing;
    if (p.type === 'selection') {
      const answer = selected(answers, p.selectionQuestionId!)[0];
      const target = p.optionPricingItemIds?.[answer];
      if (!target) throw new Error('Unresolved catalogue selection');
      add(target);
      return;
    }
    let quantity = 1;
    let deliverables: string[] = [];
    let amountMinor = p.amountMinor ?? null;
    if (p.type === 'category_minimum_with_included_quantity') {
      const q = questions.find((q) => q.id === p.quantitySourceQuestionId);
      if (!q) throw new Error('Inactive quantity source');
      deliverables = answerLabels(q, answers);
      quantity = deliverables.length;
      amountMinor =
        quantity === 0
          ? 0
          : p.minimumAmountMinor! +
            p.additionalItemAmountMinor! * Math.max(0, quantity - p.includedQuantity!);
    } else if (p.type === 'manual_quote') {
      amountMinor = null;
      item.manualReviewReasons.forEach((reason) => reviewReasons.add(reason));
    }
    if (amountMinor !== null && (!Number.isSafeInteger(amountMinor) || amountMinor < 0))
      throw new Error('Invalid catalogue amount');
    lines.set(id, { id, name: item.quoteName, quantity, deliverables, amountMinor });
  };
  for (const q of questions) {
    const ids = selected(answers, q.id);
    for (const option of q.options) {
      if (ids.includes(option.id) && option.pricingRole !== 'count_only') add(option.pricingItemId);
    }
    const entries = customEntries(q, answers);
    if (ids.includes(OTHER) && q.otherOption.enabled) {
      add(q.otherOption.pricingItemId!);
      if (q.otherOption.requiresScopeReview) reviewReasons.add(c.scopeReason(q.label));
      const line = lines.get(q.otherOption.pricingItemId!)!;
      if (line.amountMinor === null) {
        line.deliverables = entries;
        line.quantity = entries.length;
      }
    }
  }
  if (tax.mode !== 'exclusive' || !Number.isFinite(tax.ratePercent))
    throw new Error('VAT configuration required');
  const list = [...lines.values()];
  const subtotalMinor = list.reduce((sum, line) => sum + (line.amountMinor ?? 0), 0);
  const vatMinor = Math.round((subtotalMinor * tax.ratePercent) / 100);
  const incomplete = list.some((line) => line.amountMinor === null);
  return {
    lines: list,
    subtotalMinor,
    vatMinor,
    vatRatePercent: tax.ratePercent,
    knownTotalMinor: subtotalMinor + vatMinor,
    totalMinor: incomplete ? null : subtotalMinor + vatMinor,
    incomplete,
    reviewReasons: [...reviewReasons],
    catalogVersion: catalogue.catalogVersion,
  };
}
