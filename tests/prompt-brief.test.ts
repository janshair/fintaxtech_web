import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promptBriefSections as sections, promptBriefCopy as c } from '../src/content/prompt-brief';
import { createBriefRules, toggleChoice } from '../src/lib/client-brief/rules';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import { completePromptBrief } from './fixtures/prompt-brief';
const { validateField, pruneBrief, invalidSection, briefSummary } = createBriefRules(sections);
const fields = sections.flatMap((s) => s.fields);
const field = (id: string) => fields.find((f) => f.id === id)!;
afterEach(() => vi.unstubAllGlobals());

describe('AI Automation production brief', () => {
  it('accepts a complete brief and does not require unavailable source formats or final notes', () => {
    const state = completePromptBrief();
    expect(invalidSection(state)).toBe(-1);
    for (const status of ['All ready', 'Partly ready', 'Not ready', 'FinTaxTech to advise']) {
      state.answers.sourceStatus = status;
      delete state.answers.sourceFormats;
      delete state.answers.anything;
      expect(invalidSection(state)).toBe(-1);
    }
  });
  it('requires every Other detail, limits its length, includes it in review and prunes deselected details', () => {
    for (const f of fields.filter((f) => f.options?.includes('Other'))) {
      const state = completePromptBrief();
      state.answers[f.id] = f.type === 'single' ? 'Other' : ['Other'];
      delete state.answers[`${f.id}Other`];
      expect(validateField(f, state)).toBe(c.missing);
      state.answers[`${f.id}Other`] = ' '.repeat(4);
      expect(validateField(f, state)).toBe(c.missing);
      state.answers[`${f.id}Other`] = 'x'.repeat(241);
      expect(validateField(f, state)).toBe(c.tooLong(240));
      state.answers[`${f.id}Other`] = 'Specific requirement';
      expect(validateField(f, state)).toBeUndefined();
      expect(JSON.stringify(briefSummary(state))).toContain('Other: Specific requirement');
      state.answers[f.id] = f.type === 'single' ? f.options![0] : [f.options![0]];
      pruneBrief(state);
      expect(state.answers[`${f.id}Other`]).toBeUndefined();
      expect(JSON.stringify(briefSummary(state))).not.toContain('Specific requirement');
    }
  });
  it('enforces three tone choices and keeps recommendation exclusive', () => {
    const state = completePromptBrief(),
      f = field('tone');
    const selected = ['Professional', 'Friendly', 'Concise'];
    expect(toggleChoice(f, selected, 'Technical')).toEqual(selected);
    state.answers.tone = [...selected, 'Technical'];
    expect(validateField(f, state)).toBe(c.tooMany(3));
    expect(toggleChoice(f, selected, 'FinTaxTech to recommend')).toEqual([
      'FinTaxTech to recommend',
    ]);
    expect(toggleChoice(f, ['FinTaxTech to recommend'], 'Friendly')).toEqual(['Friendly']);
    state.answers.tone = ['Friendly', 'FinTaxTech to recommend'];
    expect(validateField(f, state)).toBe(c.invalidChoice);
  });
  it('requires language and deadline details only while selected and omits old answers from review', () => {
    const state = completePromptBrief();
    for (const id of ['languageDetail', 'deadlineDate', 'deadlineReason']) {
      const previous = state.answers[id];
      state.answers[id] = '';
      expect(validateField(field(id), state)).toBe(c.missing);
      state.answers[id] = previous;
    }
    state.answers.deadlineDate = '2026-02-30';
    expect(validateField(field('deadlineDate'), state)).toBe(c.invalidDate);
    state.answers.language = 'UK English';
    state.answers.deadline = 'No fixed date';
    const summary = JSON.stringify(briefSummary(state));
    expect(summary).not.toContain('French');
    expect(summary).not.toContain('Business launch');
    pruneBrief(state);
    for (const id of ['languageDetail', 'deadlineDate', 'deadlineReason'])
      expect(state.answers[id]).toBeUndefined();
    expect(invalidSection(state)).toBe(-1);
  });
  it('retains permission and sensitive-content review notes in the PDF summary and rejects invalid choices', () => {
    const state = completePromptBrief();
    const summary = JSON.stringify(briefSummary(state));
    expect(summary).toContain('public availability does not automatically grant reuse rights');
    expect(summary).toContain('accuracy, scope and privacy review');
    expect(summary).toContain('Group providing one consolidated decision');
    state.answers.purpose = 'Invalid option';
    expect(validateField(field('purpose'), state)).toBe(c.invalidChoice);
    state.answers.content = ['Invalid option'];
    expect(validateField(field('content'), state)).toBe(c.invalidChoice);
    state.answers.anything = 'x'.repeat(2001);
    expect(validateField(field('anything'), state)).toBe(c.tooLong(2000));
  });
});

it('creates the AI Automation PDF using the shared generator and rejects incomplete briefs', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
  const state = completePromptBrief();
  state.answers.anything = 'Use consistent terminology and accessible language throughout. '.repeat(
    25,
  );
  const pdf = await createClientBriefPDF(
    clientBriefDefinitions.prompt,
    state,
    new Date('2026-09-22T12:00:00Z'),
  );
  const bytes = Buffer.from(await pdf.arrayBuffer());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.toString('latin1')).toContain('/Title (AI Automation Production Brief)');
  expect(bytes.toString('latin1')).not.toContain('/Encrypt');
  await mkdir('tmp/prompt-brief-qa', { recursive: true });
  await writeFile('tmp/prompt-brief-qa/complete.pdf', bytes);
  delete state.answers.languageDetail;
  await expect(createClientBriefPDF(clientBriefDefinitions.prompt, state)).rejects.toThrow(
    'Incomplete client brief',
  );
});
