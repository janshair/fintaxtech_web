import { contactField } from './enquiry-contact';
import type { Answer, Answers, Question } from './types';
import { quizCopy as c } from '../content/questionnaire';
export function exclusive(value: string) {
  return /^(none|not sure|unsure|undecided|open to recommendation|no identity|no assets|nothing specific)$/i.test(
    value,
  );
}
export function validateAnswer(q: Question, a: Answer | undefined): string | null {
  if (a === undefined || a.length === 0 || (typeof a === 'string' && !a.trim())) {
    return q.optional ? null : c.errorRequired;
  }
  if (q.type === 'text') {
    return typeof a !== 'string' || a.length > 2000 ? c.errorLength : null;
  }
  if (q.type === 'contact' && typeof a !== 'string') return c.errorRequired;
  const selected = Array.isArray(a) ? a : [a];
  if (selected.some((value) => !q.options?.includes(value))) return c.errorRequired;
  if ((q.type === 'single' || q.type === 'contact') && selected.length !== 1)
    return c.errorRequired;
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

// Stage 1 contact fields are required. Keep the optional legacy contact helper
// above unchanged for the detailed questionnaires and post-payment briefs.
export function validContactEmail(value: string): boolean {
  const email = value.trim();
  if (!email || email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  const labels = domain.split('.');
  return (
    local.length <= 64 &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) &&
    !local.startsWith('.') &&
    !local.endsWith('.') &&
    !local.includes('..') &&
    labels.length >= 2 &&
    labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(labels.at(-1)!)
  );
}

export function validWhatsAppNumber(value: string): boolean {
  const raw = value.trim();
  if (raw.length > 32 || !/^[+0-9 ()-]+$/.test(raw)) return false;
  if ((raw.match(/\(/g)?.length ?? 0) !== (raw.match(/\)/g)?.length ?? 0)) return false;
  const number = raw.replace(/[ ()-]/g, '').replace(/^00/, '+');
  if (number.startsWith('+44')) return /^\+44[1-9]\d{9}$/.test(number);
  if (number.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(number);
  return /^0[1-9]\d{9}$/.test(number);
}

export function validateQuestion(question: Question, answers: Answers): string | null {
  const error = validateAnswer(question, answers[question.id]);
  if (error) return error;
  const field = contactField(question, answers);
  if (!field) return null;
  const value = answers[field.id];
  const valid =
    typeof value === 'string' &&
    (field.type === 'email' ? validContactEmail(value) : validWhatsAppNumber(value));
  return valid ? null : field.type === 'email' ? c.contactEmailError : c.contactWhatsAppError;
}
