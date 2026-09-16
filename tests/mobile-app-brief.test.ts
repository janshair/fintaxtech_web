import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import {
  mobileAppBriefSections as sections,
  mobileAppBriefCopy as c,
} from '../src/content/mobile-app-brief';
import { createBriefRules, fieldOptions, toggleChoice } from '../src/lib/client-brief/rules';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import { completeMobileBrief } from './fixtures/mobile-app-brief';
const { validateField, pruneBrief, briefSummary, invalidSection } = createBriefRules(sections);
const fields = sections.flatMap((s) => s.fields);
const field = (id: string) => fields.find((f) => f.id === id)!;
afterEach(() => vi.unstubAllGlobals());

describe('mobile app production brief', () => {
  it('validates both project types and prunes redesign, tablets, systems and deadline details', () => {
    for (const redesign of [false, true])
      expect(invalidSection(completeMobileBrief(redesign))).toBe(-1);
    const state = completeMobileBrief(true);
    Object.assign(state.answers, {
      project: 'New app',
      devices: 'FinTaxTech to recommend',
      systems: 'No',
      deadline: 'No fixed date',
    });
    pruneBrief(state);
    for (const id of ['appLinks', 'tablets', 'deadlineDate', 'deadlineReason'])
      expect(state.answers[id]).toBeUndefined();
    expect(state.rows.systemDetails).toBeUndefined();
    expect(invalidSection(state)).toBe(-1);
    expect(JSON.stringify(briefSummary(state))).not.toContain('Scheduling system');
    state.answers.project = 'Legacy-code repair';
    expect(validateField(field('project'), state)).toBe(c.invalidChoice);
    expect(field('content').options).toHaveLength(2);
  });
  it('validates every redesign URL and actual calendar dates', () => {
    const state = completeMobileBrief(true);
    for (const value of [
      '',
      'https://valid.example\nnot-a-url',
      'javascript:alert(1)',
      'https://',
    ]) {
      state.answers.appLinks = value;
      expect(validateField(field('appLinks'), state)).toBeTruthy();
    }
    state.answers.appLinks = 'https://apps.apple.com/example\n\nhttps://play.google.com/example';
    expect(validateField(field('appLinks'), state)).toBeUndefined();
    state.answers.deadlineDate = '2026-02-30';
    expect(validateField(field('deadlineDate'), state)).toBe(c.invalidDate);
  });
  it('limits tasks to three and success measures to two and requires every Other detail', () => {
    const state = completeMobileBrief();
    for (const id of ['tasks', 'success']) {
      const f = field(id),
        selected = f.options!.slice(0, f.max);
      expect(toggleChoice(f, selected, f.options![f.max!])).toEqual(selected);
      state.answers[id] = f.options!.slice(0, f.max! + 1);
      expect(validateField(f, state)).toBe(c.tooMany(f.max!));
    }
    for (const f of fields.filter((f) => f.options?.includes('Other') && !f.otherField)) {
      state.answers[f.id] = ['Other'];
      expect(validateField(f, state)).toBe(c.missing);
      state.answers[`${f.id}Other`] = 'Specific requirement';
      expect(validateField(f, state)).toBeUndefined();
      expect(JSON.stringify(briefSummary(state))).toContain('Other: Specific requirement');
      state.answers[f.id] = [f.options![0]];
      pruneBrief(state);
      expect(state.answers[`${f.id}Other`]).toBeUndefined();
    }
  });
  it('makes None exclusive and includes sensitive-data review in the summary', () => {
    const state = completeMobileBrief();
    expect(JSON.stringify(briefSummary(state))).toContain('scope and privacy review');
    for (const id of ['assets', 'information']) {
      const f = field(id),
        value = f.options![0];
      expect(toggleChoice(f, [value], 'None')).toEqual(['None']);
      expect(toggleChoice(f, ['None'], value)).toEqual([value]);
      state.answers[id] = [value, 'None'];
      expect(validateField(f, state)).toBe(c.invalidChoice);
    }
  });
  it('only allows selected standard features as priorities and removes stale priorities and rows', () => {
    const state = completeMobileBrief();
    expect(fieldOptions(field('essentialFeatures'), state.answers)).toEqual([
      'Accounts/login',
      'Booking',
      'None of these in the first release',
      'Not sure',
    ]);
    state.answers.essentialFeatures = ['Search'];
    expect(validateField(field('essentialFeatures'), state)).toBe(c.invalidChoice);
    state.answers.essentialFeatures = ['Booking', 'Not sure'];
    expect(validateField(field('essentialFeatures'), state)).toBe(c.invalidChoice);
    state.answers.essentialFeatures = ['Booking'];
    state.answers.features = ['Accounts/login'];
    pruneBrief(state);
    expect(state.answers.essentialFeatures).toEqual([]);
    expect(state.rows.customFeatures).toBeUndefined();
    expect(validateField(field('essentialFeatures'), state)).toBe(c.missing);
    state.answers.features = ['Other'];
    pruneBrief(state);
    expect(state.answers.essentialFeatures).toBeUndefined();
    expect(validateField(field('features'), state)).toBeUndefined();
    expect(validateField(field('customFeatures'), state)).toBe(c.rowRequired);
  });
  it('requires every custom feature field and valid release priority; systems also need name and purpose', () => {
    for (const id of ['customFeatures', 'systemDetails']) {
      const state = completeMobileBrief(),
        f = field(id);
      for (const part of f.repeat!.fields) {
        const value = state.rows[id][0].values[part.key];
        state.rows[id][0].values[part.key] = ' ';
        expect(validateField(f, state)).toBe(c.missing);
        state.rows[id][0].values[part.key] = value;
      }
      state.rows[id] = [];
      expect(validateField(f, state)).toBe(c.rowRequired);
    }
    const state = completeMobileBrief();
    state.rows.customFeatures[0].values.release = 'Maybe';
    expect(validateField(field('customFeatures'), state)).toBe(c.invalidChoice);
  });
  it('limits custom features to ten and rejects normalised duplicates and standard feature names', () => {
    const state = completeMobileBrief();
    state.rows.customFeatures = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      values: { name: `Feature ${i + 1}`, purpose: 'A specific task.', release: 'Yes' },
    }));
    expect(validateField(field('customFeatures'), state)).toBeUndefined();
    state.rows.customFeatures.push({
      id: '11',
      values: { name: 'Eleventh', purpose: 'Another task', release: 'Later' },
    });
    expect(validateField(field('customFeatures'), state)).toBe(c.rowLimit(10));
    state.rows.customFeatures.pop();
    for (const name of [
      ' feature 1 ',
      'FEATURE 1',
      'Ｆｅａｔｕｒｅ １',
      'Feature   1',
      ' search ',
    ]) {
      state.rows.customFeatures[1].values.name = name;
      expect(validateField(field('customFeatures'), state)).toBe(c.rowDuplicate);
    }
    state.rows.customFeatures.splice(1, 1);
    expect(validateField(field('customFeatures'), state)).toBeUndefined();
    expect(JSON.stringify(briefSummary(state))).toContain('Needed in first release?: Yes');
  });
});

