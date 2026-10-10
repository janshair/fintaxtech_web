import type { BriefAnswers, BriefState } from './types';

// Output-only wording. Keep stored selections and client-entered service text unchanged.
export const websiteOutputLabels: Record<string, string> = {
  priorityOfferings: 'Priority services / products',
  verifiedFacts: 'Business facts / source material supplied by client',
  provisionalAssets: 'Provisional styling and placeholder imagery permissions',
};

export function priorityOfferingsText(rows: BriefState['rows'][string] = []) {
  return rows
    .map((row, index) => `${index + 1}. ${row.values.description?.trim() || 'Not provided'}`)
    .join('\n');
}

export function omitPrioritySource(id: string, state: Pick<BriefState, 'answers' | 'rows'>) {
  return (
    id === 'prioritySource' &&
    state.answers.prioritySource === 'I will list up to three' &&
    !!state.rows.priorityOfferings?.some((row) => row.values.description?.trim())
  );
}

export function provisionalAssetPermission(answer: BriefAnswers[string]) {
  const wording: Record<string, string> = {
    'Both are acceptable': 'Provisional styling permitted; placeholder imagery permitted.',
    'Provisional styling only':
      'Provisional styling permitted; placeholder imagery not permitted.',
    'Placeholder imagery only':
      'Provisional styling not permitted; placeholder imagery permitted.',
    Neither: 'Provisional styling not permitted; placeholder imagery not permitted.',
    'Please ask me first':
      'Ask the client before using provisional styling or placeholder imagery; neither is authorized yet.',
  };
  return typeof answer === 'string' && answer.trim()
    ? (wording[answer] ?? answer)
    : 'Not provided';
}
