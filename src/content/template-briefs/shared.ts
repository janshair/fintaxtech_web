import type { BriefAnswers, BriefField, BriefState } from '../../lib/client-brief/types';

// Every optional content group offers the template's sample, so nobody is blocked.
export const ownWords = 'I’ll enter my own';
export const useSample = 'Use the template’s sample for now';
export const sampleChoice = (id: string, label: string, help?: string): BriefField => ({
  id,
  label,
  type: 'single',
  options: [ownWords, useSample],
  help,
});
export const whenOwn = (id: string) => ({ id, values: [ownWords] });

export const price = { kind: 'price' } as const;
export const duration = { kind: 'duration' } as const;
// Keep the template's own wording, or write your own steps.
export const keepSteps = 'Keep the template’s steps';
export const writeSteps = 'Write my own';
export const stepsChoice = (id: string, label: string, help?: string): BriefField => ({
  id,
  label,
  type: 'single',
  options: [keepSteps, writeSteps],
  help,
});
export const whenWritten = (id: string) => ({ id, values: [writeSteps] });
// Steps as [title, line] pairs, the shape every content file uses.
export const stepPairs = (
  answers: BriefAnswers,
  rows: BriefState['rows'],
  source: string,
  id: string,
) =>
  answers[source] === writeSteps
    ? (rows[id] ?? []).map((row) => [row.values.title, row.values.line] as [string, string])
    : null;

// Row values in order (already tidied by the brief), or null when the customer chose the sample.
export function rowValues(
  answers: BriefAnswers,
  rows: BriefState['rows'],
  source: string,
  id: string,
): Record<string, string>[] | null {
  if (answers[source] !== ownWords) return null;
  return (rows[id] ?? []).map((row) => ({ ...row.values }));
}

// Fixed-count steps, written as [title, line] pairs.
export const stepRows = (
  id: string,
  source: string,
  count: number,
  limits: { title: number; line: number },
): BriefField => ({
  id,
  label: 'Your steps',
  type: 'rows',
  when: whenWritten(source),
  repeat: {
    title: (n) => `Step ${n}`,
    add: 'Add a step',
    remove: (n) => `Remove step ${n}`,
    min: count,
    max: count,
    fields: [
      { key: 'title', label: 'Step name', type: 'text', maxLength: limits.title },
      {
        key: 'line',
        label: 'One or two lines about this step',
        type: 'text',
        maxLength: limits.line,
      },
    ],
  },
});

// Questions and answers, written as [question, answer] pairs.
export const faqRows = (
  id: string,
  source: string,
  count: { min: number; max: number },
  limits = { question: 60, answer: 200 },
): BriefField => ({
  id,
  label: 'Your questions and answers',
  type: 'rows',
  when: whenOwn(source),
  help: 'Answer what customers really ask. Only describe policies you actually have.',
  repeat: {
    title: (n) => `Question ${n}`,
    add: 'Add a question',
    remove: (n) => `Remove question ${n}`,
    ...count,
    fields: [
      { key: 'question', label: 'Question', type: 'text', maxLength: limits.question },
      { key: 'answer', label: 'Answer', type: 'long', maxLength: limits.answer },
    ],
  },
});
export const faqPairs = (
  answers: BriefAnswers,
  rows: BriefState['rows'],
  source: string,
  id: string,
) =>
  rowValues(answers, rows, source, id)?.map(
    (row) => [row.question, row.answer] as [string, string],
  ) ?? null;

// Captions for illustrated examples; your own photos replace them later.
export const captionRows = (
  id: string,
  source: string,
  count: number,
  labels: { title: string; caption: string },
  limits: { title: number; caption: number },
): BriefField => ({
  id,
  label: 'Your captions',
  type: 'rows',
  when: whenOwn(source),
  repeat: {
    title: (n) => `Example ${n}`,
    add: 'Add a caption',
    remove: (n) => `Remove caption ${n}`,
    min: count,
    max: count,
    fields: [
      { key: 'title', label: labels.title, type: 'text', maxLength: limits.title },
      { key: 'caption', label: labels.caption, type: 'text', maxLength: limits.caption },
    ],
  },
});
// Design keys (icons, artwork) the customer doesn't choose are reused from the template in order.
export const cycle = <T>(items: readonly T[], index: number) => items[index % items.length];
export const slug = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
export const optionKey = <T extends string>(options: Record<T, string>, value: unknown) =>
  (Object.entries(options) as [T, string][]).find(([, label]) => label === value)?.[0] ?? null;
