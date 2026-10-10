import { clientBriefDefinitions } from '../lib/client-brief/definitions';
import { createBriefRules, emptyBrief, limits } from '../lib/client-brief/rules';
import {
  isWebsiteBrief,
  reviewedWebsiteSubmission,
  type WebsiteSubmission,
} from '../lib/client-brief/website-submission';

export class SubmissionError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number = limits.long): value is string =>
  typeof value === 'string' &&
  value.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const knownKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

export function validateWebsiteSubmission(input: unknown): WebsiteSubmission {
  if (
    !record(input) ||
    !knownKeys(input, ['kind', 'answers', 'rows', 'additionalPages', 'submissionId', 'trap']) ||
    typeof input.kind !== 'string' ||
    !isWebsiteBrief(input.kind) ||
    input.trap !== '' ||
    !record(input.answers) ||
    !record(input.rows) ||
    !Array.isArray(input.additionalPages)
  )
    throw new SubmissionError('invalid');
  const definition = clientBriefDefinitions[input.kind];
  const fields = definition.sections.flatMap((section) => section.fields);
  const allowed = fields.flatMap((field) => [
    field.id,
    ...(field.options?.includes('Other') ? [`${field.id}Other`] : []),
  ]);
  if (
    !knownKeys(input.answers, allowed) ||
    !knownKeys(
      input.rows,
      fields.filter((field) => field.type === 'rows').map((field) => field.id),
    )
  )
    throw new SubmissionError('invalid');
  const state = emptyBrief();
  for (const [id, answer] of Object.entries(input.answers)) {
    if (!(
      text(answer) ||
      (Array.isArray(answer) &&
        answer.length <= 30 &&
        answer.every((value) => text(value, limits.short)) &&
        new Set(answer).size === answer.length)
    ))
      throw new SubmissionError('invalid');
    state.answers[id] = answer;
  }
  for (const [id, rows] of Object.entries(input.rows)) {
    const field = fields.find((field) => field.id === id)!;
    if (!Array.isArray(rows) || rows.length > (field.repeat!.max ?? 10))
      throw new SubmissionError('invalid');
    state.rows[id] = rows.map((row, index) => {
      if (
        !record(row) ||
        !knownKeys(row, ['id', 'values']) ||
        !record(row.values) ||
        !knownKeys(
          row.values,
          field.repeat!.fields.map((part) => part.key),
        ) ||
        !Object.values(row.values).every((value) => text(value))
      )
        throw new SubmissionError('invalid');
      return { id: String(index), values: row.values as Record<string, string> };
    });
  }
  if (
    input.additionalPages.length > limits.additionalPages ||
    (input.kind === 'websiteDemo' && input.additionalPages.length)
  )
    throw new SubmissionError('invalid');
  state.additionalPages = input.additionalPages.map((page, index) => {
    if (
      !record(page) ||
      !knownKeys(page, ['id', 'name', 'purpose']) ||
      !text(page.name, limits.short) ||
      !text(page.purpose, limits.short)
    )
      throw new SubmissionError('invalid');
    return { id: String(index), name: page.name, purpose: page.purpose };
  });
  const rules = createBriefRules(definition.sections);
  rules.pruneBrief(state);
  if (rules.invalidSection(state) !== -1) throw new SubmissionError('incomplete');
  const normalized = reviewedWebsiteSubmission(input.kind, state);
  for (const value of [
    ...Object.values(normalized.answers).flat(),
    ...Object.values(normalized.rows).flatMap((rows) =>
      rows.flatMap((row) => Object.values(row.values)),
    ),
    ...normalized.additionalPages.flatMap((page) => [page.name, page.purpose]),
  ]) {
    const data = String(value);
    if (
      /(?:password|passwd|api[ _-]?key|access[ _-]?token|secret|authorization)\s*[:=]\s*\S+|\bbearer\s+\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----|https:\/\/hooks\.slack\.com\/services\/|\b(?:xox[baprs]-|gh[pousr]_|sk-[a-zA-Z0-9]{20})/i.test(
        data,
      ) ||
      /https?:\/\/[^\s/@:]+:[^\s/@]+@/i.test(data)
    )
      throw new SubmissionError('sensitive');
  }
  return normalized;
}
