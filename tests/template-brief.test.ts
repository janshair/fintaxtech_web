import { describe, it, expect } from 'vitest';
import { createBriefRules } from '../src/lib/client-brief/rules';
import { clientBriefDefinitions } from '../src/lib/client-brief/definitions';
import {
  templateBriefCopy,
  templateBriefRedirect,
  templateBriefSections as sections,
  templateChoices,
  useSample,
} from '../src/content/template-brief';
import { templateBriefSchemas } from '../src/content/template-briefs';
import { keepSteps } from '../src/content/template-briefs/shared';
import {
  dayHoursText,
  groupHours,
  hoursProblem,
  normalizeDuration,
  normalizePostcode,
  normalizePrice,
  tidy,
} from '../src/lib/client-brief/formats';
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
import { barberDemo } from '../src/content/barber-demo';
import { tailoringDemo } from '../src/content/tailoring-demo';
import { automotiveDemo } from '../src/content/automotive-demo';
import { cleaningDemo } from '../src/content/cleaning-demo';
import { juiceBarDemo } from '../src/content/juice-bar-demo';
import { gymDemo } from '../src/content/gym-demo';
import { consultantDemo } from '../src/content/consultant-demo';
import { beautyDemo, treatments } from '../src/content/beauty-demo';
import { allergenLine, presets, weddingDemo } from '../src/content/wedding-demo';
import {
  barberReview,
  barberServices,
  completeTemplateBrief,
  groupedHours,
  templateIds,
} from './fixtures/template-brief';
import type { BriefState } from '../src/lib/client-brief/types';

const rules = createBriefRules(sections);
const allFields = sections.flatMap((s) => s.fields);
const field = (id: string) => allFields.find((f) => f.id === id)!;
const error = (state: BriefState, id: string) => rules.validateField(field(id), state);
const row = (values: Record<string, string>) => ({ id: crypto.randomUUID(), values });

// The content file each template's data must match, and the keys the brief adds
// on purpose (each is a fact the build needs that the demo file does not hold).
const contentFiles: Record<string, { file: unknown; extras: string[]; samples: string[] }> = {
  'barber-01': { file: barberDemo, extras: ['booking'], samples: ['services', 'cuts', 'ritual'] },
  'tailoring-02': {
    file: tailoringDemo,
    extras: ['services.items[].turnaround', 'appointments'],
    samples: ['services', 'process', 'work'],
  },
  'automotive-03': {
    file: automotiveDemo,
    extras: ['services.items[].price', 'mot', 'makes', 'courtesyCar', 'collection'],
    samples: ['services', 'process', 'work'],
  },
  'cleaning-04': {
    file: cleaningDemo,
    extras: ['products'],
    samples: ['services', 'process', 'work', 'questions'],
  },
  'juice-bar-05': {
    file: juiceBarDemo,
    extras: ['ordering'],
    samples: ['menu', 'stages', 'loyalty'],
  },
  'gym-06': {
    file: gymDemo,
    extras: ['timetableLink', 'firstVisit'],
    samples: ['services', 'memberships', 'timetable', 'facilities', 'process', 'questions'],
  },
  'consultant-07': {
    file: consultantDemo,
    extras: [],
    samples: ['services', 'clients', 'about', 'hero', 'heroCall'],
  },
  'beauty-08': {
    file: { ...beautyDemo, treatments },
    extras: ['technicians'],
    samples: ['treatments', 'policy', 'aftercare'],
  },
  'wedding-09': {
    file: { ...weddingDemo, presets, allergenLine },
    extras: ['fairDates'],
    samples: ['badge'],
  },
};
// Every key the brief writes exists in the content file with the same type, item by item.
function expectShape(value: unknown, reference: unknown, path: string, extras: string[]) {
  if (value === null || value === false) return;
  if (Array.isArray(value)) {
    expect(Array.isArray(reference), path).toBe(true);
    const items = reference as unknown[];
    const sample =
      items.length && typeof items[0] === 'object' && !Array.isArray(items[0])
        ? Object.assign({}, ...items)
        : items[0];
    for (const item of value) expectShape(item, sample, `${path}[]`, extras);
    return;
  }
  if (typeof value === 'object') {
    expect(typeof reference, path).toBe('object');
    for (const [key, item] of Object.entries(value as object)) {
      const next = path ? `${path}.${key}` : key;
      if (extras.includes(next)) continue;
      expect(reference, next).toHaveProperty(key);
      expectShape(item, (reference as Record<string, unknown>)[key], next, extras);
    }
    return;
  }
  expect(typeof value, path).toBe(typeof reference);
}

