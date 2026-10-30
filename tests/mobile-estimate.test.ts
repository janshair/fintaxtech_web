import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import rawServices from '../src/content/mobile-estimate/services.json';
import rawPricing from '../src/content/mobile-estimate/pricing.json';
import { mobilePricing, publicCalculationConfig } from '../src/lib/mobile-estimate/config';
import { calculateMobileEstimate } from '../src/lib/mobile-estimate/calculate';
import { mobileServices } from '../src/content/mobile-estimate';
import {
  servicesSchema,
  pricingSchema,
  predicateSchema,
  vatSchema,
} from '../src/lib/mobile-estimate/schema';
import { normalize, validateAnswers, type Answers } from '../src/lib/mobile-estimate/answers';
import {
  requestFixedPriceTransition,
  approvalCapabilities,
} from '../src/lib/mobile-estimate/workflow';
import { validatePricing } from '../src/lib/mobile-estimate/review';
import { calculateTax } from '../src/lib/mobile-estimate/tax';
import { monthlyAmount } from '../src/lib/mobile-estimate/presentation';
import { evaluate } from '../src/lib/mobile-estimate/predicates';
const fixture = rawPricing.regression_cases[0];
const config = publicCalculationConfig();
const regression = () => structuredClone(fixture.answers) as Answers;
const calculate = (patch: Partial<Answers> = {}) =>
  calculateMobileEstimate(normalize({ ...regression(), ...patch } as Answers), config);
