import type { BriefState } from './types';

// Output-only wording. Keep stored selections and client-entered service text unchanged.
export const websiteOutputLabels: Record<string, string> = {
  priorityOfferings: 'Priority offerings — services, products, treatments, classes or other offers',
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
