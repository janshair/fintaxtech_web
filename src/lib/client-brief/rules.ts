import { briefCopy as c } from '../../content/client-brief';
import type { BriefAnswers, BriefField, BriefState, BriefSummary, BriefSection } from './types';

export const limits = {
  short: 240,
  long: 2000,
  images: 5,
  competitors: 5,
  additionalPages: 10,
  imageBytes: 5 * 1024 * 1024,
  imageSide: 1600,
} as const;
export const emptyBrief = (): BriefState => ({
  answers: {},
  competitors: [],
  images: [],
  additionalPages: [],
  rows: {},
});
export const includesAnswer = (value: BriefAnswers[string], option: string) =>
  Array.isArray(value) ? value.includes(option) : value === option;
export const isVisible = (field: BriefField, answers: BriefAnswers): boolean =>
  !field.when || field.when.values.some((value) => includesAnswer(answers[field.when!.id], value));
export const hasOther = (field: BriefField, answers: BriefAnswers) =>
  isVisible(field, answers) && includesAnswer(answers[field.id], c.other);
export const requiresOtherText = (field: BriefField, answers: BriefAnswers) =>
  hasOther(field, answers) && !field.otherField;
export const fieldOptions = (field: BriefField, answers: BriefAnswers): string[] => {
  const source = field.optionsFrom ? answers[field.optionsFrom.id] : undefined;
  return [
    ...(Array.isArray(source)
      ? source.filter((option) => !field.optionsFrom?.exclude?.includes(option))
      : []),
    ...(field.options ?? []),
  ];
};
export function toggleChoice(field: BriefField, selected: string[], option: string): string[] {
  if (selected.includes(option)) return selected.filter((item) => item !== option);
  const exclusive = field.exclusive ?? [c.noPreference];
  if (exclusive.includes(option)) return [option];
  const next = selected.filter((item) => !exclusive.includes(item));
  return field.max && next.length >= field.max ? selected : [...next, option];
}
export const normalizedPageName = (name: string) =>
  name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-GB');
