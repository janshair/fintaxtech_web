import { pricing } from './config';
import { z } from 'astro/zod';
import { questions, aiEstimateCopy as c } from '../../content/ai-automation-estimate';
const text = z
  .string()
  .max(5000)
  .refine((v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v));
const selection = z
  .array(z.string())
  .max(20)
  .refine((v) => new Set(v).size === v.length);
const count = z.number().int().min(0).max(1000);
export const answersSchema = z.strictObject({
  service: text,
  outcomes: selection,
  discovery: text.optional(),
  otherOutcome: text.optional(),
  currentProcess: text.optional(),
  processDetails: text.optional(),
  sources: text.optional(),
  usage: text.optional(),
  websiteStatus: text.optional(),
  websiteUrl: text.optional(),
  tools: selection,
  otherTool: text.optional(),
  exchangeDetails: text.optional(),
  bookingMode: text.optional(),
  destination: text.optional(),
  systemDetails: text.optional(),
  knowledge: text.optional(),
  capabilities: selection,
  capabilityDetails: text.optional(),
  additionalWorkflows: count,
  workflowDetails: text.optional(),
  additionalTemplates: count,
  templateDetails: text.optional(),
  sensitivity: text.optional(),
  notes: text.optional(),
  support: text.optional(),
});
export type Answers = z.infer<typeof answersSchema>;
export const initialAnswers = (): Answers => ({
  service: '',
  outcomes: [],
  tools: [],
  capabilities: [],
  additionalWorkflows: 0,
  additionalTemplates: 0,
});
export function questionError(q: ReturnType<typeof questions>[number], a: Answers) {
  if (q.show && !q.show(a)) return null;
  const v = a[q.id as keyof Answers];
  if (
    q.required &&
    (v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length))
  )
    return c.error;
  if (
    typeof v === 'string' &&
    (v.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v))
  )
    return c.error;
  if (q.type === 'number' && (!Number.isSafeInteger(v) || Number(v) < 0 || Number(v) > 1000))
    return c.error;
  if (q.options?.length && v !== undefined) {
    const values = Array.isArray(v) ? v : [v];
    if (values.some((id) => !q.options!.some((o) => o.id === id))) return c.error;
  }
  return null;
}
export function validateAnswers(input: unknown): Answers {
  const a = answersSchema.parse(input);
  for (let step = 0; step < 5; step++)
    for (const q of questions(step, a)) if (questionError(q, a)) throw Error(c.error);
  if (a.tools.includes('none') && a.tools.length > 1) throw Error(c.error);
  if (!['self', 'care', 'plus'].includes(a.support ?? '')) throw Error(c.error);
  return a;
}
export function summary(a: Answers): string[] {
  return Array.from({ length: 5 }, (_, step) => questions(step, a))
    .flat()
    .filter((q) => (!q.show || q.show(a)) && a[q.id as keyof Answers] !== undefined)
    .map((q) => {
      const value = a[q.id as keyof Answers];
      const label = (v: unknown) =>
        (q.id === 'support'
          ? pricing.supportPlans.find((p) => p.id === v)?.name
          : q.options?.find((o) => o.id === v)?.label) ?? String(v);
      return `${q.label}: ${Array.isArray(value) ? value.map(label).join('; ') : label(value)}`;
    });
}
