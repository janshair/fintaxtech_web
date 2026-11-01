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

export const price = {
  source: '^(?:[Ff]rom )?£\\d{1,5}(?:\\.\\d{2})?$',
  message: 'Enter a price like £30 or From £30.',
};

// Trimmed row values in order, or null when the customer chose the sample.
export function rowValues(
  answers: BriefAnswers,
  rows: BriefState['rows'],
  source: string,
  id: string,
): Record<string, string>[] | null {
  if (answers[source] !== ownWords) return null;
  return (rows[id] ?? []).map((row) =>
    Object.fromEntries(Object.entries(row.values).map(([key, value]) => [key, value.trim()])),
  );
}
