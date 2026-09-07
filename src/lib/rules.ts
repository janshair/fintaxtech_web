import type { Answers, Journey, Question, SummaryRow } from './types';
import { questionSets } from '../content/questions';
import { promoQuestions, redesignGate, customPage, avoidDetail } from '../content/questionnaire';
import type { PromoStatus } from '../content/promo';
export function promoAllowed(status: PromoStatus, requested: boolean): boolean {
  return requested && status !== 'closed';
}
export function visibleQuestions(journey: Journey): Question[] {
  let questions: Question[] = [...questionSets[journey.service][journey.stage]];
  if (journey.short)
    questions = questionSets.branding['2'].filter((q) =>
      [
        'branding-2-1',
        'branding-2-2',
        'branding-2-3',
        'branding-2-4',
        'branding-2-5',
        'branding-2-11',
      ].includes(q.id),
    );
  if (journey.service === 'websites' && journey.stage === '2')
    questions = [redesignGate, ...questions.slice(0, -1), customPage, questions.at(-1)!];
  if (journey.service === 'branding' && journey.stage === '2' && !journey.short)
    questions.splice(questions.length - 1, 0, avoidDetail);
  if (journey.promo && journey.service === 'websites')
    questions = [...promoQuestions, ...questions];
  return questions.filter((q) => !q.when || includes(journey.answers, q.when.id, q.when.includes));
}
export function includes(answers: Answers, id: string, value: string): boolean {
  const a = answers[id];
  return Array.isArray(a) ? a.includes(value) : a === value;
}
export function needsBranding(journey: Journey): boolean {
  return (
    journey.service === 'websites' &&
    (includes(journey.answers, 'websites-1-5', 'No assets') ||
      includes(journey.answers, 'websites-2-4', 'No assets'))
  );
}
export function customerSuppliesContent(journey: Journey): boolean {
  return includes(journey.answers, 'websites-2-3', 'Customer provides all approved content');
}
export function visibleSummary(journey: Journey): SummaryRow[] {
  return visibleQuestions(journey).flatMap((q) => {
    const answer = journey.answers[q.id];
    return answer && answer.length
      ? [{ label: q.label, value: Array.isArray(answer) ? answer.join(', ') : answer }]
      : [];
  });
}
export function pruneHiddenAnswers(journey: Journey): Answers {
  const ids = new Set(visibleQuestions(journey).map((q) => q.id));
  return Object.fromEntries(Object.entries(journey.answers).filter(([id]) => ids.has(id)));
}
export function routeService(index: number) {
  return (['branding', 'websites', 'mobile-apps', 'prompt-services'] as const)[index];
}
