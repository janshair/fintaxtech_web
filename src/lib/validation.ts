import type { Answer, Question } from './types';
import { quizCopy as c } from '../content/questionnaire';
export function exclusive(value: string) {
  return /^(none|not sure|unsure|undecided|open to recommendation|no identity|no assets|nothing specific)$/i.test(
    value,
  );
}
export function validateAnswer(q: Question, a: Answer | undefined): string | null {
  if (a === undefined || a.length === 0) {
    return q.optional ? null : c.errorRequired;
  }
  if (q.type === 'text') {
    return typeof a !== 'string' || a.length > 2000 ? c.errorLength : null;
  }
  const selected = Array.isArray(a) ? a : [a];
  if (selected.some((value) => !q.options?.includes(value))) return c.errorRequired;
  if (q.type === 'single' && selected.length !== 1) return c.errorRequired;
  if (q.max && selected.length > q.max) return c.errorLimit(q.max);
  if (selected.length > 1 && selected.some(exclusive)) return c.errorExclusive;
  return null;
}
export function validEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function validCompanyNumber(value: string) {
  return /^(?:\d{8}|[A-Z]{2}\d{6})$/.test(value.toUpperCase().replace(/\s/g, ''));
}