describe('input formats', () => {
  it('normalises durations and rejects 0 or over 10 hours', () => {
    for (const [raw, out] of [
      ['40', '40 min'],
      ['40 min', '40 min'],
      ['90 mins', '1 hr 30 min'],
      ['1 h 30', '1 hr 30 min'],
      ['1h30', '1 hr 30 min'],
      ['1:30', '1 hr 30 min'],
      ['2 hours', '2 hr'],
      ['1 hr 30 min', '1 hr 30 min'],
      ['+15', '+15 min'],
      ['600', '10 hr'],
    ])
      expect(normalizeDuration(raw), raw).toBe(out);
    for (const raw of ['0', '601', 'eleven hours', '1 h 75', '', '-5'])
      expect(normalizeDuration(raw), raw).toBeNull();
  });
  it('normalises prices and allows the template’s own words', () => {
    expect(normalizePrice('£ 30')).toBe('£30');
    expect(normalizePrice('from £30')).toBe('From £30');
    expect(normalizePrice('£1,150')).toBe('£1,150');
    expect(normalizePrice('£4.50')).toBe('£4.50');
    expect(normalizePrice('£20 per hour')).toBeNull();
    expect(normalizePrice('£20 per Hour', { per: true })).toBe('£20 / hour');
    expect(normalizePrice('by quotation', { words: ['By quotation'] })).toBe('By quotation');
    expect(normalizePrice('poa', { words: ['POA'] })).toBe('POA');
    for (const raw of ['30', '£30 or so', '£12.5', 'From 30', 'POA'])
      expect(normalizePrice(raw), raw).toBeNull();
  });
  it('validates and upper-cases UK postcodes', () => {
    expect(normalizePostcode('dd2 4dx')).toBe('DD2 4DX');
    expect(normalizePostcode('EH11AA')).toBe('EH1 1AA');
    expect(normalizePostcode(' sw1a  1aa ')).toBe('SW1A 1AA');
    for (const raw of ['DD2', '12345', 'DD2 4D', 'DD24DXX'])
      expect(normalizePostcode(raw), raw).toBeNull();
  });
  it('tidies spaces without touching spelling or full stops', () => {
    expect(tidy('  Monday   - Driday.  ')).toBe('Monday - Driday.');
    expect(tidy('One  line \n  two ')).toBe('One line\ntwo');
  });
  it('groups consecutive identical days and checks times', () => {
    expect(groupHours(completeTemplateBrief().rows.hours.map((r) => r.values))).toEqual(
      groupedHours,
    );
    const open = (opens: string, closes: string, extra = {}) => ({
      status: 'Open',
      opens,
      closes,
      ...extra,
    });
    expect(groupHours(Array(7).fill({ status: 'Closed' }))).toEqual([
      ['Monday – Sunday', 'Closed'],
    ]);
    expect(hoursProblem(open('09:00', '17:00'))).toBeUndefined();
    expect(hoursProblem(open('18:00', '09:00'))).toContain('after opening');
    expect(hoursProblem(open('18:00', '02:00', { overnight: 'Yes' }))).toBeUndefined();
    expect(hoursProblem(open('9', '17:00'))).toContain('Enter an opening');
    expect(hoursProblem({ status: 'By appointment' })).toBeUndefined();
    expect(dayHoursText(open('09:00', '20:00', { note: ' Late  night ' }))).toBe(
      '09:00 – 20:00 (Late night)',
    );
  });
  it('makes free-text day ranges impossible: hours are a fixed Monday–Sunday grid', () => {
    const state = completeTemplateBrief();
    state.rows.hours = [row({ days: 'Monday - Driday', status: 'Open', times: '9-5' })];
    expect(error(state, 'hours')).toBe('Add at least 7 entries.');
    expect(field('hours').repeat!.fields.map((part) => part.key)).toEqual([
      'status',
      'opens',
      'closes',
      'overnight',
      'note',
    ]);
    state.rows.hours = completeTemplateBrief().rows.hours;
    state.rows.hours[0].values.note = 'x'.repeat(41);
    expect(error(state, 'hours')).toBe(templateBriefCopy.tooLong(40));
  });
});

