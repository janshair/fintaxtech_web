import { describe, it, expect } from 'vitest';
import { createBriefRules } from '../src/lib/client-brief/rules';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import {
  templateBriefCopy,
  templateBriefSections as sections,
  templateChoices,
} from '../src/content/template-brief';
import { templateBriefSchemas } from '../src/content/template-briefs';
import { barberDemo } from '../src/content/barber-demo';
import {
  templateBriefFilename,
  templateBriefText,
  templatePrefill,
  toTemplateBriefData,
} from '../src/lib/client-brief/template-brief';
import { reviewedWebsiteSubmission } from '../src/lib/client-brief/website-submission';
import { validateWebsiteSubmission } from '../src/server/website-brief-validation';
import { formatWebsiteBrief, slackWebsiteParts } from '../src/server/website-brief-format';
import { allTemplates } from '../src/content/templates';
import { indexablePaths, seoPages } from '../src/content/seo';
import {
  barberAnswers,
  barberReview,
  barberServices,
  completeTemplateBrief,
} from './fixtures/template-brief';
import type { BriefState } from '../src/lib/client-brief/types';

const rules = createBriefRules(sections);
const field = (id: string) => sections.flatMap((s) => s.fields).find((f) => f.id === id)!;
const error = (state: BriefState, id: string) => rules.validateField(field(id), state);
const row = (values: Record<string, string>) => ({ id: crypto.randomUUID(), values });

describe('template brief registry', () => {
  it('lists every template, with only those that have a schema selectable', () => {
    const picker = field('templateChoice');
    expect(Object.keys(templateBriefSchemas)).toEqual(['barber-01']);
    expect(picker.options).toEqual(['The Brass Standard']);
    expect(picker.comingSoon).toEqual(
      allTemplates.filter((t) => t.id !== 'barber-01').map((t) => t.name),
    );
    expect(Object.keys(picker.examples!)).toHaveLength(allTemplates.length);
    expect(templateChoices.every((t) => t.available === (t.id === 'barber-01'))).toBe(true);
    const state = completeTemplateBrief();
    state.answers.templateChoice = 'The Fold Atelier';
    expect(error(state, 'templateChoice')).toBe(templateBriefCopy.invalidChoice);
  });
  it('shows template sections only for the chosen template', () => {
    const titles = (choice?: string) =>
      rules.visibleSections(choice ? { templateChoice: choice } : {}).map((s) => s.title);
    expect(titles()).not.toContain('Your services and booking');
    expect(titles('The Brass Standard')).toEqual(
      expect.arrayContaining(['Your services and booking', 'Your ritual and lookbook']),
    );
    expect(titles('The Brass Standard').at(-1)).toBe('Confirm');
  });
  it('registers the unlisted routes as noindex', () => {
    for (const path of [
      '/client/website-brief/templates/',
      '/client/website-brief/templates/barber-01/',
    ]) {
      expect(seoPages[path]).toMatchObject({ noindex: true, nofollow: true });
      expect(indexablePaths).not.toContain(path);
    }
    expect(seoPages['/client/website-brief/templates/tailoring-02/']).toBeUndefined();
    expect(clientBriefDefinitions.template.sections).toBe(sections);
    expect(barberDemo.briefRoute).toBe('/client/website-brief/templates/barber-01/');
  });
});

