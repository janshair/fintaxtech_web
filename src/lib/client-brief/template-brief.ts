import {
  colourOptions,
  fileChoices,
  fileOptions,
  filesFieldId,
  logoOptions,
  ownWords,
  qualificationOptions,
  reviewOptions,
  templateBriefSections,
  templateByChoice,
  templateName,
  useSample,
} from '../../content/template-brief';
import { templateBriefSchemas } from '../../content/template-briefs';
import { keepSteps } from '../../content/template-briefs/shared';
import { briefCopy as c } from '../../content/client-brief';
import { ukPhone } from '../uk-phone';
import { dayHoursText, groupHours, tidy, weekDays } from './formats';
import { createBriefRules, formatted, hasRows, isVisible } from './rules';
import type { BriefAnswers, BriefField, BriefState } from './types';

const rules = createBriefRules(templateBriefSections);
const fields = templateBriefSections.flatMap((section) => section.fields);
const text = (answers: BriefAnswers, id: string) => {
  const value = answers[id];
  return typeof value === 'string' && value ? value : null;
};
const own = (answers: BriefAnswers, source: string, id: string) =>
  answers[source] === ownWords ? text(answers, id) : null;
const choice = <T extends string>(options: Record<T, string>, value: unknown) =>
  (Object.entries(options) as [T, string][]).find(([, label]) => label === value)?.[0] ?? null;

// Applicable answers only, with every text tidied (trimmed, single spaces) and
// formatted values in their tidy form: "1 h 30" → "1 hr 30 min", "£ 30" → "£30".
// Spelling and punctuation stay exactly as typed.
function prepared(source: Pick<BriefState, 'answers' | 'rows'>) {
  const state: BriefState = {
    ...structuredClone(source),
    competitors: [],
    additionalPages: [],
    images: [],
  };
  rules.pruneBrief(state);
  const clean = (value: string, format: BriefField['format']) =>
    formatted(format, tidy(value)) ?? tidy(value);
  for (const field of fields) {
    const answer = state.answers[field.id];
    if (typeof answer === 'string') state.answers[field.id] = clean(answer, field.format);
    if (hasRows(field))
      for (const row of state.rows[field.id] ?? [])
        for (const part of field.repeat!.fields)
          if (typeof row.values[part.key] === 'string')
            row.values[part.key] = clean(row.values[part.key], part.format);
  }
  return state;
}

// The JSON block of the .txt. Skipped or sample content is null, so the build
// keeps the demo's copy; empty reviews and qualifications hide those sections.
export function toTemplateBriefData(source: Pick<BriefState, 'answers' | 'rows'>) {
  const { answers, rows } = prepared(source);
  const template = templateByChoice(answers.templateChoice);
  if (!template) throw new Error('No template chosen');
  const schema = templateBriefSchemas[template.id];
  const phone = ukPhone(String(answers.contactPhone ?? ''));
  const whatsapp =
    answers.whatsapp === 'Same as my phone number'
      ? phone
      : answers.whatsapp === 'A different number'
        ? ukPhone(String(answers.whatsappNumber ?? ''))
        : null;
  const values = (id: string) => (rows[id] ?? []).map((row) => row.values);
  const street = text(answers, 'street');
  const town = text(answers, 'town');
  const postcode = text(answers, 'postcode');
  const files = answers[filesFieldId(schema)];
  return {
    schemaVersion: 1,
    template: template.id,
    theme:
      answers.colours === colourOptions.own
        ? {
            brand: String(answers.brandColour).toLowerCase(),
            accent: String(answers.accentColour).toLowerCase(),
          }
        : null,
    business: {
      name: text(answers, 'businessName'),
      monogram: text(answers, 'monogram')?.toUpperCase() ?? null,
      area: text(answers, 'businessArea'),
      heroLine: own(answers, 'heroSource', 'heroLine'),
      intro: own(answers, 'introSource', 'intro'),
      logo: choice(logoOptions, answers.logo),
    },
    contact: {
      phone: phone?.display ?? null,
      phoneInternational: phone ? `+${phone.international}` : null,
      whatsapp: whatsapp?.display ?? null,
      whatsappInternational: whatsapp ? `+${whatsapp.international}` : null,
      email: text(answers, 'contactEmail'),
      // One line for the page, plus the parts: "79 Yarrow Terrace, Dundee DD2 4DX".
      address: street ? `${street}, ${town} ${postcode}` : null,
      addressParts: street ? { street, town, postcode } : null,
      serviceArea: text(answers, 'serviceArea'),
    },
    hours: answers.hoursSource === ownWords ? groupHours(values('hours')) : null,
    online: {
      instagram: text(answers, 'instagram'),
      facebook: text(answers, 'facebook'),
      tiktok: text(answers, 'tiktok'),
      pinterest: text(answers, 'pinterest'),
      linkedin: text(answers, 'linkedin'),
      bookingLink: text(answers, 'bookingLink'),
      googleBusinessProfile: {
        status: choice(
          { have: 'I have one', need: 'I need one', unsure: 'Not sure' },
          answers.googleProfile,
        ),
        link: text(answers, 'googleProfileLink'),
      },
      existingWebsite: text(answers, 'existingSite'),
    },
    proof: {
      reviews:
        answers.hasReviews === reviewOptions.yes
          ? values('reviews').map(({ name, text, stars, source }) => ({
              name,
              text,
              stars: Number(stars),
              source,
            }))
          : [],
      qualifications:
        answers.hasQualifications === qualificationOptions.yes
          ? values('qualifications').map(({ name, detail }) => ({ name, detail: detail || null }))
          : [],
    },
    assets: (Object.entries(fileChoices(schema)) as [string, string][])
      .filter(([key, label]) => key !== 'none' && Array.isArray(files) && files.includes(label))
      .map(([key]) => key),
    content: schema.toTemplateData(answers, rows),
  };
}