describe('template brief registry and route', () => {
  it('unlocks every template', () => {
    const picker = field('templateChoice');
    expect(Object.keys(templateBriefSchemas).sort()).toEqual(allTemplates.map((t) => t.id).sort());
    expect(picker.options).toEqual(allTemplates.map((t) => t.name));
    expect(picker.comingSoon).toEqual([]);
    expect(templateChoices.every((t) => t.available)).toBe(true);
  });
  it('shows each template’s sections and files only when it is chosen', () => {
    for (const id of templateIds) {
      const shown = rules.visibleSections(completeTemplateBrief(id).answers);
      const own = templateBriefSchemas[id].sections.map((s) => s.title);
      for (const title of own) expect(shown.map((s) => s.title)).toContain(title);
      const others = Object.values(templateBriefSchemas)
        .filter((schema) => schema.id !== id)
        .flatMap((schema) => schema.sections);
      for (const section of others)
        expect(shown).not.toContainEqual(expect.objectContaining({ fields: section.fields }));
    }
  });
  it('keeps one indexable-free route; old per-template links redirect', () => {
    expect(seoPages['/client/website-brief/templates/']).toMatchObject({
      noindex: true,
      nofollow: true,
    });
    for (const t of allTemplates) {
      const path = `/client/website-brief/templates/${t.id}/`;
      expect(seoPages[path]).toMatchObject({
        title: templateBriefRedirect.title,
        noindex: true,
        nofollow: true,
      });
      expect(indexablePaths).not.toContain(path);
    }
    expect(clientBriefDefinitions.template.sections).toBe(sections);
    expect(barberDemo.briefRoute).toBe('/client/website-brief/templates/?template=barber-01');
  });
});

// Required answers with no template sample: facts only the customer can give,
// where a default could publish something untrue, and honesty confirmations.
const requiredFacts: Record<string, string> = {
  barberBooking: 'how customers book',
  tailoringAppointments: 'appointments or walk-ins',
  automotiveMot: 'MOT wording only for an approved station',
  cleaningProducts: 'who brings products',
  juiceOrdering: 'how customers order',
  juiceAllergens: 'allergen wording confirmation',
  gymFirstVisit: 'whether a first visit is free, paid or not offered',
  consultantRole: 'picks the role preset',
  consultantCasesChoice: 'real case studies or none',
  beautyPatchTest: 'patch-test wording confirmation',
  beautyVouchers: 'whether vouchers are sold',
  weddingType: 'picks the supplier preset',
  weddingFairs: 'real fairs or none',
};
describe('every required content group can use the template’s sample', () => {
  it.each(templateIds)('%s', (id) => {
    for (const item of templateBriefSchemas[id].sections.flatMap((s) => s.fields)) {
      if (item.when || item.optional || requiredFacts[item.id]) continue;
      expect(
        item.options?.some(
          (option) => option === useSample || option === keepSteps || /sample/i.test(option),
        ),
        item.id,
      ).toBe(true);
    }
  });
});

describe('contact details', () => {
  it('requires the towns or areas served when there is no public address', () => {
    const state = completeTemplateBrief();
    expect(error(state, 'serviceArea')).toBeUndefined();
    state.answers.addressChoice = 'Service area only — no public address';
    rules.pruneBrief(state);
    expect(state.answers.street).toBeUndefined();
    expect(error(state, 'serviceArea')).toBe(templateBriefCopy.missing);
    state.answers.serviceArea = 'Dundee,  Angus and Fife';
    expect(error(state, 'serviceArea')).toBeUndefined();
    const data = toTemplateBriefData(state);
    expect(data.contact).toMatchObject({
      address: null,
      addressParts: null,
      serviceArea: 'Dundee, Angus and Fife',
    });
  });
});

