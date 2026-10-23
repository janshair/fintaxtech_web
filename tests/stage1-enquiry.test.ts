import { afterEach, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { questionSets } from '../src/content/questions';
import { automationCopy, automationWorkflowFields } from '../src/content/ai-automation';
import {
  visibleQuestions,
  visibleSummary,
  pruneHiddenAnswers,
  needsBranding,
} from '../src/lib/rules';
import { validateAnswer } from '../src/lib/validation';
import type { Journey, ServiceId } from '../src/lib/types';

const pdfTrace = vi.hoisted(() => ({ text: undefined as ReturnType<typeof vi.spyOn> | undefined }));
vi.mock('../src/lib/pdf-font', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/pdf-font')>();
  return {
    ...original,
    loadPDFFont: async (doc: Parameters<typeof original.loadPDFFont>[0]) => {
      await original.loadPDFFont(doc);
      pdfTrace.text = vi.spyOn(doc, 'text');
    },
  };
});
afterEach(() => vi.unstubAllGlobals());
const journey = (service: ServiceId, answers: Journey['answers'] = {}): Journey => ({
  service,
  stage: '1',
  short: false,
  promo: false,
  answers,
});
const ids = (state: Journey) => visibleQuestions(state).map((question) => question.id);

it('keeps five website questions with the requested labels, two goals and optional notes', () => {
  const questions = questionSets.websites['1'];
  expect(ids(journey('websites'))).toEqual([
    'websites-1-1',
    'websites-1-2',
    'websites-1-4',
    'websites-1-8',
    'websites-1-9',
  ]);
  expect(questions[1]).toMatchObject({
    label: 'What should the website help the business achieve?',
    type: 'multi',
    max: 2,
  });
  expect(validateAnswer(questions[1], ['Generate enquiries', 'Explain services'])).toBeNull();
  expect(
    validateAnswer(questions[1], ['Generate enquiries', 'Explain services', 'Sell products']),
  ).toBeTruthy();
  expect(questions[2].label).toBe('Which important features are needed?');
  expect(questions[3].label).toBe('How should we contact you?');
  expect(validateAnswer(questions[4], '')).toBeNull();
});

it('keeps six mobile questions and requires two Other feature details only while selected', () => {
  const state = journey('mobile-apps');
  const base = [
    'mobile-apps-1-1',
    'mobile-apps-1-2',
    'mobile-apps-1-4',
    'mobile-apps-1-5',
    'mobile-apps-1-10',
    'mobile-apps-1-11',
  ];
  expect(ids(state)).toEqual(base);
  const features = visibleQuestions(state)[3];
  expect(features.label).toBe('What should users be able to do?');
  expect(features.options).toContain('Not sure');
  expect(validateAnswer(features, ['Not sure'])).toBeNull();
  expect(validateAnswer(features, ['Accounts', 'Not sure'])).toBeTruthy();
  state.answers[features.id] = ['Accounts', 'Other'];
  const detailIds = ['mobile-apps-1-5-other-name', 'mobile-apps-1-5-other-description'];
  expect(ids(state)).toEqual([...base.slice(0, 4), ...detailIds, ...base.slice(4)]);
  for (const question of visibleQuestions(state).filter((question) =>
    detailIds.includes(question.id),
  )) {
    expect(validateAnswer(question, '')).toBeTruthy();
    state.answers[question.id] =
      question.label === 'Feature name'
        ? 'Visit planner'
        : 'Customers can organise upcoming visits.';
    expect(validateAnswer(question, state.answers[question.id])).toBeNull();
  }
  expect(visibleSummary(state)).toContainEqual({ label: 'Feature name', value: 'Visit planner' });
  expect(visibleSummary(state)).toContainEqual({
    label: 'Short feature description',
    value: 'Customers can organise upcoming visits.',
  });
  state.answers[features.id] = ['Not sure'];
  state.answers = pruneHiddenAnswers(state);
  expect(ids(state)).toEqual(base);
  expect(JSON.stringify(visibleSummary(state))).not.toContain('Visit planner');
  for (const id of detailIds) expect(state.answers[id]).toBeUndefined();
});

it('uses five common AI questions for every automation kind, with no detailed conditional branches', () => {
  for (const kind of automationCopy.projectOptions) {
    const state = journey('ai-automation', { 'ai-automation-1-kind': kind });
    expect(ids(state)).toEqual([
      'ai-automation-1-kind',
      ...(kind === 'Other' ? ['ai-automation-1-kind-other'] : []),
      'ai-automation-1-3',
      'ai-automation-1-8',
      'ai-automation-1-9',
      'ai-automation-1-10',
    ]);
    expect(visibleQuestions(state).map((question) => question.label)).not.toEqual(
      expect.arrayContaining(automationWorkflowFields.map((field) => field.label)),
    );
    expect(
      visibleQuestions(state).find((question) => question.id === 'ai-automation-1-8')?.options,
    ).toEqual([
      'No',
      'Personal data',
      'Confidential business information',
      'Financial, health, legal or regulated information',
      'Not sure',
    ]);
  }
});