export function templateBriefFilename(source: Pick<BriefState, 'answers'>) {
  const template = templateByChoice(source.answers.templateChoice);
  const slug =
    String(source.answers.businessName ?? '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/, '') || 'business';
  return `FinTaxTech-template-brief-${template?.id ?? 'template'}-${slug}.txt`;
}

const indent = (value: string, by: string) => value.replaceAll('\n', `\n${by}`);
// Labels without their input hints: "Price, like £30 or From £30" → "Price".
const plain = (label: string) => label.replace(/,? like .*$/, '').replace(/ \(optional\)$/, '');
function answerText(field: BriefField, answers: BriefAnswers): string {
  const value = answers[field.id];
  if (field.type === 'confirm') return value === true ? c.agreed : c.notProvided;
  if (value === useSample || value === keepSteps) return 'Use template sample';
  if (Array.isArray(value)) return value.join('; ') || c.notProvided;
  return typeof value === 'string' && value ? value : c.notProvided;
}

// UTF-8 text with LF line endings: a readable brief, then the data block.
export function templateBriefText(
  source: Pick<BriefState, 'answers' | 'rows'>,
  date = new Date(),
): string {
  const state = prepared(source);
  const { answers, rows } = state;
  const data = toTemplateBriefData(state);
  const template = templateByChoice(answers.templateChoice)!;
  const schema = templateBriefSchemas[template.id];
  const lines = [
    'FINTAXTECH TEMPLATE BRIEF',
    `Template: ${template.id} (${template.name})`,
    `Business: ${data.business.name} · ${data.business.area}`,
    `Reference: ${text(answers, 'ref') ?? 'none'}`,
  ];
  const preset = [
    text(answers, 'presetRole') && `role ${text(answers, 'presetRole')}`,
    text(answers, 'presetType') && `type ${text(answers, 'presetType')}`,
  ].filter(Boolean);
  if (preset.length) lines.push(`Demo preset: ${preset.join(', ')}`);
  lines.push(`Prepared: ${date.toISOString().slice(0, 10)}`);
  const filesId = filesFieldId(schema);
  for (const section of rules.visibleSections(answers)) {
    const shown = section.fields.filter(
      (field) =>
        isVisible(field, answers) &&
        !['hidden', 'images'].includes(field.type) &&
        !['templateChoice', filesId].includes(field.id),
    );
    if (!shown.length) continue;
    lines.push('', `== ${section.title} ==`);
    for (const field of shown) {
      if (answers[field.id] === ownWords) continue;
      if (field.type === 'hours') {
        lines.push(`${plain(field.label)}:`);
        for (const [index, row] of (rows[field.id] ?? []).entries())
          lines.push(`  ${weekDays[index]}: ${dayHoursText(row.values)}`);
        continue;
      }
      if (field.type !== 'rows') {
        lines.push(`${plain(field.label)}: ${indent(answerText(field, answers), '  ')}`);
        continue;
      }
      lines.push(`${plain(field.label)}:`);
      for (const [index, row] of (rows[field.id] ?? []).entries()) {
        const parts = field.repeat!.fields.filter((part) => isVisible(part, row.values));
        parts.forEach((part, partIndex) => {
          const prefix = partIndex ? '     ' : `  ${index + 1}. `.padEnd(5);
          const value = row.values[part.key] || c.notProvided;
          lines.push(`${prefix}${plain(part.label)}: ${indent(value, '       ')}`);
        });
      }
      if (!rows[field.id]?.length) lines.push(`  ${c.notProvided}`);
    }
  }
  const chosen = answers[filesId];
  lines.push('', '== Files to send ==');
  const files = Object.values(fileChoices(schema)).filter(
    (label) => label !== fileOptions.none && Array.isArray(chosen) && chosen.includes(label),
  );
  if (files.length) lines.push(...files.map((label) => `[ ] ${label}`));
  else lines.push('No files to send for now.');
  lines.push(
    '',
    'BEGIN TEMPLATE DATA (do not edit below this line)',
    JSON.stringify(data, null, 2),
    'END TEMPLATE DATA',
    '',
  );
  return lines.join('\n').replace(/\r\n?/g, '\n');
}

// Query values follow the template demos' rules: trimmed, whitespace collapsed,
// length-capped, phone characters only, rendered as text. ?template must name a
// template with a schema; anything else leaves the picker empty.
export function templatePrefill(search: string): BriefAnswers {
  const query = new URLSearchParams(search);
  const answers: BriefAnswers = {};
  const clean = (value: string | null, limit: number) =>
    Array.from((value ?? '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  for (const field of fields) {
    if (!field.prefill) continue;
    const raw = query.get(field.prefill);
    if (field.id === 'templateChoice') {
      const id = raw?.trim() ?? '';
      if (Object.hasOwn(templateBriefSchemas, id)) answers[field.id] = templateName(id);
      continue;
    }
    const value = clean(
      field.type === 'phone' ? (raw ?? '').replace(/-/g, ' ') : raw,
      field.maxLength ?? 100,
    );
    if (!value) continue;
    if (field.prefillMatch) {
      // A single choice: the value selects the option whose pattern it matches.
      const option = Object.entries(field.prefillMatch).find(([, pattern]) =>
        new RegExp(pattern, 'i').test(value),
      )?.[0];
      if (option) answers[field.id] = option;
      continue;
    }
    if (field.type === 'phone' && !/^\+?[\d ()]+$/.test(value)) continue;
    if (field.pattern && !new RegExp(field.pattern.source, 'u').test(value)) continue;
    answers[field.id] = value;
  }
  return answers;
}