afterEach(() => vi.unstubAllGlobals());
it('validates both supplied JSON files and all price references, without changing any amounts', () => {
  expect(servicesSchema.safeParse(rawServices).success).toBe(true);
  expect(pricingSchema.safeParse(rawPricing).success).toBe(true);
  expect(mobilePricing.catalogue).toEqual(rawPricing.catalogue);
  const bad = structuredClone(rawPricing);
  bad.catalogue['architecture.ios'].amount_pence = -1;
  expect(pricingSchema.safeParse(bad).success).toBe(false);
  const badPending = structuredClone(rawPricing);
  (badPending.catalogue['migration.unknown'] as { amount_pence: unknown }).amount_pence = 0;
  expect(pricingSchema.safeParse(badPending).success).toBe(false);
  const badServices = structuredClone(rawServices);
  (badServices.steps[0].questions[0] as { required: unknown }).required = 'true';
  expect(servicesSchema.safeParse(badServices).success).toBe(false);
  const unknown = structuredClone(rawPricing);
  unknown.calculation.components[0].choices![0].item_id = 'unknown';
  expect(pricingSchema.safeParse(unknown).success).toBe(false);
});
it('matches every required regression result and finding: 17546 one-time, 149 monthly, no VAT', () => {
  const e = calculate();
  const expected = fixture.expected;
  expect(e.backend_tier).toBe(expected.backend_tier);
  expect(e.one_time_subtotal_pence).toBe(expected.one_time_subtotal_pence);
  expect(e.monthly_subtotal_pence).toBe(expected.monthly_subtotal_pence);
  expect(e.pending_item_ids.sort()).toEqual([...expected.pending_item_ids].sort());
  expect(e.state).toBe('needs_review');
  expect(e.tax.status).toBe(expected.vat_status);
  expect(e.tax.one_time_vat_pence).toBeNull();
  expect(e.tax.monthly_vat_pence).toBeNull();
  for (const [component, total] of Object.entries(expected.one_time_component_totals_pence))
    expect(
      e.lines
        .filter((line) => line.component === component)
        .reduce((sum, line) => sum + (line.amount_pence ?? 0), 0),
    ).toBe(total);
  for (const rule of expected.must_include_findings)
    expect(e.findings.map((f) => f.rule_id)).toContain(rule);
  expect(e.lines.filter((line) => line.component === 'features')).toHaveLength(7);
});
it.each([
  ['ios', 274900],
  ['android', 274900],
  ['both', 399900],
])('prices %s architecture once', (platform, amount) => {
  const e = calculate({ platform: String(platform) });
  expect(e.lines.find((line) => line.component === 'architecture')?.amount_pence).toBe(amount);
});
it.each([
  ['1_5', 0, 49900],
  ['6_10', 125000, 99900],
  ['11_20', 375000, 199900],
])(
  'prices screen band %s without cumulative bands or per-platform design fees',
  (screens, screenPrice, designPrice) => {
    const e = calculate({ screens: String(screens) });
    expect(e.lines.find((l) => l.component === 'screens')?.amount_pence).toBe(screenPrice);
    expect(e.lines.find((l) => l.component === 'design')?.amount_pence).toBe(designPrice);
  },
);
it('custom replaces standard; supplied designs remain provisional; unsupported scope remains pending', () => {
  const custom = calculate({ design: 'custom' });
  expect(custom.lines.filter((l) => l.component === 'design').map((l) => l.amount_pence)).toEqual([
    149900,
  ]);
  const supplied = calculate({ design: 'supplied' });
  expect(supplied.lines.find((l) => l.component === 'design')).toMatchObject({
    amount_pence: 0,
    price_mode: 'provisional',
  });
  for (const patch of [
    { screens: 'over_20' },
    { design: 'custom', screens: '11_20' },
    { design: 'advanced' },
    { design: 'undecided' },
    { screens: 'undecided' },
  ])
    expect(calculate(patch).pending_item_ids.length).toBeGreaterThan(2);
});
it('rejects duplicate/unknown features, forged prices, review context and non-standard QA', () => {
  const a = regression();
  a.features = ['booking', 'booking'];
  expect(() => calculateMobileEstimate(a, config)).toThrow();
  for (const patch of [
    { features: ['bad'] },
    { qa: 'advanced' },
    { total: 0 },
    { review_context: { backend_override_authorized: true } },
  ])
    expect(() => calculateMobileEstimate({ ...regression(), ...patch }, config)).toThrow();
  expect(calculate({ features: ['social_sign_in'] }).findings.map((f) => f.rule_id)).toContain(
    'social_auth_dependency',
  );
});
it('clears stale conditional answers to not_assessed and requires fresh visible answers', () => {
  const a = regression();
  Object.assign(a, {
    admin_dashboard: 'none',
    existing_system: 'existing',
    migration_required: 'yes',
    migration_source: 'csv',
  });
  expect(() => validateAnswers(a)).toThrow();
  const cleared = normalize(a);
  expect(cleared.existing_system).toBe('not_assessed');
  expect(cleared.migration_required).toBe('not_assessed');
  expect(cleared.migration_source).toBe('not_assessed');
  expect(() => validateAnswers({ ...cleared, admin_dashboard: 'basic' })).toThrow();
  const explicit = calculate({
    admin_dashboard: 'basic',
    existing_system: 'new_system',
    migration_required: 'no',
  });
  expect(explicit.lines.find((l) => l.component === 'migration')).toMatchObject({
    id: 'migration.none',
    amount_pence: 0,
  });
  expect(calculate().lines.find((l) => l.component === 'migration')).toMatchObject({
    id: 'migration.not_assessed',
    amount_pence: null,
  });
});
it.each([
  ['csv', 49900],
  ['database', 149900],
  ['app', 249900],
  ['unknown', null],
])('prices migration source %s only when assessed', (source, amount) => {
  expect(
    calculate({
      admin_dashboard: 'basic',
      existing_system: 'new_system',
      migration_required: 'yes',
      migration_source: String(source),
    }).lines.find((l) => l.component === 'migration')?.amount_pence,
  ).toBe(amount);
});
it('recommends provisional backend tiers, never assuming an existing website is reusable', () => {
  expect(calculate({ features: ['registration'] }).backend_tier).toBe('basic');
  expect(calculate().backend_tier).toBe('standard');
  expect(calculate({ features: ['messaging'] }).backend_tier).toBe('advanced');
  expect(calculate({ features: [], app_type: 'productivity' }).backend_tier).toBe('none');
  expect(
    calculate({ admin_dashboard: 'basic', existing_system: 'existing', migration_required: 'no' })
      .backend_tier,
  ).toBe('unknown');
});
it.each([
  ['self', 0],
  ['apple', 24900],
  ['google', 24900],
  ['both', 39900],
  ['undecided', null],
])('handles publishing %s without inventing fees', (publishing, amount) => {
  expect(
    calculate({ publishing: String(publishing) }).lines.find((l) => l.component === 'publishing')
      ?.amount_pence,
  ).toBe(amount);
});
it.each([
  ['none', 'ios', 0],
  ['basic', 'both', 14900],
  ['premium', 'ios', 69900],
  ['premium', 'android', 69900],
  ['premium', 'both', 99900],
  ['premium', 'undecided', null],
  ['undecided', 'both', null],
])('keeps %s maintenance for %s separate', (maintenance, platform, amount) => {
  const e = calculate({ maintenance: String(maintenance), platform: String(platform) });
  expect(e.lines.find((l) => l.charge_type === 'monthly')?.amount_pence).toBe(amount);
  expect(e.monthly_subtotal_pence).toBe(amount ?? 0);
});
it('supports configurable verified tax while defaulting to unverified, not zero-rated', () => {
  const vat = structuredClone(config.vat);
  expect(calculateTax(vat, 1754600, 14900).one_time_vat_pence).toBeNull();
  Object.assign(vat, {
    registration_status: 'registered',
    registration_verified: true,
    registration_number: 'TEST',
    registration_verified_at: '2026-10-29',
    registration_verification_reference: 'verified-by-company',
    transaction_treatment: 'taxable',
    rate_basis_points: 2000,
    rate_verified_at: '2026-10-29',
    default_auto_add: true,
  });
  expect(calculateTax(vatSchema.parse(vat), 1754600, 14900)).toMatchObject({
    one_time_vat_pence: 350920,
    monthly_vat_pence: 2980,
  });
  expect(
    calculateTax(
      vatSchema.parse({ ...vat, registration_status: 'not_registered', registration_number: null }),
      1754600,
      14900,
    ),
  ).toMatchObject({ status: 'not_registered', one_time_vat_pence: 0 });
  expect(
    calculateTax(vatSchema.parse({ ...vat, registration_verified: false }), 1754600, 14900)
      .one_time_vat_pence,
  ).toBeNull();
  expect(
    calculateTax(vatSchema.parse({ ...vat, rate_verified_at: null }), 1754600, 14900)
      .one_time_vat_pence,
  ).toBeNull();
});
it('marks AI as a lower bound and preserves valid charges despite overlap warnings', () => {
  const e = calculate({ features: ['ai', 'offline'] });
  expect(e.is_lower_bound).toBe(true);
  expect(e.lines.find((l) => l.id === 'feature.ai')?.amount_pence).toBe(350000);
  expect(e.findings.map((f) => f.rule_id)).toEqual(
    expect.arrayContaining(['ai_manual_review', 'offline_synchronisation']),
  );
  expect(calculate().manual_adjustments).toEqual([]);
});
it('reconciles itemised sums and recalculates without stale approvals', () => {
  const a = calculate();
  const b = calculate({ platform: 'ios', features: [] });
  expect(b.one_time_subtotal_pence).not.toBe(a.one_time_subtotal_pence);
  for (const e of [a, b])
    for (const type of ['one_time', 'monthly'] as const)
      expect(
        e.lines
          .filter((l) => l.charge_type === type)
          .reduce((sum, l) => sum + (l.amount_pence ?? 0), 0),
      ).toBe(e[`${type}_subtotal_pence`]);
  expect(a.approval).toBeNull();
  expect(b.approval).toBeNull();
  const changed = structuredClone(config);
  changed.version = '1.0.1';
  changed.catalogue['architecture.both'].amount_pence! += 100;
  expect(calculateMobileEstimate(regression(), changed).one_time_subtotal_pence).toBe(
    a.one_time_subtotal_pence + 100,
  );
  expect(calculateMobileEstimate(regression(), changed).versions.pricing).toBe('1.0.1');
});
it('denies approval/issuance and fabricated authority and keeps structured review findings', () => {
  const e = calculate();
  for (const state of ['approved', 'issued'] as const)
    expect(() =>
      requestFixedPriceTransition(e, state, { role: 'admin', authenticated: true }),
    ).toThrow();
  expect(Object.values(approvalCapabilities).every((v) => v === false)).toBe(true);
  for (const f of e.findings)
    expect(f).toMatchObject({
      resolution_status: 'unresolved',
      recommended_review_action: expect.any(String),
      affected_line_item_ids: expect.any(Array),
    });
  const bad = validatePricing(
    config,
    {
      answers: e.answers,
      derived: { backend_tier: 'standard' },
      review_context: {},
      calculation: { feature_ids: ['x', 'x'], arithmetic_reconciled: false },
    },
    e.lines,
  );
  expect(bad.map((f) => f.rule_id)).toEqual(
    expect.arrayContaining(['arithmetic_reconciliation', 'duplicate_feature_charges']),
  );
});
it('rejects executable predicates and prototype paths; uses strict equality', () => {
  expect(predicateSchema.safeParse({ op: 'eval', value: 'anything' }).success).toBe(false);
  expect(
    predicateSchema.safeParse({ op: 'eq', field: 'answers.__proto__', value: true }).success,
  ).toBe(false);
  expect(evaluate({ op: 'eq', field: 'answers.test', value: true }, { answers: { test: 1 } })).toBe(
    false,
  );
});
it('does not publish full source metadata, contracts, audit references or reviewer override controls', () => {
  const data = JSON.stringify(config);
  expect(data).not.toContain('confidential_internal');
  expect(data).not.toContain('regression_cases');
  expect(data).not.toContain('backend_override_authorized');
  expect(data).not.toContain('configuration_schema');
  expect(mobileServices.steps).toHaveLength(5);
});
it('keeps undecided maintenance visibly pending rather than displaying zero per month', () => {
  expect(monthlyAmount(calculate({ maintenance: 'undecided' }))).toBe('Pending — excluded');
  expect(monthlyAmount(calculate({ maintenance: 'none' }))).toBe('£0.00/month');
});
it('creates a readable local indicative PDF using the existing branded assets', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createMobileEstimatePDF } = await import('../src/lib/mobile-estimate/pdf');
  const blob = await createMobileEstimatePDF(
    calculate(),
    { name: 'Alex Example', business: 'Example Booking', email: 'alex@example.com', phone: '' },
    'FTT-MA-TEST',
    '2026-10-29T12:00:00Z',
  );
  const bytes = Buffer.from(await blob.arrayBuffer());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  await mkdir('test-results/mobile-estimate', { recursive: true });
  await writeFile('test-results/mobile-estimate/regression.pdf', bytes);
});
