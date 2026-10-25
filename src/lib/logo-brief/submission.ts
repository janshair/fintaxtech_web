import { logoBriefSections } from '../../content/logo-brief';
import {
  createBriefRules,
  emptyBrief,
  fieldOptions,
  imagesForField,
  isVisible,
  requiresOtherText,
} from '../client-brief/rules';
import type { BriefState } from '../client-brief/types';

export const LOGO_BRIEF_SCHEMA_VERSION = 'fintaxtech-logo-brief-v3';

export const logoSubmissionPath = '/api/logo-brief/';
export interface LogoSubmission {
  kind: 'logo';
  completedAt: string;
  state: BriefState;
}
const rules = createBriefRules(logoBriefSections);

// Both outputs consume this detached, validated snapshot. UI state is never the output source.
export function canonicalLogoSubmission(
  source: BriefState,
  completedAt = new Date().toISOString(),
): LogoSubmission {
  if (
    !Number.isFinite(Date.parse(completedAt)) ||
    new Date(completedAt).toISOString() !== completedAt
  )
    throw new Error('Invalid submission date');
  const working = structuredClone(source);
  rules.pruneBrief(working);
  if (rules.invalidSection(working) !== -1) throw new Error('Incomplete logo brief');
  const state = emptyBrief();
  for (const field of rules.visibleSections(working.answers).flatMap((section) => section.fields)) {
    if (!isVisible(field, working.answers)) continue;
    const answer = working.answers[field.id];
    if (Array.isArray(answer))
      state.answers[field.id] = fieldOptions(field, working.answers).filter((value) =>
        answer.includes(value),
      );
    else if (typeof answer === 'string' && answer.trim()) state.answers[field.id] = answer.trim();
    else if (typeof answer === 'boolean') state.answers[field.id] = answer;
    if (requiresOtherText(field, working.answers))
      state.answers[`${field.id}Other`] = String(working.answers[`${field.id}Other`]).trim();
  }
  state.competitors = working.competitors.map((item, index) => ({
    id: String(index),
    name: item.name.trim(),
    website: item.website.trim(),
  }));
  state.images = working.images.map((image, index) => ({
    ...image,
    id: String(index),
    explanation: image.explanation.trim(),
  }));
  return { kind: 'logo', completedAt, state };
}

export function logoSubmissionMetadata(submission: LogoSubmission): LogoSubmission {
  return {
    ...submission,
    state: {
      ...submission.state,
      images: submission.state.images.map((image) => ({ ...image, data: '' })),
    },
  };
}

const groups: [string, [string, string][]][] = [
  ['PROJECT', [['project', 'Project type']]],
  [
    'BUSINESS',
    [
      ['trading', 'Trading name'],
      ['nameConfirmed', 'Trading name confirmation'],
      ['tagline', 'Tagline'],
      ['taglineText', 'Exact tagline text'],
      ['service1', 'Business description'],
      ['brandStory', 'Brand/name story'],
    ],
  ],
  ['AUDIENCE', [['customers', 'Main customers']]],
  ['BRAND', [['personality', 'Personality']]],
  [
    'LOGO DIRECTION',
    [
      ['format', 'Preferred logo type'],
      ['designStyle', 'Desired design style'],
      ['welcomeIdeas', 'Ideas/symbols/themes to consider'],
      ['welcomeIdeasPriority', 'Creative idea priority'],
      ['avoidSymbols', 'Design details/styles to avoid'],
    ],
  ],
  [
    'REDESIGN',
    [
      ['identityProblems', 'Current identity problems'],
      ['identityImprovements', 'Requested improvements'],
      ['identityRetain', 'Elements to retain'],
    ],
  ],
  ['COMPETITORS', []],
  ['REFERENCES', [['references', 'Reference images supplied']]],
  ['ASSETS', []],
  [
    'COLOUR',
    [
      ['colour', 'Colour direction'],
      ['preferredColours', 'Preferred/existing colours'],
      ['avoidedColours', 'Colours to avoid'],
    ],
  ],
  ['APPLICATIONS', [['uses', 'Logo uses']]],
  [
    'APPROVAL',
    [
      ['approver', 'Final approver'],
      ['approverName', 'Approver/contact name'],
      ['groupContact', 'Group contact name'],
    ],
  ],
  [
    'DEADLINE',
    [
      ['deadline', 'Deadline'],
      ['deadlineDate', 'Deadline date'],
    ],
  ],
  ['ADDITIONAL NOTES', [['anything', 'Anything else supplied by the client']]],
];