it('limits AI outcomes to two and conditionally preserves the existing project Other detail', () => {
  const state = journey('ai-automation', {
    'ai-automation-1-kind': 'Other',
    'ai-automation-1-kind-other': 'Document sorting',
    'ai-automation-1-3': ['Save staff time', 'Other'],
  });
  expect(ids(state)).toHaveLength(6);
  const result = visibleQuestions(state).find((question) => question.id === 'ai-automation-1-3')!;
  expect(result.label).toBe('What result are you hoping for?');
  expect(result.type).toBe('multi');
  expect(result.options).toEqual([
    'Save staff time',
    'Reduce repetitive work',
    'Reduce mistakes',
    'Process documents or data',
    'Prepare content',
    'Connect business tools',
    'Help staff find approved information',
    'Not sure',
    'Other',
  ]);
  expect(
    validateAnswer(result, ['Save staff time', 'Reduce mistakes', 'Prepare content']),
  ).toBeTruthy();
  expect(validateAnswer(result, ['Not sure', 'Other'])).toBeTruthy();
  expect(pruneHiddenAnswers(state)).toEqual(state.answers);
  state.answers['ai-automation-1-kind'] = 'Not sure';
  state.answers['ai-automation-1-3'] = ['Not sure'];
  state.answers = pruneHiddenAnswers(state);
  expect(ids(state)).toHaveLength(5);
  expect(state.answers['ai-automation-1-kind-other']).toBeUndefined();
});

it('drops removed Stage 1 IDs from summaries and state without triggering the retired assets branch', () => {
  for (const [service, removed] of [
    ['websites', ['websites-1-3', 'websites-1-5', 'websites-1-6', 'websites-1-7']],
    [
      'mobile-apps',
      [
        'mobile-apps-1-3',
        'mobile-apps-1-6',
        'mobile-apps-1-7',
        'mobile-apps-1-8',
        'mobile-apps-1-9',
      ],
    ],
    [
      'ai-automation',
      [
        'ai-automation-1-1',
        'ai-automation-1-2',
        'ai-automation-1-4',
        'ai-automation-1-5',
        'ai-automation-1-6',
        'ai-automation-1-7',
        ...automationWorkflowFields.map((field) => `ai-automation-1-${field.id}`),
      ],
    ],
  ] as const) {
    const state = journey(service, Object.fromEntries(removed.map((id) => [id, 'STALE DETAIL'])));
    expect(pruneHiddenAnswers(state)).toEqual({});
    expect(visibleSummary(state)).toEqual([]);
    expect(needsBranding(state)).toBe(false);
  }
});

it.each(['websites', 'mobile-apps', 'ai-automation'] as const)(
  'generates a real %s PDF with every visible answer, including custom features, using the shared summary',
  async (service) => {
    const state = journey(
      service,
      service === 'mobile-apps'
        ? {
            'mobile-apps-1-5': ['Other'],
            'mobile-apps-1-5-other-name': 'Visit planner',
            'mobile-apps-1-5-other-description': 'Customers can organise upcoming visits.',
          }
        : service === 'ai-automation'
          ? {
              'ai-automation-1-kind': 'Other',
              'ai-automation-1-kind-other': 'Document sorting',
              'ai-automation-1-3': ['Save staff time', 'Other'],
            }
          : {},
    );
    for (const question of visibleQuestions(state)) {
      state.answers[question.id] ??=
        question.type === 'text'
          ? 'Additional enquiry notes'
          : question.type === 'multi'
            ? [question.options![0]]
            : question.options![0];
      expect(validateAnswer(question, state.answers[question.id])).toBeNull();
    }
    vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
    const { createPDF } = await import('../src/lib/pdf');
    const pdf = await createPDF({ journey: state, customer: [] });
    expect(
      Buffer.from(await pdf.arrayBuffer())
        .subarray(0, 5)
        .toString(),
    ).toBe('%PDF-');
    const printed = pdfTrace
      .text!.mock.calls.map(([text]) => (Array.isArray(text) ? text.join('\n') : String(text)))
      .join('\n');
    for (const row of visibleSummary(state)) {
      expect(printed).toContain(row.label);
      expect(printed).toContain(row.value);
    }
    if (service === 'mobile-apps') {
      expect(printed).toContain('Feature name\nVisit planner');
      expect(printed).toContain(
        'Short feature description\nCustomers can organise upcoming visits.',
      );
    }
  },
);