describe('barber-01 template brief validation', () => {
  it('accepts the complete fixture', () => {
    expect(rules.invalidSection(completeTemplateBrief())).toBe(-1);
  });
  it('needs 3 to 6 services with limited lengths and a £ price', () => {
    const state = completeTemplateBrief();
    state.rows.barberServices = state.rows.barberServices.slice(0, 2);
    expect(error(state, 'barberServices')).toBe('Add at least 3 entries.');
    state.rows.barberServices = Array.from({ length: 7 }, () => row(barberServices[0]));
    expect(error(state, 'barberServices')).toBe('Add no more than 6 entries.');
    for (const [price, ok] of [
      ['£30', true],
      ['From £30', true],
      ['from £12.50', true],
      ['30', false],
      ['£30 per cut', false],
      ['£12.5', false],
      ['From 30', false],
    ] as const) {
      state.rows.barberServices = [0, 1, 2].map(() => row({ ...barberServices[0], price }));
      expect(error(state, 'barberServices'), price).toBe(
        ok ? undefined : 'Enter a price like £30 or From £30.',
      );
    }
    state.rows.barberServices = [0, 1, 2].map(() =>
      row({ ...barberServices[0], name: 'x'.repeat(41) }),
    );
    expect(error(state, 'barberServices')).toBe(templateBriefCopy.tooLong(40));
    state.rows.barberServices = [0, 1, 2].map(() =>
      row({ ...barberServices[0], description: 'x'.repeat(81) }),
    );
    expect(error(state, 'barberServices')).toBe(templateBriefCopy.tooLong(80));
  });
  it('keeps the sample when chosen, so nothing blocks the customer', () => {
    const state = completeTemplateBrief();
    state.answers.barberServicesSource = 'Use the template’s sample for now';
    state.rows.barberServices = [];
    rules.pruneBrief(state);
    expect(rules.invalidSection(state)).toBe(-1);
  });
  it('validates hex colours, UK phones and the first-name-and-initial rule', () => {
    const state = completeTemplateBrief();
    for (const [colour, ok] of [
      ['#1F3A5F', true],
      ['#1f3a5f', true],
      ['1F3A5F', false],
      ['#12345', false],
      ['#GGGGGG', false],
    ] as const) {
      state.answers.brandColour = colour;
      expect(error(state, 'brandColour'), colour).toBe(
        ok ? undefined : templateBriefCopy.invalidColour,
      );
    }
    for (const [phone, ok] of [
      ['01592 000000', true],
      ['+44 7526 699217', true],
      ['07526699217', true],
      ['call me', false],
      ['12345', false],
    ] as const) {
      state.answers.contactPhone = phone;
      expect(error(state, 'contactPhone'), phone).toBe(
        ok ? undefined : templateBriefCopy.invalidPhone,
      );
    }
    for (const [name, ok] of [
      ['Sam T.', true],
      ['Mary-Jo O', true],
      ['Sam', false],
      ['Sam Taylor', false],
    ] as const) {
      state.rows.reviews = [row({ ...barberReview, name })];
      expect(error(state, 'reviews'), name).toBe(
        ok ? undefined : 'Use a first name and initial, like Sam T.',
      );
    }
    state.rows.reviews = [row({ ...barberReview, text: 'x'.repeat(301) })];
    expect(error(state, 'reviews')).toBe(templateBriefCopy.tooLong(300));
  });
  it('requires review permission whenever reviews are entered', () => {
    const state = completeTemplateBrief();
    state.answers.reviewPermission = false;
    expect(error(state, 'reviewPermission')).toBe(templateBriefCopy.missing);
    state.answers.hasReviews = 'Not yet — leave reviews out';
    rules.pruneBrief(state);
    expect(state.rows.reviews).toBeUndefined();
    expect(rules.invalidSection(state)).toBe(-1);
  });
  it('requires a booking link only for online booking', () => {
    const state = completeTemplateBrief();
    delete state.answers.bookingLink;
    expect(error(state, 'bookingLink')).toBe(templateBriefCopy.missing);
    state.answers.barberBooking = 'Walk-ins welcome';
    expect(error(state, 'bookingLink')).toBeUndefined();
  });
  it('requires the final approval', () => {
    const state = completeTemplateBrief();
    state.answers.approve = false;
    expect(error(state, 'approve')).toBe(templateBriefCopy.missing);
  });
});