describe.each(templateIds)('%s template brief', (id) => {
  const schema = templateBriefSchemas[id];
  it('accepts the complete made-up fixture', () => {
    expect(rules.invalidSection(completeTemplateBrief(id))).toBe(-1);
  });
  it('lets every optional content group use the template’s sample, or be left out', () => {
    for (const item of schema.sections.flatMap((s) => s.fields)) {
      if (!['rows', 'long'].includes(item.type) && !(item.type === 'text' && item.when)) continue;
      const condition = Array.isArray(item.when) ? item.when[0] : item.when;
      expect(condition, item.id).toBeDefined();
      const control = allFields.find((f) => f.id === condition!.id)!;
      expect(
        control.options!.some((option) =>
          /sample|Keep the template|leave|^No\b|instead/i.test(option),
        ),
        item.id,
      ).toBe(true);
    }
  });
  it('writes content in the shape of the template’s content file', () => {
    const { file, extras } = contentFiles[id];
    expectShape(toTemplateBriefData(completeTemplateBrief(id)).content, file, '', extras);
  });
  it('writes null for every group left as the template’s sample', () => {
    const state = completeTemplateBrief(id);
    for (const item of allFields) {
      const answer = state.answers[item.id];
      if (item.type !== 'single' || typeof answer !== 'string') continue;
      if (item.options?.includes(useSample)) state.answers[item.id] = useSample;
      if (item.options?.includes(keepSteps)) state.answers[item.id] = keepSteps;
    }
    rules.pruneBrief(state);
    expect(rules.invalidSection(state)).toBe(-1);
    const data = toTemplateBriefData(state);
    expect(data.hours).toBeNull();
    expect(data.business.heroLine).toBeNull();
    const content = data.content as Record<string, unknown>;
    const nested =
      id === 'wedding-09'
        ? (Object.values(content.presets as object)[0] as Record<string, unknown>)
        : {};
    for (const key of contentFiles[id].samples) expect(content[key] ?? null, key).toBeNull();
    for (const value of Object.values(nested)) expect(value).toBeNull();
  });
  it('downloads readable text with valid JSON between the markers', () => {
    const state = completeTemplateBrief(id);
    const text = templateBriefText(state, new Date('2026-11-01T10:00:00Z'));
    expect(text).not.toContain('\r');
    expect(text.split('\n')[1]).toBe(
      `Template: ${id} (${allTemplates.find((t) => t.id === id)!.name})`,
    );
    expect(text).toContain('\n  Thursday: 09:00 – 20:00 (Late night Thursday)\n');
    expect(text).toMatch(/\n== Files to send ==\n\[ \] [^\n]+\n/);
    const json = text.match(
      /\nBEGIN TEMPLATE DATA \(do not edit below this line\)\n([\s\S]*)\nEND TEMPLATE DATA\n$/,
    )![1];
    const data = JSON.parse(json);
    expect(data).toEqual(toTemplateBriefData(state));
    expect(data.hours).toEqual(groupedHours);
    expect(data.contact.address).toBe('79 Yarrow Terrace, Dundee DD2 4DX');
    expect(data.contact.addressParts).toEqual({
      street: '79 Yarrow Terrace',
      town: 'Dundee',
      postcode: 'DD2 4DX',
    });
    expect(data.business.heroLine).toBe('Friendly, local and easy to book.');
    expect(data.assets.length).toBeGreaterThan(0);
    expect(templateBriefFilename(state)).toMatch(
      new RegExp(`^FinTaxTech-template-brief-${id}-[a-z0-9-]+\\.txt$`),
    );
  });
  it('sends Slack the same text through the existing website delivery', () => {
    const state = completeTemplateBrief(id);
    const payload = reviewedWebsiteSubmission('template', state);
    const valid = validateWebsiteSubmission({ ...payload, trap: '' });
    const at = new Date('2026-11-01T10:00:00Z');
    expect(formatWebsiteBrief(valid, at)).toBe(templateBriefText(state, at));
    expect(
      slackWebsiteParts(valid, 'abc', at.toISOString())
        .map((p) => p.text)
        .join(''),
    ).toContain('BEGIN TEMPLATE DATA');
  });
});