export function createBriefRules(sections: BriefSection[]) {
  const visibleSections = (answers: BriefAnswers) =>
    sections.filter(
      (section) =>
        !section.when ||
        section.when.values.some((value) => includesAnswer(answers[section.when!.id], value)),
    );
  function pruneBrief(state: BriefState) {
    const applicable = new Set(
      visibleSections(state.answers).flatMap((section) => section.fields.map((field) => field.id)),
    );
    for (const field of sections.flatMap((s) => s.fields)) {
      if (!applicable.has(field.id) || !isVisible(field, state.answers)) {
        delete state.answers[field.id];
        if (field.type === 'rows') delete state.rows[field.id];
      }
      if (!requiresOtherText(field, state.answers)) delete state.answers[`${field.id}Other`];
      if (field.optionsFrom && Array.isArray(state.answers[field.id])) {
        const allowed = fieldOptions(field, state.answers);
        state.answers[field.id] = (state.answers[field.id] as string[]).filter((value) =>
          allowed.includes(value),
        );
      }
    }
    if (state.answers.references !== 'Yes') state.images = [];
  }
  function validateField(field: BriefField, state: BriefState): string | undefined {
    if (!isVisible(field, state.answers)) return;
    const answer = state.answers[field.id];
    if (field.type === 'rows' && field.repeat) {
      const rows = state.rows[field.id] ?? [];
      if (!rows.length) return field.optional ? undefined : c.rowRequired;
      if (field.repeat.max && rows.length > field.repeat.max) return c.rowLimit(field.repeat.max);
      const source = sections
        .flatMap((section) => section.fields)
        .find((f) => f.id === field.repeat?.unique?.againstOptionsFrom);
      const names = new Set((source?.options ?? []).map(normalizedPageName));
      for (const row of rows) {
        for (const part of field.repeat.fields) {
          const value = row.values[part.key] ?? '';
          if (!value.trim() && !part.optional) return c.missing;
          if (value.length > limits.short) return c.tooLong(limits.short);
          if (part.type === 'single' && value && !part.options?.includes(value))
            return c.invalidChoice;
        }
        if (field.repeat.unique) {
          const key = normalizedPageName(row.values[field.repeat.unique.key] ?? '');
          if (names.has(key)) return c.rowDuplicate;
          names.add(key);
        }
      }
      return;
    }
    if (field.type === 'competitors') {
      if (state.competitors.length > limits.competitors) return c.maxCompetitors;
      for (const competitor of state.competitors) {
        if (!competitor.name.trim()) return c.missing;
        if (competitor.name.length > limits.short || competitor.website.length > limits.short)
          return c.tooLong(limits.short);
        if (competitor.website.trim()) {
          try {
            const url = new URL(competitor.website.trim());
            if (!['http:', 'https:'].includes(url.protocol) || !url.hostname)
              return c.invalidWebsite;
          } catch {
            return c.invalidWebsite;
          }
        }
      }
      return;
    }
    if (field.type === 'pages') {
      if (state.additionalPages.length > limits.additionalPages) return c.pageLimit;
      if (!state.additionalPages.length && !(state.answers.pages as string[] | undefined)?.length)
        return c.pageRequired;
      const names = new Set(
        (
          sections.flatMap((section) => section.fields).find((f) => f.id === 'pages')?.options ?? []
        ).map(normalizedPageName),
      );
      for (const page of state.additionalPages) {
        if (!page.name.trim()) return c.missing;
        if (page.name.length > limits.short || page.purpose.length > limits.short)
          return c.tooLong(limits.short);
        const key = normalizedPageName(page.name);
        if (names.has(key)) return c.pageDuplicate;
        names.add(key);
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
      if (
        !Array.isArray(answer) ||
        answer.some((item) => !fieldOptions(field, state.answers).includes(item))
      )
        return c.invalidChoice;
      if (field.max && answer.length > field.max) return c.tooMany(field.max);
      if (
        (field.exclusive ?? [c.noPreference]).some((item) => answer.includes(item)) &&
        answer.length > 1
      )
        return c.invalidChoice;
    } else if (field.type === 'single') {
      if (typeof answer !== 'string' || !field.options?.includes(answer)) return c.invalidChoice;
    } else {
      const max = field.type === 'long' || field.type === 'urls' ? limits.long : limits.short;
      if (typeof answer !== 'string') return c.missing;
      if (answer.length > max) return c.tooLong(max);
      if (field.type === 'url') {
        try {
          if (!['http:', 'https:'].includes(new URL(answer).protocol)) return c.invalidURL;
        } catch {
          return c.invalidURL;
        }
      }
      if (field.type === 'urls') {
        for (const line of answer.split(/\r?\n/).filter((line) => line.trim())) {
          try {
            if (!['http:', 'https:'].includes(new URL(line.trim()).protocol)) return c.invalidURLs;
          } catch {
            return c.invalidURLs;
          }
        }
      }
      if (
        field.type === 'date' &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(answer) ||
          Number.isNaN(Date.parse(answer)) ||
          new Date(answer).toISOString().slice(0, 10) !== answer)
      )
        return c.invalidDate;
    }
    if (requiresOtherText(field, state.answers)) {
      const detail = state.answers[`${field.id}Other`];
      if (typeof detail !== 'string' || !detail.trim()) return c.missing;
      if (detail.length > limits.short) return c.tooLong(limits.short);
    }
  }
  function invalidSection(state: BriefState): number {
    return visibleSections(state.answers).findIndex((section) =>
      section.fields.some((f) => validateField(f, state)),
    );
  }
  function briefSummary(state: BriefState): BriefSummary[] {
    return visibleSections(state.answers).map((section) => ({
      title: section.title,
      references: section.fields.some(
        (field) => field.type === 'images' && isVisible(field, state.answers),
      ),
      rows: section.fields
        .filter((field) => isVisible(field, state.answers) && field.type !== 'images')
        .flatMap((field) => {
          if (field.type === 'rows' && field.repeat) {
            const repeat = field.repeat;
            return (state.rows[field.id] ?? []).map((row, index) => ({
              label: repeat.title(index + 1),
              value: repeat.fields
                .map((part) => `${part.label}: ${row.values[part.key]?.trim() || c.notProvided}`)
                .join('\n'),
            }));
          }
          if (field.type === 'pages' && state.additionalPages.length)
            return state.additionalPages.map((page, index) => ({
              label: c.additionalPage(index + 1),
              value: `${page.name.trim()}${page.purpose.trim() ? `\n${c.pagePurpose}: ${page.purpose.trim()}` : ''}`,
            }));
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
              item === c.other && !field.otherField
                ? `${c.other}: ${String(state.answers[`${field.id}Other`] ?? '').trim()}`
                : item;
            value = Array.isArray(answer)
              ? answer.map(format).join('; ')
              : format(String(answer).trim());
          }
          const rows = [{ label: field.label, value }];
          if (
            field.followUp?.pdfNote &&
            field.followUp.values.some((option) => includesAnswer(answer, option))
          )
            rows.push({ label: c.scopeReview, value: field.followUp.pdfNote });
          return rows;
        }),
    }));
  }

  return { visibleSections, pruneBrief, validateField, invalidSection, briefSummary };
}
