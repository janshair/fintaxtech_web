import { estimateQuestions, brandingEstimateCopy as c } from '../../content/branding-estimate';
import { validContactEmail, validWhatsAppNumber } from '../validation';
import type { EstimateAnswers, EstimateCustomer, EstimateQuestion } from './types';
export const OTHER = 'other';
const clean = (value: string) => value.trim().normalize('NFC');
const validText = (value: unknown, max: number) =>
  typeof value === 'string' && value.length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
export function selected(answers: EstimateAnswers, id: string): string[] {
  return [...new Set(answers[id]?.selected ?? [])];
}
export function visibleQuestions(answers: EstimateAnswers): EstimateQuestion[] {
  // Only currently visible answers can activate another question. The service is fixed by this route.
  const active: Record<string, string[]> = { 'selected-services': ['branding'] };
  return estimateQuestions.filter((q) => {
    const visible = q.visibility.rules.every((rule) => {
      const values = active[rule.questionId] ?? [];
      return rule.operator === 'contains'
        ? values.includes(rule.value as string)
        : (rule.value as string[]).some((v) => values.includes(v));
    });
    if (visible) active[q.id] = selected(answers, q.id);
    return visible;
  });
}
export function customEntries(q: EstimateQuestion, answers: EstimateAnswers): string[] {
  return q.otherOption.enabled && selected(answers, q.id).includes(OTHER)
    ? (answers[q.id]?.other ?? []).map(clean).filter(Boolean)
    : [];
}
export function answerLabels(q: EstimateQuestion, answers: EstimateAnswers): string[] {
  const ids = selected(answers, q.id);
  return [
    ...q.options.filter((o) => ids.includes(o.id)).map((o) => o.label),
    ...customEntries(q, answers),
  ];
}
export function validateEstimateQuestion(
  q: EstimateQuestion,
  answers: EstimateAnswers,
): string | null {
  const answer = answers[q.id];
  if (!answer || !Array.isArray(answer.selected) || !answer.selected.length)
    return q.required ? c.errorRequired : null;
  const ids = selected(answers, q.id);
  if (
    ids.some(
      (id) => !q.options.some((o) => o.id === id) && !(q.otherOption.enabled && id === OTHER),
    ) ||
    ids.length < q.selectionRules.minimum ||
    (q.selectionRules.maximum !== null && ids.length > q.selectionRules.maximum) ||
    (q.answerType === 'single_select' && ids.length !== 1)
  )
    return c.errorSelection;
  if (ids.includes(OTHER)) {
    if (
      !Array.isArray(answer.other) ||
      answer.other.length < (q.otherOption.minimumEntries ?? 1) ||
      (q.otherOption.maximumEntries != null &&
        answer.other.length > q.otherOption.maximumEntries) ||
      answer.other.some((v) => !validText(v, 300) || !v.trim())
    )
      return c.errorOther;
    const labels = answerLabels(q, answers).map((v) => clean(v).toLocaleLowerCase('en-GB'));
    if (new Set(labels).size !== labels.length) return c.errorDuplicate;
  }
  return null;
}
export function validateEstimate(answers: EstimateAnswers): { id: string; message: string } | null {
  for (const q of visibleQuestions(answers)) {
    const message = validateEstimateQuestion(q, answers);
    if (message) return { id: q.id, message };
  }
  return null;
}
export function validateCustomer(customer: EstimateCustomer): string | null {
  if (
    !validText(customer.name, 150) ||
    !customer.name.trim() ||
    !validText(customer.business, 150) ||
    !validText(customer.email, 254) ||
    !validContactEmail(customer.email) ||
    !validText(customer.phone, 32) ||
    (customer.phone.trim() && !validWhatsAppNumber(customer.phone))
  )
    return c.errorCustomer;
  return null;
}
export function cleanCustomer(customer: EstimateCustomer): EstimateCustomer {
  return Object.fromEntries(
    Object.entries(customer).map(([key, value]) => [key, clean(value)]),
  ) as unknown as EstimateCustomer;
}
