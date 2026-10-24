import { contactField } from './enquiry-contact';
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
  return questions.filter(
    (q) =>
      !q.when ||
      (Array.isArray(q.when.includes) ? q.when.includes : [q.when.includes]).some((value) =>
        includes(journey.answers, q.when!.id, value),
      ),
  );
}
export function includes(answers: Answers, id: string, value: string): boolean {
  const a = answers[id];
  return Array.isArray(a) ? a.includes(value) : a === value;
}
export function needsBranding(journey: Journey): boolean {
  return (
    journey.service === 'websites' &&
    journey.stage === '2' &&
    includes(journey.answers, 'websites-2-4', 'No assets')
  );
}
export function customerSuppliesContent(journey: Journey): boolean {
  return includes(journey.answers, 'websites-2-3', 'Customer provides all approved content');
}
export function questionSummary(question: Question, answers: Answers): SummaryRow[] {
  const answer = answers[question.id];
  if (!answer?.length) return [];
  const rows = [
    { label: question.label, value: Array.isArray(answer) ? answer.join(', ') : answer },
  ];
  const field = contactField(question, answers);
  const detail = field ? answers[field.id] : undefined;
  if (field && typeof detail === 'string' && detail.trim())
    rows.push({ label: field.label, value: detail.trim() });
  return rows;
}
export function visibleSummary(journey: Journey): SummaryRow[] {
  return visibleQuestions(journey).flatMap((question) =>
    questionSummary(question, journey.answers),
  );
}
export function pruneHiddenAnswers(journey: Journey): Answers {
  const ids = new Set(
    visibleQuestions(journey).flatMap((question) => {
      const field = contactField(question, journey.answers);
      return field ? [question.id, field.id] : [question.id];
    }),
  );
  return Object.fromEntries(Object.entries(journey.answers).filter(([id]) => ids.has(id)));
}
export function routeService(index: number) {
  return (['branding', 'websites', 'mobile-apps', 'ai-automation'] as const)[index];
}