describe('template content details', () => {
  const content = (id: string) =>
    toTemplateBriefData(completeTemplateBrief(id)).content as Record<string, any>;
  it('barber-01: services, lookbook and booking', () => {
    expect(content('barber-01')).toEqual({
      services: [
        {
          name: 'Skin fade',
          description: 'Clipper fade blended to the skin',
          duration: '40 min',
          price: '£18',
        },
        {
          name: 'Scissor cut',
          description: 'Cut and finish by hand',
          duration: '45 min',
          price: '£20',
        },
        {
          name: 'Beard trim',
          description: 'Shape-up with a hot towel',
          duration: '20 min',
          price: '£12',
        },
        {
          name: 'Cut & beard',
          description: 'Any cut with a beard trim',
          duration: '1 hr 10 min',
          price: 'From £28',
        },
      ],
      ritual: null,
      cuts: ['Skin fade', 'Crop', null, null, null, null],
      booking: 'online',
    });
  });
  it('automotive-03: MOT only when approved, label upper-cased, illustration code', () => {
    const data = content('automotive-03');
    expect(data.mot).toBe(true);
    expect(data.services.items[0]).toEqual({
      code: 'servicing',
      name: 'MOT',
      description: 'Annual MOT test while you wait',
      label: 'TEST',
      price: 'From £45',
    });
    expect(data.makes).toBe('Ford and Vauxhall specialists');
    const state = completeTemplateBrief('automotive-03');
    state.answers.automotiveMot = 'No';
    expect((toTemplateBriefData(state).content as any).mot).toBe(false);
  });
  it('gym-06: one most popular membership, and a timetable grouped by day in time order', () => {
    const data = content('gym-06');
    expect(data.timetable).toEqual([
      {
        day: 'Mon',
        label: 'Monday',
        classes: [
          ['07:00', 'Circuits', '45 min'],
          ['19:00', 'Kettlebells', '1 hr'],
        ],
      },
      { day: 'Tue', label: 'Tuesday', classes: [['18:30', 'Spin', '45 min']] },
    ]);
    expect(data.memberships[0]).toMatchObject({
      featured: true,
      perks: ['Gym floor', 'All classes'],
    });
    expect(data.facilities).toEqual([
      ['▥', 'Free weights & racks'],
      ['◎', 'Cardio zone'],
      ['✳', 'Sauna'],
    ]);
    expect(data.firstVisit).toEqual({ offer: 'day-pass', price: '£8' });
    const state = completeTemplateBrief('gym-06');
    state.rows.gymMemberships[1].values.popular = 'Yes';
    expect(error(state, 'gymMemberships')).toBe('Mark only one membership as most popular.');
  });
  it('consultant-07: real case studies need permission; none hides them', () => {
    expect(content('consultant-07')).toMatchObject({
      role: 'Bookkeeper',
      heroCall: { title: 'Free 30-minute calls', days: 'Tuesday and Thursday' },
      hero: { action: 'Book a free 30-minute call' },
      about: [
        'I help small firms keep their books tidy.',
        'Most clients stay for years because the monthly routine just works.',
      ],
    });
    const state = completeTemplateBrief('consultant-07');
    state.answers.consultantCasesPermission = false;
    expect(error(state, 'consultantCasesPermission')).toBe(templateBriefCopy.missing);
    state.answers.consultantCasesChoice = 'No — leave case studies out';
    rules.pruneBrief(state);
    expect((toTemplateBriefData(state).content as any).cases).toEqual([]);
  });
  it('beauty-08: durations, prices and technicians', () => {
    const data = content('beauty-08');
    expect(data.treatments.map((t: any) => [t.group, t.duration, t.price])).toEqual([
      ['nails', '45 min', '£28'],
      ['nails', '+15 min', 'From £5'],
      ['lashes', '1 hr 30 min', '£45'],
      ['lashes', '1 hr', '£40'],
      ['brows', '20 min', '£14'],
      ['extras', '2 hr', 'POA'],
    ]);
    expect(data.flow.technicians).toEqual(['Any available', 'Amira', 'Jess']);
    expect(data.voucher).toEqual({ value: '£20' });
    expect(data.patchTest).toBe(beautyDemo.patchTest);
  });
  it('wedding-09: the supplier type picks the preset; cakes need the allergen confirm', () => {
    const data = content('wedding-09');
    expect(data.defaultType).toBe('florist');
    expect(data.presets.florist.packages[1]).toMatchObject({
      popular: true,
      items: ['Two bouquets', 'Six buttonholes', 'Arch flowers'],
    });
    expect(data.presets.florist.gallery[0]).toEqual({
      kind: presets.florist.gallery[0].kind,
      label: 'Bridal bouquets',
    });
    expect(data.fairDates).toHaveLength(1);
    const state = completeTemplateBrief('wedding-09');
    state.answers.weddingType = 'Cake maker';
    expect(error(state, 'weddingAllergens')).toBe(templateBriefCopy.missing);
  });
  it('juice-bar-05: tones come from the template, and the allergen wording is confirmed', () => {
    const data = content('juice-bar-05');
    expect(data.menu.map((item: any) => [item.mark, item.tone, item.price])).toEqual([
      ['01', 'berry', '£5'],
      ['02', 'orange', '£4.50'],
      ['03', 'coffee', '£3.20'],
      ['04', 'green', '£6'],
    ]);
    expect(data.allergens).toContain('Ask us about allergens');
    expect(data.loyalty).toEqual({ offer: 'Every 8th coffee is on us.', note: null });
  });
});

