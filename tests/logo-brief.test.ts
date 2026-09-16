import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { logoBriefSections as sections, logoBriefCopy as c } from '../src/content/logo-brief';
import {
  briefSummary,
  emptyBrief,
  hasOther,
  includesAnswer,
  invalidSection,
  isVisible,
  limits,
  pruneBrief,
  toggleChoice,
  validateField,
} from '../src/lib/logo-brief/rules';
import { validateImageFile } from '../src/lib/logo-brief/images';

afterEach(() => vi.unstubAllGlobals());
const fields = sections.flatMap((s) => s.fields);
const field = (id: string) => fields.find((f) => f.id === id)!;
describe('post-payment brief rules', () => {
  it('only validates applicable fields and removes deselected dependent answers', () => {
    const state = emptyBrief();
    state.answers = {
      legalDifferent: 'No',
      legal: 'Hidden legal',
      tagline: 'No tagline',
      taglineText: 'Hidden slogan',
      future: 'No',
      futureDetail: 'Hidden future',
      colour: 'Designer to recommend',
      preferredColours: 'Hidden colours',
      deadline: 'No fixed deadline',
      deadlineDate: '2026-10-12',
      deadlineReason: 'Other',
      deadlineReasonOther: 'Hidden reason',
      references: 'No',
    };
    state.images = [
      { id: 'old', data: 'secret', width: 1, height: 1, explanation: 'Hidden image' },
    ];
    for (const id of [
      'legal',
      'taglineText',
      'futureDetail',
      'preferredColours',
      'deadlineDate',
      'deadlineReason',
    ])
      expect(validateField(field(id), state)).toBeUndefined();
    pruneBrief(state);
    expect(JSON.stringify(state)).not.toContain('Hidden');
    expect(state.images).toEqual([]);
    expect(JSON.stringify(briefSummary(state))).not.toContain('Hidden');
  });
  it('requires and formats Other only while selected for every applicable choice', () => {
    for (const f of fields.filter((f) => f.options?.includes(c.other))) {
      const state = emptyBrief();
      if (f.when) state.answers[f.when.id] = f.when.values[0];
      state.answers[f.id] = f.type === 'multi' ? [c.other] : c.other;
      expect(hasOther(f, state.answers)).toBe(true);
      expect(validateField(f, state)).toBe(c.missing);
      state.answers[`${f.id}Other`] = 'Specific detail';
      expect(validateField(f, state)).toBeUndefined();
      expect(JSON.stringify(briefSummary(state))).toContain('Other: Specific detail');
      state.answers[f.id] = f.type === 'multi' ? [f.options![0]] : f.options![0];
      pruneBrief(state);
      expect(state.answers[`${f.id}Other`]).toBeUndefined();
    }
  });
  it('enforces personality maximum and mutually exclusive no preference', () => {
    const f = field('personality');
    const five = f.options!.slice(0, 5);
    expect(toggleChoice(f, five, 'Creative')).toEqual(five);
    const state = emptyBrief();
    state.answers.personality = [...five, 'Creative'];
    expect(validateField(f, state)).toBe(c.tooMany(5));
    const avoid = field('avoid');
    expect(toggleChoice(avoid, ['Gradients', 'Other'], c.noPreference)).toEqual([c.noPreference]);
    expect(toggleChoice(avoid, [c.noPreference], 'Gradients')).toEqual(['Gradients']);
    state.answers.avoid = [c.noPreference, 'Gradients'];
    expect(validateField(avoid, state)).toBe(c.invalidChoice);
  });
  it('validates whitespace, long answers, exact-name confirmation, dates and competitors', () => {
    const state = emptyBrief();
    state.answers.trading = '   ';
    expect(validateField(field('trading'), state)).toBe(c.missing);
    state.answers.trading = 'A'.repeat(limits.short + 1);
    expect(validateField(field('trading'), state)).toBe(c.tooLong(limits.short));
    state.answers.trading = 'Studio';
    state.answers.nameConfirmed = false;
    expect(validateField(field('nameConfirmed'), state)).toBe(c.missing);
    state.answers.nameConfirmed = true;
    expect(validateField(field('nameConfirmed'), state)).toBeUndefined();
    state.answers.anything = 'A'.repeat(limits.long + 1);
    expect(validateField(field('anything'), state)).toBe(c.tooLong(limits.long));
    state.answers.deadline = 'Yes';
    state.answers.deadlineDate = '2026-02-30';
    expect(validateField(field('deadlineDate'), state)).toBe(c.invalidDate);
    state.competitors = [{ id: '1', name: 'Example', website: 'javascript:alert(1)' }];
    expect(validateField(field('competitors'), state)).toBe(c.invalidWebsite);
    state.competitors[0].website = 'https://example.org';
    expect(validateField(field('competitors'), state)).toBeUndefined();
  });
  it('validates reference count, explanations and original type/size boundaries', () => {
    const state = emptyBrief();
    state.answers.references = 'Yes';
    expect(validateField(field('images'), state)).toBe(c.imagesRequired);
    state.images = [{ id: '1', data: '', width: 10, height: 10, explanation: '' }];
    expect(validateField(field('images'), state)).toBe(c.missing);
    state.images[0].explanation = 'Clear lettering';
    expect(validateField(field('images'), state)).toBeUndefined();
    state.images = Array(6).fill(state.images[0]);
    expect(validateField(field('images'), state)).toBe(c.imageLimit);
    for (const type of ['image/png', 'image/jpeg', 'image/webp'])
      expect(() => validateImageFile({ type, size: limits.imageBytes })).not.toThrow();
    for (const type of ['image/svg+xml', 'text/html', 'image/gif'])
      expect(() => validateImageFile({ type, size: 100 })).toThrow(c.imageType);
    expect(() => validateImageFile({ type: 'image/png', size: limits.imageBytes + 1 })).toThrow(
      c.imageSize,
    );
  });
});

