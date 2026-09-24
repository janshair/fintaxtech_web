import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  automationCopy as c,
  automationWorkflowFields,
  contentAutomation,
} from '../src/content/ai-automation';
import { promptBriefSections } from '../src/content/prompt-brief';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import { createBriefRules, emptyBrief } from '../src/lib/client-brief/rules';
import { normalizeService } from '../src/lib/journey-url';
import { pruneHiddenAnswers, visibleQuestions, visibleSummary } from '../src/lib/rules';
import { validateAnswer } from '../src/lib/validation';
import type { Journey } from '../src/lib/types';
const rules = createBriefRules(promptBriefSections);
const journey = (stage: '1' | '2', kind: string): Journey => ({
  service: 'ai-automation',
  stage,
  short: false,
  promo: false,
  answers: { [`ai-automation-${stage}-kind`]: kind },
});
export function workflowBrief(kind = 'Repetitive administrative workflow') {
  const state = emptyBrief();
  state.answers.automationKind = kind;
  for (const section of rules.visibleSections(state.answers))
    for (const f of section.fields) {
      if (f.id === 'automationKind' || f.when) continue;
      state.answers[f.id] =
        f.type === 'multi'
          ? [f.options![0]]
          : f.type === 'single'
            ? f.options![0]
            : 'Approved workflow example';
    }
  if (kind === 'Other') state.answers.automationKindOther = 'A defined business process';
  return state;
}
afterEach(() => vi.unstubAllGlobals());
describe('AI Automation branches and compatibility', () => {
  it('normalises legacy IDs without accepting unknown services', () => {
    expect(normalizeService('prompt-services')).toBe('ai-automation');
    expect(normalizeService('ai-automation')).toBe('ai-automation');
    expect(normalizeService('AI Automation')).toBeUndefined();
    expect(normalizeService(null)).toBeUndefined();
  });
  for (const stage of ['1', '2'] as const) {
    it(`preserves content questions and prunes them when changing stage ${stage} to a workflow`, () => {
      const j = journey(stage, contentAutomation);
      expect(visibleQuestions(j)[0].label).toBe(c.projectLabel);
      expect(visibleQuestions(j).some((q) => q.id === `ai-automation-${stage}-1`)).toBe(true);
      j.answers[`ai-automation-${stage}-1`] = 'OLD CONTENT ANSWER';
      j.answers[`ai-automation-${stage}-kind`] = 'Repetitive administrative workflow';
      j.answers = pruneHiddenAnswers(j);
      expect(j.answers[`ai-automation-${stage}-1`]).toBeUndefined();
      for (const f of automationWorkflowFields)
        expect(visibleQuestions(j).some((q) => q.id === `ai-automation-${stage}-${f.id}`)).toBe(
          true,
        );
      expect(JSON.stringify(visibleSummary(j))).not.toContain('OLD CONTENT ANSWER');
      const process = visibleQuestions(j).find((q) => q.id.endsWith('-process'))!;
      expect(validateAnswer(process, '  ')).toBeTruthy();
      expect(validateAnswer(process, 'Approved process description')).toBeNull();
      j.answers[process.id] = 'OLD WORKFLOW';
      j.answers[`ai-automation-${stage}-kind`] = contentAutomation;
      j.answers = pruneHiddenAnswers(j);
      expect(j.answers[process.id]).toBeUndefined();
    });
    it(`shows specific assistant, integration and Other follow-ups in stage ${stage}`, () => {
      for (const [kind, suffix] of [
        ['AI assistant or knowledge helper', 'knowledge'],
        ['Connection between business systems', 'connection'],
        ['Other', 'kind-other'],
      ]) {
        const j = journey(stage, kind);
        expect(visibleQuestions(j).some((q) => q.id === `ai-automation-${stage}-${suffix}`)).toBe(
          true,
        );
        j.answers[`ai-automation-${stage}-${suffix}`] = 'Old detail';
        j.answers[`ai-automation-${stage}-kind`] = 'Not sure';
        j.answers = pruneHiddenAnswers(j);
        expect(j.answers[`ai-automation-${stage}-${suffix}`]).toBeUndefined();
      }
    });
  }
  it('validates every non-content production branch and prunes entire hidden sections', () => {
    for (const kind of c.projectOptions.slice(1)) {
      const state = workflowBrief(kind);
      expect(rules.invalidSection(state)).toBe(-1);
      state.answers.automationKind = contentAutomation;
      rules.pruneBrief(state);
      expect(Object.keys(state.answers).some((id) => id.startsWith('workflow-'))).toBe(false);
      expect(state.answers.knowledge).toBeUndefined();
      expect(state.answers.connection).toBeUndefined();
      expect(state.answers.automationKindOther).toBeUndefined();
      state.answers.content = ['Other'];
      state.answers.contentOther = 'OLD CONTENT';
      state.answers.language = 'Another language';
      state.answers.languageDetail = 'French';
      state.answers.automationKind = 'Not sure';
      rules.pruneBrief(state);
      for (const id of ['content', 'contentOther', 'language', 'languageDetail'])
        expect(state.answers[id]).toBeUndefined();
      expect(JSON.stringify(rules.briefSummary(state))).not.toContain('OLD CONTENT');
    }
  });
});
it('creates public and production automation PDFs through the existing local generators', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createPDF } = await import('../src/lib/pdf');
  const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
  const j = journey('2', 'AI assistant or knowledge helper');
  for (const q of visibleQuestions(j)) {
    if (q.id.endsWith('-kind')) continue;
    j.answers[q.id] =
      q.type === 'text'
        ? 'Approved workflow example'
        : q.type === 'multi'
          ? [q.options![0]]
          : q.options![0];
  }
  await mkdir('tmp/automation-qa', { recursive: true });
  for (const [name, pdf, title] of [
    ['enquiry', await createPDF({ journey: j, customer: [] }), c.pdfTitle],
    [
      'production',
      await createClientBriefPDF(
        clientBriefDefinitions.prompt,
        workflowBrief('AI assistant or knowledge helper'),
      ),
      'AI Automation Production Brief',
    ],
  ] as const) {
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.toString('latin1')).toContain(`/Title (${title})`);
    expect(bytes.toString('latin1')).not.toContain('/Encrypt');
    await writeFile(`tmp/automation-qa/${name}.pdf`, bytes);
  }
});
