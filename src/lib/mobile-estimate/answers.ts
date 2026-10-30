import { mobileServices as services, mobileEstimateCopy as c } from '../../content/mobile-estimate';
import type { Question } from './schema';
import { evaluate, hasControllers } from './predicates';
export type Answers = Record<string, string | string[]>;
export const questions = services.steps.flatMap((step) => step.questions);
export const initialAnswers = (): Answers => ({
  features: [],
  other_requirements: '',
  qa: 'standard',
  existing_system: 'not_assessed',
  migration_required: 'not_assessed',
  migration_source: 'not_assessed',
});
export function visible(q: Question, answers: Answers) {
  return (
    !q.visible_when ||
    (hasControllers(q.visible_when, answers) && evaluate(q.visible_when, { answers }))
  );
}
export function normalize(answers: Answers): Answers {
  const next = structuredClone(answers);
  for (const q of questions) if (!visible(q, next) && q.hidden_value) next[q.id] = q.hidden_value;
  for (const rule of services.normalization.rules)
    if (evaluate(rule.when, { answers: next })) Object.assign(next, rule.set);
  for (const inclusion of services.automatic_inclusions)
    next[inclusion.answer_field] = inclusion.value;
  return next;
}
export function questionError(q: Question, answers: Answers): string | null {
  const v = answers[q.id];
  if (!visible(q, answers)) return v === q.hidden_value ? null : c.errorInvalid;
  if (q.type === 'textarea')
    return typeof v === 'string' &&
      v.length <= (q.max_length ?? 5000) &&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v)
      ? null
      : c.errorLength;
  if (v === undefined || v === 'not_assessed') return c.errorRequired;
  if (q.type === 'single_select')
    return typeof v === 'string' && q.options!.some((o) => o.id === v) ? null : c.errorInvalid;
  return Array.isArray(v) &&
    v.length >= (q.min_selections ?? 1) &&
    new Set(v).size === v.length &&
    v.every((id) => q.options!.some((o) => o.id === id))
    ? null
    : c.errorInvalid;
}
export function validateAnswers(input: unknown): Answers {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(c.errorInvalid);
  const answers = input as Answers;
  const properties = services.response_schema.properties;
  if (
    Object.keys(answers).some((k) => !Object.hasOwn(properties, k)) ||
    services.response_schema.required.some((k) => !Object.hasOwn(answers, k))
  )
    throw new Error(c.errorRequired);
  for (const [key, rule] of Object.entries(properties)) {
    const value = answers[key];
    if (rule.const && value !== rule.const) throw new Error(c.errorInvalid);
    if (rule.enum && (typeof value !== 'string' || !rule.enum.includes(value)))
      throw new Error(c.errorInvalid);
  }
  for (const q of questions) {
    const error = questionError(q, answers);
    if (error) throw new Error(error);
  }
  return structuredClone(answers);
}
export function answerLabel(q: Question, answers: Answers): string {
  const value = answers[q.id];
  if (value === 'not_assessed') return services.final_review.hidden_status_label;
  if (q.type === 'textarea') return String(value || c.noneWritten);
  const ids = Array.isArray(value) ? value : [value];
  return (
    q
      .options!.filter((o) => ids.includes(o.id))
      .map((o) => o.label)
      .join('; ') || c.noFeatures
  );
}
