import { logoBriefCopy as c, logoBriefSections } from '../../content/logo-brief';
import type { BriefAnswers, BriefField, BriefState, BriefSummary } from './types';

export const limits = {
  short: 240,
  long: 2000,
  images: 5,
  competitors: 5,
  imageBytes: 5 * 1024 * 1024,
  imageSide: 1600,
} as const;
export const emptyBrief = (): BriefState => ({ answers: {}, competitors: [], images: [] });
export const includesAnswer = (value: BriefAnswers[string], option: string) =>
  Array.isArray(value) ? value.includes(option) : value === option;
export const isVisible = (field: BriefField, answers: BriefAnswers): boolean =>
  !field.when || field.when.values.some((value) => includesAnswer(answers[field.when!.id], value));
export const hasOther = (field: BriefField, answers: BriefAnswers) =>
  isVisible(field, answers) && includesAnswer(answers[field.id], c.other);
export function toggleChoice(field: BriefField, selected: string[], option: string): string[] {
  if (selected.includes(option)) return selected.filter((item) => item !== option);
  if (option === c.noPreference) return [option];
  const next = selected.filter((item) => item !== c.noPreference);
  return field.max && next.length >= field.max ? selected : [...next, option];
}
export function pruneBrief(state: BriefState) {
  for (const field of logoBriefSections.flatMap((s) => s.fields)) {
    if (!isVisible(field, state.answers)) delete state.answers[field.id];
    if (!hasOther(field, state.answers)) delete state.answers[`${field.id}Other`];
  }
  if (state.answers.references !== 'Yes') state.images = [];
}
export function validateField(field: BriefField, state: BriefState): string | undefined {
  if (!isVisible(field, state.answers)) return;
  const answer = state.answers[field.id];
  if (field.type === 'competitors') {
    if (state.competitors.length > limits.competitors) return c.maxCompetitors;
    for (const competitor of state.competitors) {
      if (!competitor.name.trim()) return c.missing;
      if (competitor.name.length > limits.short || competitor.website.length > limits.short)
        return c.tooLong(limits.short);
      if (competitor.website.trim()) {
        try {
          const url = new URL(competitor.website.trim());
          if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return c.invalidWebsite;
        } catch {
          return c.invalidWebsite;
        }
      }
    }
    return;
  }
  if (field.type === 'images') {
    if (!state.images.length) return c.imagesRequired;
    if (state.images.length > limits.images) return c.imageLimit;
    for (const image of state.images) {
      if (!image.explanation.trim()) return c.missing;
      if (image.explanation.length > limits.short) return c.tooLong(limits.short);
    }
    return;
  }
  if (field.type === 'confirm')
    return answer === true && String(state.answers.trading ?? '').trim() ? undefined : c.missing;
  if (
    answer === undefined ||
    answer === '' ||
    (Array.isArray(answer) && !answer.length) ||
    (typeof answer === 'string' && !answer.trim())
  )
    return field.optional ? undefined : c.missing;
  if (field.type === 'multi') {
    if (!Array.isArray(answer) || answer.some((item) => !field.options?.includes(item)))
      return c.invalidChoice;
    if (field.max && answer.length > field.max) return c.tooMany(field.max);
    if (answer.includes(c.noPreference) && answer.length > 1) return c.invalidChoice;
  } else if (field.type === 'single') {
    if (typeof answer !== 'string' || !field.options?.includes(answer)) return c.invalidChoice;
  } else {
    const max = field.type === 'long' ? limits.long : limits.short;
    if (typeof answer !== 'string') return c.missing;
    if (answer.length > max) return c.tooLong(max);
    if (
      field.type === 'date' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(answer) ||
        Number.isNaN(Date.parse(answer)) ||
        new Date(answer).toISOString().slice(0, 10) !== answer)
    )
      return c.invalidDate;
  }
  if (hasOther(field, state.answers)) {
    const detail = state.answers[`${field.id}Other`];
    if (typeof detail !== 'string' || !detail.trim()) return c.missing;
    if (detail.length > limits.short) return c.tooLong(limits.short);
  }
}
export function invalidSection(state: BriefState): number {
  return logoBriefSections.findIndex((section) =>
    section.fields.some((f) => validateField(f, state)),
  );
}
export function briefSummary(state: BriefState): BriefSummary[] {
  return logoBriefSections.map((section) => ({
    title: section.title,
    references: section.fields.some(
      (field) => field.type === 'images' && isVisible(field, state.answers),
    ),
    rows: section.fields
      .filter((field) => isVisible(field, state.answers) && field.type !== 'images')
      .map((field) => {
        const answer = state.answers[field.id];
        let value = c.notProvided;
        if (field.type === 'competitors')
          value =
            state.competitors
              .map(
                (item, i) =>
                  `${c.competitor(i + 1)}: ${item.name.trim()}${item.website.trim() ? ` — ${item.website.trim()}` : ''}`,
              )
              .join('\n') || c.notProvided;
        else if (field.type === 'confirm') value = answer === true ? c.confirmed : c.notProvided;
        else if (answer) {
          const format = (item: string) =>
            item === c.other
              ? `${c.other}: ${String(state.answers[`${field.id}Other`] ?? '').trim()}`
              : item;
          value = Array.isArray(answer)
            ? answer.map(format).join('; ')
            : format(String(answer).trim());
        }
        return { label: field.label, value };
      }),
  }));
}