describe('barber-01 validation rules', () => {
  it('needs 3 to 6 services with limited lengths and a £ price', () => {
    const state = completeTemplateBrief();
    state.rows.barberServices = state.rows.barberServices.slice(0, 2);
    expect(error(state, 'barberServices')).toBe('Add at least 3 entries.');
    state.rows.barberServices = Array.from({ length: 7 }, () => row(barberServices[0]));
    expect(error(state, 'barberServices')).toBe('Add no more than 6 entries.');
    state.rows.barberServices = [0, 1, 2].map(() => row({ ...barberServices[0], price: '30' }));
    expect(error(state, 'barberServices')).toBe('Enter a price like £30 or From £30.');
    state.rows.barberServices = [0, 1, 2].map(() => row({ ...barberServices[0], duration: '0' }));
    expect(error(state, 'barberServices')).toContain('Enter a length in minutes');
    state.rows.barberServices = [0, 1, 2].map(() =>
      row({ ...barberServices[0], name: 'x'.repeat(41) }),
    );
    expect(error(state, 'barberServices')).toBe(templateBriefCopy.tooLong(40));
  });
  it('validates hex colours, UK phones, postcodes and the first-name-and-initial rule', () => {
    const state = completeTemplateBrief();
    state.answers.brandColour = '1F3A5F';
    expect(error(state, 'brandColour')).toBe(templateBriefCopy.invalidColour);
    state.answers.contactPhone = 'call me';
    expect(error(state, 'contactPhone')).toBe(templateBriefCopy.invalidPhone);
    state.answers.postcode = 'DD2';
    expect(error(state, 'postcode')).toBe('Enter a UK postcode, like DD2 4DX.');
    state.rows.reviews = [row({ ...barberReview, name: 'Sam' })];
    expect(error(state, 'reviews')).toBe('Use a first name and initial, like Sam T.');
  });
  it('requires review permission whenever reviews are entered, and a booking link for online booking', () => {
    const state = completeTemplateBrief();
    state.answers.reviewPermission = false;
    expect(error(state, 'reviewPermission')).toBe(templateBriefCopy.missing);
    delete state.answers.bookingLink;
    expect(error(state, 'bookingLink')).toBe(templateBriefCopy.missing);
    state.answers.barberBooking = 'Walk-ins welcome';
    expect(error(state, 'bookingLink')).toBeUndefined();
  });
});

describe('template brief pre-fill', () => {
  it('selects a template from ?template and sanitises the demo values', () => {
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
    expect(Array.from(String(answers.businessName))).toHaveLength(100);
    expect(answers).toMatchObject({
      businessArea: 'Kirkcaldy',
      contactPhone: '07526 699 217',
      ref: 'L-TEST',
      presetRole: 'Bookkeeper',
      consultantRole: 'Bookkeeper',
      presetType: 'florist',
      weddingType: 'Florist',
    });
    expect(templatePrefill('?type=Cake%20Maker').weddingType).toBe('Cake maker');
    expect(templatePrefill('?type=videographer').weddingType).toBeUndefined();
  });
  it('falls back to the picker for unknown templates and drops unsafe values', () => {
    for (const id of ['nope', 'barber-01/', '__proto__', 'toString'])
      expect(templatePrefill(`?template=${id}`).templateChoice).toBeUndefined();
    const answers = templatePrefill('?phone=tel:0800&ref=%3Cscript%3E&name=%3Cb%3EBold%3C%2Fb%3E');
    expect(answers.contactPhone).toBeUndefined();
    expect(answers.ref).toBeUndefined();
    // Kept as text; the page renders it with textContent and value only.
    expect(answers.businessName).toBe('<b>Bold</b>');
    for (const t of allTemplates)
      expect(templatePrefill(`?template=${t.id}`).templateChoice).toBe(t.name);
  });
});