describe('template data and .txt download', () => {
  it('maps answers to the template data shape, with nulls for samples', () => {
    const data = toTemplateBriefData(completeTemplateBrief());
    expect(Object.keys(data)).toEqual([
      'schemaVersion',
      'template',
      'theme',
      'business',
      'contact',
      'hours',
      'online',
      'proof',
      'assets',
      'content',
    ]);
    expect(data).toMatchObject({
      schemaVersion: 1,
      template: 'barber-01',
      theme: { brand: '#1f3a5f', accent: '#d9a441' },
      business: {
        name: barberAnswers.businessName,
        monogram: null,
        area: 'Kirkcaldy',
        heroLine: barberAnswers.heroLine,
        intro: null,
        logo: 'monogram',
      },
      contact: {
        phone: '01592 000000',
        phoneInternational: '+441592000000',
        whatsapp: '01592 000000',
        email: barberAnswers.email,
        address: barberAnswers.address,
        serviceArea: null,
      },
      hours: [
        ['Monday', 'Closed'],
        ['Tuesday – Friday', '09:00 – 18:00'],
        ['Saturday', '08:30 – 16:00'],
        ['Sunday', 'By appointment'],
      ],
      online: {
        instagram: barberAnswers.instagram,
        facebook: null,
        bookingLink: barberAnswers.booking,
        googleBusinessProfile: { status: 'need', link: null },
      },
      proof: { reviews: [{ ...barberReview, stars: 5 }], qualifications: [] },
      assets: ['logo', 'gallery'],
    });
    // The content object matches the keys of barber-demo.ts it replaces.
    expect(data.content).toEqual({
      services: barberServices,
      ritual: null,
      cuts: ['Skin fade', 'Crop', null, null, null, null],
      booking: 'online',
    });
    for (const key of ['services', 'ritual', 'cuts'] as const)
      expect(barberDemo).toHaveProperty(key);
    expect(Object.keys(barberDemo.services[0])).toEqual(Object.keys(barberServices[0]));
  });
  it('writes the ritual in the content file’s format and keeps reviews empty when skipped', () => {
    const state = completeTemplateBrief();
    state.answers.barberRitualSource = 'Write my own';
    state.rows.barberRitual = [
      row({ title: 'Chat', line: 'We talk through what you want.' }),
      row({ title: 'Cut', line: 'Clippers and scissors.' }),
      row({ title: 'Finish', line: 'Styled and checked.' }),
    ];
    state.answers.hasReviews = 'Not yet — leave reviews out';
    state.answers.colours = 'Use the template’s colours';
    state.answers.hoursSource = 'Use the template’s sample for now';
    const data = toTemplateBriefData(state);
    expect(data.content.ritual).toEqual([
      ['01 / CHAT', 'We talk through what you want.'],
      ['02 / CUT', 'Clippers and scissors.'],
      ['03 / FINISH', 'Styled and checked.'],
    ]);
    expect(data.proof.reviews).toEqual([]);
    expect(data.theme).toBeNull();
    expect(data.hours).toBeNull();
    expect(data.contact.address).toBe(barberAnswers.address);
  });
  it('formats a readable brief, a files checklist and valid JSON between the markers', () => {
    const state = completeTemplateBrief();
    const text = templateBriefText(state, new Date('2026-11-01T10:00:00Z'));
    expect(text).not.toContain('\r');
    expect(text.split('\n').slice(0, 5)).toEqual([
      'FINTAXTECH TEMPLATE BRIEF',
      'Template: barber-01 (The Brass Standard)',
      "Business: Jay's Cuts & Co · Kirkcaldy",
      'Reference: L-TEST',
      'Prepared: 2026-11-01',
    ]);
    expect(text).toContain("\n== Your business ==\nBusiness name: Jay's Cuts & Co\n");
    expect(text).toContain('Short introduction: Use template sample');
    expect(text).toContain('The three ritual steps: Use template sample');
    expect(text).toContain(
      'Your services:\n  1. Service name: Skin fade\n     Short description: Clipper fade blended to the skin\n',
    );
    expect(text).toContain('Permission: Confirmed');
    expect(text).toContain(
      '\n== Files to send ==\n[ ] Logo\n[ ] Gallery / work photos (up to 6)\n\nBEGIN TEMPLATE DATA (do not edit below this line)\n',
    );
    const json = text.match(
      /\nBEGIN TEMPLATE DATA \(do not edit below this line\)\n([\s\S]*)\nEND TEMPLATE DATA\n$/,
    )![1];
    expect(JSON.parse(json)).toEqual(toTemplateBriefData(state));
    expect(text).not.toMatch(/<[a-z]/i);
    expect(templateBriefFilename(state)).toBe(
      'FinTaxTech-template-brief-barber-01-jay-s-cuts-and-co.txt',
    );
    state.answers.businessName = 'Ünïcode Barbers ✂';
    expect(templateBriefFilename(state)).toBe(
      'FinTaxTech-template-brief-barber-01-unicode-barbers.txt',
    );
  });
  it('sends Slack the same text through the existing website delivery', () => {
    const state = completeTemplateBrief();
    const payload = reviewedWebsiteSubmission('template', state);
    expect(payload.answers.approve).toBe(true);
    expect(payload.answers.ref).toBe('L-TEST');
    const valid = validateWebsiteSubmission({ ...payload, trap: '' });
    const at = new Date('2026-11-01T10:00:00Z');
    expect(formatWebsiteBrief(valid, at)).toBe(templateBriefText(state, at));
    const parts = slackWebsiteParts(valid, 'abc', at.toISOString());
    expect(parts).toHaveLength(1);
    expect(parts[0].blocks.map((b) => b.text.text).join('')).toContain('BEGIN TEMPLATE DATA');
    expect(() =>
      validateWebsiteSubmission({
        ...payload,
        answers: { ...payload.answers, approve: false },
        trap: '',
      }),
    ).toThrow();
  });
});

describe('template brief pre-fill', () => {
  it('sanitises query values like the template demos', () => {
    const query = new URLSearchParams({
      template: 'barber-01',
      name: `  Jay's   Cuts & Co  ${'x'.repeat(120)}`,
      area: ' Kirkcaldy ',
      phone: '07526-699 217',
      ref: 'L-TEST',
      role: 'Bookkeeper',
      type: 'florist',
    });
    const answers = templatePrefill(`?${query}`);
    expect(answers.templateChoice).toBe('The Brass Standard');
    expect(answers.businessName).toBe(`Jay's Cuts & Co ${'x'.repeat(84)}`);
    expect(Array.from(String(answers.businessName))).toHaveLength(100);
    expect(answers.businessArea).toBe('Kirkcaldy');
    expect(answers.contactPhone).toBe('07526 699 217');
    expect(answers).toMatchObject({
      ref: 'L-TEST',
      presetRole: 'Bookkeeper',
      presetType: 'florist',
    });
  });
  it('drops unsafe or unknown values', () => {
    const answers = templatePrefill(
      '?template=tailoring-02&phone=tel:0800&ref=%3Cscript%3E&name=%3Cb%3EBold%3C%2Fb%3E',
    );
    expect(answers.templateChoice).toBeUndefined();
    expect(answers.contactPhone).toBeUndefined();
    expect(answers.ref).toBeUndefined();
    // Names are kept as text; the page renders them with textContent and value only.
    expect(answers.businessName).toBe('<b>Bold</b>');
    expect(templatePrefill('?template=nope', 'barber-01').templateChoice).toBe(
      'The Brass Standard',
    );
    expect(templatePrefill('').templateChoice).toBeUndefined();
  });
});
