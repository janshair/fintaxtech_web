import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  websiteDemoBriefCopy as c,
  websiteDemoBriefSections as sections,
} from '../src/content/website-demo-brief';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import { createBriefRules, emptyBrief, limits } from '../src/lib/client-brief/rules';
import { completeWebsiteDemoBrief } from './fixtures/website-demo-brief';
import { reviewedWebsiteSubmission } from '../src/lib/client-brief/website-submission';
import { validateWebsiteSubmission } from '../src/server/website-brief-validation';
import { formatWebsiteBrief, slackWebsiteParts } from '../src/server/website-brief-format';

const { validateField, invalidSection, briefSummary, pruneBrief } = createBriefRules(sections);
const fields = sections.flatMap((section) => section.fields);
const field = (id: string) => fields.find((item) => item.id === id)!;
afterEach(() => vi.unstubAllGlobals());

describe('free website demo brief', () => {
  it.each([
    ['Both are acceptable', 'Provisional styling permitted; placeholder imagery permitted.'],
    [
      'Provisional styling only',
      'Provisional styling permitted; placeholder imagery not permitted.',
    ],
    [
      'Placeholder imagery only',
      'Provisional styling not permitted; placeholder imagery permitted.',
    ],
    ['Neither', 'Provisional styling not permitted; placeholder imagery not permitted.'],
    [
      'Please ask me first',
      'Ask the client before using provisional styling or placeholder imagery; neither is authorized yet.',
    ],
  ])('renders explicit %s permissions in Slack, review and PDF input', async (choice, wording) => {
    const state = completeWebsiteDemoBrief();
    state.answers.provisionalAssets = choice;
    const label = 'Provisional styling and placeholder imagery permissions';
    const message = formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state));
    expect(message).toContain(`${label}:\n  ${wording}`);
    expect(briefSummary(state).flatMap((section) => section.rows)).toContainEqual({
      label,
      value: wording,
    });

    // Observe the real PDF renderer's text input before font wrapping, without
    // replacing either the shared summary or the permission formatter.
    vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
    const font = await import('../src/lib/pdf-font');
    const input = vi.spyOn(font, 'checkPDFGlyphs');
    try {
      const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
      await createClientBriefPDF(clientBriefDefinitions.websiteDemo, state);
      const text = input.mock.calls.map(([, text]) => text);
      expect(text).toContain(label);
      expect(text).toContain(wording);
      expect(text).not.toContain(choice);
    } finally {
      input.mockRestore();
    }
  });
  it('does not infer permission from an unanswered choice or print empty clarification boilerplate', async () => {
    const state = completeWebsiteDemoBrief();
    delete state.answers.approvalEmail; // Optional; its absence is not a missing decision.
    let message = formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state));
    expect(message).not.toContain('Needs clarification:');
    expect(message).not.toContain('No essential unresolved decisions identified.');
    delete state.answers.provisionalAssets;
    message = formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state));
    expect(message).toContain('Provisional choices permitted: None explicitly authorized.');
    expect(message).toContain(`Needs clarification:\n- ${field('provisionalAssets').label}`);
    expect(message.match(/Needs clarification:/g)).toHaveLength(1);
    expect(briefSummary(state).flatMap((section) => section.rows)).toContainEqual({
      label: 'Provisional styling and placeholder imagery permissions',
      value: 'Not provided',
    });
    const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
    await expect(createClientBriefPDF(clientBriefDefinitions.websiteDemo, state)).rejects.toThrow(
      'Incomplete client brief',
    );
  });
  it('preserves the website-sourcing alternative and keeps the list choice only while no services are supplied', () => {
    const state = completeWebsiteDemoBrief();
    state.rows.priorityOfferings = [];
    for (const choice of ['I will list up to three', 'Help me choose from my existing website']) {
      state.answers.prioritySource = choice;
      const message = formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state));
      expect(message).toContain(`Priority services selection:\n  ${choice}`);
      expect(briefSummary(state).flatMap((section) => section.rows)).toContainEqual({
        label: field('prioritySource').label,
        value: choice,
      });
    }
  });
  it('preserves long pasted coverage lists through validation, review and Slack without guessing locations', () => {
    const state = completeWebsiteDemoBrief();
    const towns = 'Richmond, Twickenham\n'.repeat(40) + 'LAST TOWN';
    const codes = 'TW1, TW2, TW3, TW20\n'.repeat(30) + 'LAST POSTCODE';
    state.answers.serviceArea = towns;
    state.answers.postcodeAreas = codes;
    expect(invalidSection(state)).toBe(-1);
    const payload = validateWebsiteSubmission({
      ...reviewedWebsiteSubmission('websiteDemo', state),
      trap: '',
    });
    expect(payload.answers.serviceArea).toBe(towns);
    expect(payload.answers.postcodeAreas).toBe(codes);
    const rows = briefSummary(state).flatMap((section) => section.rows);
    expect(rows.find((row) => row.label === field('serviceArea').label)!.value).toBe(towns);
    expect(rows.find((row) => row.label === field('postcodeAreas').label)!.value).toBe(codes);
    const message = formatWebsiteBrief(payload);
    expect(message).toContain(towns.replaceAll('\n', '\n  '));
    expect(message).toContain(codes.replaceAll('\n', '\n  '));
    expect(
      slackWebsiteParts(payload, 'demo-test', '2026-10-10T12:00:00Z')
        .map((part) => part.text)
        .join(''),
    ).toContain('LAST POSTCODE');
    state.answers.serviceArea = 'x'.repeat(limits.long + 1);
    expect(validateField(field('serviceArea'), state)).toBe(c.tooLong(limits.long));
    expect(() =>
      validateWebsiteSubmission({ ...reviewedWebsiteSubmission('websiteDemo', state), trap: '' }),
    ).toThrow();
  });
  it('requires a service list or a website, and booking intent from either the goal or visitor action', () => {
    const state = completeWebsiteDemoBrief();
    state.rows.priorityOfferings = [];
    expect(validateField(field('priorityOfferings'), state)).toBe(c.rowRequired);
    state.answers.prioritySource = 'Help me choose from my existing website';
    delete state.answers.existingURL;
    expect(validateField(field('existingURL'), state)).toBe(c.missing);
    state.answers.existingURL = 'https://business.example';
    expect(invalidSection(state)).toBe(-1);
    for (const [goals, action] of [
      ['Bookings', 'Enquire'],
      ['Enquiries', 'Book'],
    ]) {
      state.answers.goals = goals;
      state.answers.action = action;
      delete state.answers.demoBooking;
      expect(validateField(field('demoBooking'), state)).toBe(c.missing);
    }
    state.answers.demoBooking = 'Link to an existing booking service';
    expect(validateField(field('bookingURL'), state)).toBe(c.missing);
    state.answers.bookingURL = 'https://booking.example';
    expect(invalidSection(state)).toBe(-1);
    state.answers.demoBooking = 'Illustrative booking flow';
    pruneBrief(state);
    expect(state.answers.bookingURL).toBeUndefined();
    state.answers.action = 'Enquire';
    pruneBrief(state);
    expect(state.answers.demoBooking).toBeUndefined();
  });
  it('requires pricing explanation per relevant reference and filters hidden nested answers everywhere', () => {
    const state = completeWebsiteDemoBrief();
    const row = state.rows.referenceWebsites[0];
    for (const explanation of ['Pricing', 'Their visible prices', 'Price cards']) {
      row.values.explanation = explanation;
      expect(validateField(field('referenceWebsites'), state)).toBe(c.missing);
    }
    row.values.pricingFocus = 'Another reason';
    expect(validateField(field('referenceWebsites'), state)).toBe(c.missing);
    row.values.pricingReason = 'Simple breakdown of call-out charges';
    expect(validateField(field('referenceWebsites'), state)).toBeUndefined();
    expect(formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state))).toContain(
      row.values.pricingReason,
    );
    row.values.explanation = 'Calm typography';
    const payload = validateWebsiteSubmission({
      kind: 'websiteDemo',
      answers: state.answers,
      rows: state.rows,
      additionalPages: [],
      trap: '',
    });
    expect(payload.rows.referenceWebsites[0].values).not.toHaveProperty('pricingReason');
    expect(JSON.stringify(briefSummary(state))).not.toContain('Simple breakdown');
    expect(formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state))).not.toContain(
      'Simple breakdown',
    );
    pruneBrief(state);
    expect(row.values.pricingFocus).toBeUndefined();
    expect(row.values.pricingReason).toBeUndefined();
  });
  it('requires explicit permissions and lists only specifically authorized provisional choices', () => {
    const state = completeWebsiteDemoBrief();
    delete state.answers.provisionalAssets;
    expect(validateField(field('provisionalAssets'), state)).toBe(c.missing);
    expect(() =>
      validateWebsiteSubmission({ ...reviewedWebsiteSubmission('websiteDemo', state), trap: '' }),
    ).toThrow();
    delete state.answers.designPreferences;
    delete state.answers.differentiators;
    delete state.answers.homepageSections;
    delete state.answers.assetNotes;
    delete state.answers.verifiedFacts;
    state.answers.assets = ['None'];
    state.answers.provisionalAssets = 'Please ask me first';
    let message = formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state));
    expect(message).toContain('Available assets:\n  None');
    expect(message).toContain('Primary customers:\n  Homeowners; Businesses');
    expect(message).toContain('Customer need:');
    expect(message).toContain(
      'Contact / approver:\n  Name: Jamie Orchard\n  Email: jamie@orchard.example',
    );
    expect(message).not.toContain('Not provided');
    expect(message).not.toContain('Design preferences:');
    expect(message).not.toContain('Missing information:');
    expect(message).not.toContain('agreed proposal');
    expect(message).toContain(
      'Needs clarification:\n- Business facts / source material to be supplied and approved before use',
    );
    expect(message).toContain('Ask before using provisional styling');
    expect(message).toContain('Provisional choices permitted: None explicitly authorized.');
    state.answers.provisionalAssets = 'Placeholder imagery only';
    state.answers.pricingDirection = 'Clearly labelled provisional content';
    message = formatWebsiteBrief(reviewedWebsiteSubmission('websiteDemo', state));
    const permissions = message.split('Provisional choices permitted:')[1];
    expect(permissions).toContain('Placeholder imagery');
    expect(permissions).toContain('Clearly labelled provisional pricing content');
    expect(permissions).not.toContain('Provisional styling');
  });
  it('uses five short sections with no upload or production-scope questions', () => {
    expect(sections).toHaveLength(5);
    expect(new Set(fields.map((item) => item.id)).size).toBe(fields.length);
    expect(fields.some((item) => ['images', 'pages', 'confirm'].includes(item.type))).toBe(false);
    expect(c.intro).toContain('does not include a full production website');
    expect(c.workflow).toContain('deploy only with your authorization');
    expect(invalidSection(completeWebsiteDemoBrief())).toBe(-1);
    expect(invalidSection(emptyBrief())).toBe(0);
  });
  it('requires one to three valid URL/explanation pairs and allows longer explanations', () => {
    const state = completeWebsiteDemoBrief();
    const references = field('referenceWebsites');
    const row = state.rows.referenceWebsites[0];
    state.rows.referenceWebsites = [];
    expect(validateField(references, state)).toBe(c.rowRequired);
    state.rows.referenceWebsites = [row];
    for (const url of ['', 'example.com', 'javascript:alert(1)', 'ftp://example.com', 'https://']) {
      row.values.url = url;
      expect(validateField(references, state)).toBeTruthy();
    }
    row.values.url = 'https://reference.example';
    row.values.explanation = ' ';
    expect(validateField(references, state)).toBe(c.missing);
    row.values.explanation = 'A'.repeat(limits.short + 1);
    expect(validateField(references, state)).toBeUndefined();
    row.values.explanation = 'A'.repeat(limits.long + 1);
    expect(validateField(references, state)).toBe(c.tooLong(limits.long));
    row.values.explanation = 'Useful typography';
    state.rows.referenceWebsites = Array.from({ length: 3 }, (_, n) => ({ ...row, id: String(n) }));
    expect(validateField(references, state)).toBeUndefined();
    state.rows.referenceWebsites.push({ ...row, id: '4' });
    expect(validateField(references, state)).toBe(c.rowLimit(3));
  });
  it('keeps optional details optional and validates chosen Other details, dates and email', () => {
    const state = completeWebsiteDemoBrief();
    for (const item of fields.filter((item) => item.optional)) {
      delete state.answers[item.id];
      delete state.rows[item.id];
    }
    expect(invalidSection(state)).toBe(-1);
    state.answers.goals = 'Other';
    expect(validateField(field('goals'), state)).toBe(c.missing);
    state.answers.goalsOther = 'Support recruitment';
    expect(validateField(field('goals'), state)).toBeUndefined();
    state.answers.goals = 'Enquiries';
    pruneBrief(state);
    expect(state.answers.goalsOther).toBeUndefined();
    state.answers.approvalEmail = 'invalid';
    expect(validateField(field('approvalEmail'), state)).toBe(c.invalidEmail);
    state.answers.reviewDeadline = '2026-02-30';
    expect(validateField(field('reviewDeadline'), state)).toBe(c.invalidDate);
  });
  it('includes all supplied answers and reference explanations in the shared summary', () => {
    const state = completeWebsiteDemoBrief();
    const summary = JSON.stringify(briefSummary(state));
    for (const [id, value] of Object.entries(state.answers)) {
      if (id === 'prioritySource') continue; // Supplied services replace this internal choice.
      const displayed =
        id === 'provisionalAssets'
          ? 'Provisional styling permitted; placeholder imagery not permitted.'
          : value;
      for (const part of Array.isArray(displayed) ? displayed : [displayed])
        expect(summary).toContain(part);
    }
    expect(summary).not.toContain('I will list up to three');
    expect(summary).not.toContain('Provisional styling only');
    expect(summary).toContain('Priority services / products');
    expect(summary).toContain('1. Garden planning and design consultations');
    expect(summary).not.toContain('Service or product and short description');
    for (const rows of Object.values(state.rows))
      for (const row of rows)
        for (const value of Object.values(row.values)) expect(summary).toContain(value);
    expect(summary).toContain('Reference website 1');
  });
});

it('exports a local demo PDF with stage-specific title and rejects incomplete references', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createClientBriefPDF } = await import('../src/lib/client-brief/pdf');
  const state = completeWebsiteDemoBrief();
  const blob = await createClientBriefPDF(
    clientBriefDefinitions.websiteDemo,
    state,
    new Date('2026-10-10T12:00:00Z'),
  );
  const bytes = Buffer.from(await blob.arrayBuffer());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.toString('latin1')).toContain('/Title (Free Website Demo Brief)');
  expect(bytes.toString('latin1')).not.toContain('/Encrypt');
  await mkdir('tmp/website-brief-qa', { recursive: true });
  await writeFile('tmp/website-brief-qa/demo.pdf', bytes);
  state.rows.referenceWebsites[0].values.explanation = '';
  await expect(createClientBriefPDF(clientBriefDefinitions.websiteDemo, state)).rejects.toThrow(
    'Incomplete client brief',
  );
});