it('generates readable local PDFs containing all ten custom features, priorities and connected systems', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
  for (const redesign of [false, true]) {
    const state = completeMobileBrief(redesign);
    state.rows.customFeatures = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      values: {
        name: `Custom capability ${i + 1}`,
        purpose: 'Help the customer complete a useful task. '.repeat(5),
        release: i % 2 ? 'Later' : 'Yes',
      },
    }));
    state.rows.systemDetails.push({
      id: '2',
      values: { name: 'Business records system', purpose: 'Sync completed work for office staff.' },
    });
    state.answers.anything =
      'Make the core journey clear, readable and accessible for all customers. '.repeat(25);
    const pdf = await createClientBriefPDF(
      clientBriefDefinitions.mobile,
      state,
      new Date('2026-09-16T12:00:00Z'),
    );
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.toString('latin1')).not.toContain('/Encrypt');
    await mkdir('tmp/mobile-app-brief-qa', { recursive: true });
    await writeFile(`tmp/mobile-app-brief-qa/${redesign ? 'redesign' : 'new'}.pdf`, bytes);
  }
  const incomplete = completeMobileBrief();
  incomplete.rows.customFeatures = [];
  await expect(createClientBriefPDF(clientBriefDefinitions.mobile, incomplete)).rejects.toThrow(
    'Incomplete client brief',
  );
});