it('creates a complete local multi-page PDF with long text and five embedded references', async () => {
  const state = emptyBrief();
  for (const f of fields) {
    if (f.optional || !isVisible(f, state.answers) || ['competitors', 'images'].includes(f.type))
      continue;
    state.answers[f.id] =
      f.type === 'single'
        ? f.options![0]
        : f.type === 'multi'
          ? [f.options![0]]
          : f.type === 'confirm'
            ? true
            : 'Example business';
  }
  state.answers.anything = 'A longer note about readable lettering and practical usage. '.repeat(
    33,
  );
  const data = await sharp({
    create: { width: 1000, height: 500, channels: 3, background: '#e1e5f0' },
  })
    .jpeg()
    .toBuffer();
  state.images = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    data: 'data:image/jpeg;base64,' + data.toString('base64'),
    width: 1000,
    height: 500,
    explanation:
      `Reference ${i + 1} caption. ` + 'I like the clear spacing and proportions. '.repeat(5),
  }));
  expect(includesAnswer(state.answers.references, 'Yes')).toBe(true);
  expect(invalidSection(state)).toBe(-1);
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createLogoBriefPDF } = await import('../src/lib/logo-brief/pdf');
  const pdf = await createLogoBriefPDF(state, new Date('2026-09-16T12:00:00Z'));
  const bytes = Buffer.from(await pdf.arrayBuffer());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.toString('latin1')).not.toContain('/Encrypt');
  await mkdir('test-results/logo-brief', { recursive: true });
  await writeFile('test-results/logo-brief/long-with-images.pdf', bytes);
  state.answers.trading = 'Unsupported 🪿';
  await expect(createLogoBriefPDF(state)).rejects.toThrow('Unsupported PDF glyph');
  state.answers.trading = '';
  await expect(createLogoBriefPDF(state)).rejects.toThrow('Incomplete logo brief');
});
