import { clientBriefDefinitions } from './definitions';
import { createBriefRules, isVisible, requiresOtherText } from './rules';
import type { BriefAnswers, BriefState } from './types';

export type WebsiteBriefKind = 'website' | 'websiteDemo';
export const websiteSubmissionPath = '/api/website-brief/';
export const websitePayloadLimit = 256 * 1024;
export interface WebsiteSubmission {
  kind: WebsiteBriefKind;
  answers: BriefAnswers;
  additionalPages: BriefState['additionalPages'];
  rows: BriefState['rows'];
}
export interface DeliveryResult {
  status: 'delivered' | 'failed' | 'partial' | 'uncertain' | 'expired';
  submissionId?: string;
  delivered: number;
  total: number;
  retryable?: boolean;
  retryAfter?: number;
  code?: string;
}
export const isWebsiteBrief = (kind: string): kind is WebsiteBriefKind =>
  kind === 'website' || kind === 'websiteDemo';

// A canonical snapshot of applicable answers. Row IDs are UI details, not brief content.
export function reviewedWebsiteSubmission(
  kind: WebsiteBriefKind,
  source: BriefState,
): WebsiteSubmission {
  const definition = clientBriefDefinitions[kind];
  const rules = createBriefRules(definition.sections);
  const state = structuredClone(source);
  rules.pruneBrief(state);
  const answers: BriefAnswers = {};
  const rows: BriefState['rows'] = {};
  let additionalPages: BriefState['additionalPages'] = [];
  for (const field of rules.visibleSections(state.answers).flatMap((section) => section.fields)) {
    if (!isVisible(field, state.answers)) continue;
    const answer = state.answers[field.id];
    if (Array.isArray(answer) && answer.length)
      answers[field.id] = field.options!.filter((value) => answer.includes(value));
    else if (typeof answer === 'string' && answer.trim()) answers[field.id] = answer.trim();
    if (requiresOtherText(field, state.answers))
      answers[`${field.id}Other`] = String(state.answers[`${field.id}Other`] ?? '').trim();
    if (field.type === 'rows' && state.rows[field.id]?.length)
      rows[field.id] = state.rows[field.id].map((row, index) => ({
        id: String(index),
        values: Object.fromEntries(
          field
            .repeat!.fields.filter((part) => isVisible(part, row.values))
            .map((part) => [part.key, (row.values[part.key] ?? '').trim()]),
        ),
      }));
    if (field.type === 'pages')
      additionalPages = state.additionalPages.map((page, index) => ({
        id: String(index),
        name: page.name.trim(),
        purpose: page.purpose.trim(),
      }));
  }
  return { kind, answers, additionalPages, rows };
}
