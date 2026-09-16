import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import {
  websiteBriefSections as sections,
  websiteBriefCopy as c,
} from '../src/content/website-brief';
import { createBriefRules, emptyBrief, limits, toggleChoice } from '../src/lib/client-brief/rules';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import { completeWebsiteBrief } from './fixtures/website-brief';
const { validateField, pruneBrief, briefSummary, invalidSection, visibleSections } =
  createBriefRules(sections);
const fields = sections.flatMap((s) => s.fields);
const field = (id: string) => fields.find((f) => f.id === id)!;
afterEach(() => vi.unstubAllGlobals());

describe('website production brief', () => {
  it('supports both project types and skips the retention section for new websites', () => {
    for (const redesign of [false, true]) {
      const state = completeWebsiteBrief(redesign);
      expect(invalidSection(state)).toBe(-1);
      expect(visibleSections(state.answers)).toHaveLength(redesign ? 14 : 13);
    }
    const state = completeWebsiteBrief(true);
    state.answers.project = 'New website';
    pruneBrief(state);
    expect(state.answers.existingURL).toBeUndefined();
    expect(state.answers.retain).toBeUndefined();
    expect(JSON.stringify(briefSummary(state))).not.toContain('Existing website URL');
    expect(JSON.stringify(briefSummary(state))).not.toContain('Retain from');
    state.answers.project = 'Partial repair';
    expect(validateField(field('project'), state)).toBe(c.invalidChoice);
  });
  it('removes hidden places, providers and deadlines from review and validation', () => {
    const state = completeWebsiteBrief();
    state.answers = {
      ...state.answers,
      location: ['International'],
      internationalPlaces: 'Worldwide',
      domain: 'Not needed',
      email: 'Not needed',
      emailProvider: 'Hidden provider',
      deadline: 'No fixed date',
    };
    pruneBrief(state);
    for (const id of [
      'localPlaces',
      'country',
      'domainProvider',
      'emailProvider',
      'deadlineDate',
      'deadlineReason',
    ]) {
      expect(state.answers[id]).toBeUndefined();
      expect(validateField(field(id), state)).toBeUndefined();
    }
    expect(invalidSection(state)).toBe(-1);
    expect(JSON.stringify(briefSummary(state))).not.toContain('Hidden provider');
  });
  it('requires valid redesign URLs and conditional provider and place details', () => {
    const state = completeWebsiteBrief(true);
    for (const value of ['', 'example.org', 'javascript:alert(1)', 'https://']) {
      state.answers.existingURL = value;
      expect(validateField(field('existingURL'), state)).toBeTruthy();
    }
    for (const id of ['localPlaces', 'country', 'domainProvider', 'deadlineReason']) {
      state.answers[id] = ' ';
      expect(validateField(field(id), state)).toBe(c.missing);
    }
  });
  it('enforces the two-goal maximum and requires every selected Other detail', () => {
    const state = completeWebsiteBrief();
    state.answers.goals = ['Enquiries', 'Credibility', 'Bookings'];
    expect(validateField(field('goals'), state)).toBe(c.tooMany(2));
    expect(toggleChoice(field('goals'), ['Enquiries', 'Credibility'], 'Bookings')).toEqual([
      'Enquiries',
      'Credibility',
    ]);
    for (const f of fields.filter((f) => f.options?.includes('Other'))) {
      state.answers[f.id] = f.type === 'single' ? 'Other' : ['Other'];
      delete state.answers[`${f.id}Other`];
      expect(validateField(f, state)).toBe(c.missing);
      state.answers[`${f.id}Other`] = 'Specific requirement';
      expect(validateField(f, state)).toBeUndefined();
      expect(JSON.stringify(briefSummary(state))).toContain('Other: Specific requirement');
      state.answers[f.id] = f.type === 'single' ? f.options![0] : [f.options![0]];
      pruneBrief(state);
      expect(state.answers[`${f.id}Other`]).toBeUndefined();
    }
  });
  it('makes None and Nothing—start again exclusive in both UI rules and validation', () => {
    const state = completeWebsiteBrief(true);
    for (const id of ['assets', 'capabilities', 'retain']) {
      const f = field(id),
        exclusive = f.exclusive![0],
        other = f.options![0];
      expect(toggleChoice(f, [other], exclusive)).toEqual([exclusive]);
      expect(toggleChoice(f, [exclusive], other)).toEqual([other]);
      state.answers[id] = [other, exclusive];
      expect(validateField(f, state)).toBe(c.invalidChoice);
    }
  });
  it('allows additional-only pages, requires names and limits them to ten', () => {
    const state = emptyBrief();
    expect(validateField(field('additionalPages'), state)).toBe(c.pageRequired);
    state.additionalPages = [{ id: '1', name: 'Careers', purpose: '' }];
    expect(validateField(field('additionalPages'), state)).toBeUndefined();
    state.additionalPages[0].name = '   ';
    expect(validateField(field('additionalPages'), state)).toBe(c.missing);
    state.additionalPages = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Unique page ${i}`,
      purpose: '',
    }));
    expect(validateField(field('additionalPages'), state)).toBeUndefined();
    state.additionalPages.push({ id: '11', name: 'Eleventh page', purpose: '' });
    expect(validateField(field('additionalPages'), state)).toBe(c.pageLimit);
    state.additionalPages = [];
    state.answers.pages = ['Home'];
    expect(validateField(field('additionalPages'), state)).toBeUndefined();
  });
  it('rejects case/spacing/Unicode-equivalent duplicates and standard page names', () => {
    const state = completeWebsiteBrief();
    for (const name of ['  careers ', 'CAREERS', 'Ｃａｒｅｅｒｓ', ' Home ', 'ABOUT']) {
      state.additionalPages[1].name = name;
      expect(validateField(field('additionalPages'), state)).toBe(c.pageDuplicate);
    }
    state.additionalPages = [
      { id: '1', name: 'News room', purpose: '' },
      { id: '2', name: 'News   room', purpose: '' },
    ];
    expect(validateField(field('additionalPages'), state)).toBe(c.pageDuplicate);
    state.additionalPages.pop();
    expect(validateField(field('additionalPages'), state)).toBeUndefined();
    state.additionalPages[0].purpose = 'x'.repeat(limits.short + 1);
    expect(validateField(field('additionalPages'), state)).toBe(c.tooLong(limits.short));
  });
  it('includes standard pages, additional page purposes and scope review in the summary', () => {
    const summary = JSON.stringify(briefSummary(completeWebsiteBrief()));
    for (const value of [
      'Home; About; Services; Contact',
      'Careers',
      'Show open roles',
      'Press',
      'Scope review',
      'Customer accounts for scope review',
    ])
      expect(summary).toContain(value);
    expect(field('content').options).toHaveLength(2);
  });
});

it('creates locally generated website PDFs for both branches and long page lists', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
  for (const redesign of [false, true]) {
    const state = completeWebsiteBrief(redesign);
    state.additionalPages = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Additional destination ${i + 1}`,
      purpose: 'A useful page explaining a distinct part of the business. '.repeat(4),
    }));
    state.answers.anything =
      'Prioritise clear navigation, readable content and useful customer journeys. '.repeat(25);
    const pdf = await createClientBriefPDF(
      clientBriefDefinitions.website,
      state,
      new Date('2026-09-16T12:00:00Z'),
    );
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.toString('latin1')).not.toContain('/Encrypt');
    await mkdir('tmp/website-brief-qa', { recursive: true });
    await writeFile(`tmp/website-brief-qa/${redesign ? 'redesign' : 'new'}.pdf`, bytes);
  }
  const incomplete = completeWebsiteBrief();
  incomplete.answers.goals = [];
  await expect(createClientBriefPDF(clientBriefDefinitions.website, incomplete)).rejects.toThrow(
    'Incomplete client brief',
  );
});