export function formatLogoBrief(submission: LogoSubmission): string {
  const { state, completedAt } = submission;
  const applicable = new Map(
    rules
      .visibleSections(state.answers)
      .flatMap((section) => section.fields.filter((field) => isVisible(field, state.answers)))
      .map((field) => [field.id, field]),
  );
  const line = (label: string, value: string) => `${label}:\n  ${value.replaceAll('\n', '\n  ')}`;
  const value = (id: string) => {
    const answer = state.answers[id];
    const other = (item: string) =>
      item === 'Other'
        ? `Other: ${state.answers[applicable.get(id)?.otherField ?? `${id}Other`] ?? ''}`
        : item;
    if (id === 'nameConfirmed')
      return answer === true ? 'Exact spelling and capitalisation confirmed' : 'Not provided';
    return Array.isArray(answer)
      ? answer.map(other).join('; ')
      : typeof answer === 'string' && answer
        ? other(answer)
        : 'Not provided';
  };
  const sections = groups.flatMap(([heading, mappings]) => {
    if (heading === 'REDESIGN' && state.answers.project !== 'Complete redesign') return [];
    const lines = mappings
      .filter(
        ([id]) =>
          applicable.has(id) && (id !== 'identityRetain' || String(state.answers[id] ?? '').trim()),
      )
      .map(([id, label]) => line(label, value(id)));
    if (heading === 'PROJECT') {
      lines.unshift(line('Brief schema version', LOGO_BRIEF_SCHEMA_VERSION));
      lines.push(line('Submission date', completedAt));
    }
    if (heading === 'ASSETS') {
      const current = imagesForField(state, { imagePurpose: 'current-logo' })[0];
      const references = imagesForField(state, {});
      const redesign = state.answers.project === 'Complete redesign';
      const delivery = 'Included in client PDF; not included in this Slack message';
      lines.push(
        line('Current logo supplied', redesign ? (current ? 'Yes' : 'No') : 'Not applicable'),
      );
      if (redesign && current) {
        lines.push(
          line('Current logo filename', current.filename || 'Not provided'),
          line('Current logo delivery', delivery),
        );
      }
      lines.push(line('Reference images supplied', references.length ? 'Yes' : 'No'));
      if (references.length) {
        lines.push(
          line('Reference image count', String(references.length)),
          line('Reference images delivery', delivery),
        );
      }
    }
    if (heading === 'COMPETITORS')
      lines.push(
        line(
          'Competitors',
          state.competitors
            .map((item) => `${item.name}${item.website ? ` — ${item.website}` : ''}`)
            .join('\n') || 'Not provided',
        ),
      );
    if (heading === 'REFERENCES')
      state.images
        .filter((image) => !image.purpose)
        .forEach((image, index) => {
          lines.push(
            line(`Reference ${index + 1} filename`, image.filename || 'Not provided'),
            line(`Reference ${index + 1} explanation`, image.explanation),
          );
        });
    if (heading === 'REDESIGN') {
      const current = state.images.find((image) => image.purpose === 'current-logo');
      if (current) lines.push(line('Current logo filename', current.filename || 'Not provided'));
    }
    return lines.length ? [`[${heading}]\n${lines.join('\n')}`] : [];
  });
  return `FINTAXTECH BRAND DESIGN BRIEF\n\n${sections.join('\n\n')}\n`;
}

export async function createLogoOutputs(submission: LogoSubmission) {
  const txt = formatLogoBrief(submission);
  const { createLogoBriefPDF } = await import('./pdf');
  const pdf = await createLogoBriefPDF(submission.state, new Date(submission.completedAt));
  return { txt, pdf };
}
