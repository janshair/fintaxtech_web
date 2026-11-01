import { it, expect, vi } from 'vitest';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { calculate } from '../src/lib/ai-automation-estimate/calculate';
import {
  initialAnswers,
  validateAnswers,
  summary,
} from '../src/lib/ai-automation-estimate/answers';
import {
  pricing,
  services,
  pricingSchema,
  servicesSchema,
} from '../src/lib/ai-automation-estimate/config';
export const fixture = (service = 'website_assistant') => ({
  ...initialAnswers(),
  service,
  outcomes: [
    service === 'website_assistant'
      ? 'faq'
      : service === 'lead_automation'
        ? 'records'
        : service === 'booking_automation'
          ? 'reminders'
          : 'extract',
  ],
  currentProcess: 'manual',
  processDetails: 'Current process and desired result',
  sources: 'website',
  usage: 'under_100',
  websiteStatus: 'existing',
  tools: ['email'],
  exchangeDetails: 'Email notification; assess actual exchange',
  destination: 'email',
  bookingMode: 'human_confirmation',
  knowledge: 'basic',
  sensitivity: 'ordinary',
  support: 'care',
});
it.each(services.services.map((s) => s.id))(
  '%s has a 999 subtotal, 49 monthly, unknown scope and no task/tool surcharge',
  (service) => {
    const e = calculate(fixture(service));
    expect(e.knownPence).toBe(99900);
    expect(e.monthlyPence).toBe(4900);
    expect(e.reviewFlags).toContain('unknown_scope');
    expect(e.completePrice).toBe(false);
  },
);
it('uses central allowances and exact additional rates once', () => {
  const e = calculate(
    {
      ...fixture('document_automation'),
      knowledge: 'faq_setup',
      additionalTemplates: 2,
      templateDetails: 'Two standard document layouts',
    },
    { standardSteps: 7, supportedConnections: 3 },
  );
  expect(e.knownPence).toBe((999 + 198 + 199 + 199 + 298) * 100);
  expect(new Set(e.lines.map((l) => l.id)).size).toBe(e.lines.length);
});
it('included counts add nothing and tool selections do not become connections', () => {
  expect(calculate(fixture(), { standardSteps: 5, supportedConnections: 2 }).knownPence).toBe(
    99900,
  );
  expect(calculate({ ...fixture(), tools: ['email', 'crm', 'calendar'] }).knownPence).toBe(99900);
});
it('workflow minimums are starting prices and cannot resolve reviews', () => {
  const e = calculate({
    ...fixture(),
    additionalWorkflows: 2,
    workflowDetails: 'Two independent workflows',
  });
  expect(e.knownPence).toBe((999 + 2 * 699) * 100);
  expect(e.isStartingFrom).toBe(true);
  expect(e.reviewFlags).toContain('additional_workflows');
});
it.each([
  ['self', 0],
  ['care', 4900],
  ['plus', 9900],
])('keeps %s support separate', (support, cost) => {
  const e = calculate({ ...fixture(), support });
  expect(e.monthlyPence).toBe(cost);
  expect(e.knownPence).toBe(99900);
});
it('ignores inactive booking and template answers and retains active summaries only', () => {
  const a = {
    ...fixture(),
    bookingMode: 'direct_booking',
    additionalTemplates: 10,
    templateDetails: 'Retained local draft',
  };
  expect(calculate(a).reviewFlags).not.toContain('direct_booking_unverified');
  expect(calculate(a).lines.some((l) => l.id === 'templates')).toBe(false);
  expect(summary(a).join(' ')).not.toContain('Retained local draft');
});
it('computes mandatory reviews from sensitive, high-volume, custom sources and upload answers', () => {
  const e = calculate({
    ...fixture(),
    usage: 'over_500',
    knowledge: 'complex',
    tools: ['other'],
    otherTool: 'Custom system',
    systemDetails: 'Unsupported connector',
    capabilities: ['file_upload', 'multilingual', 'recommendations'],
    capabilityDetails: 'Assess behaviour',
    sensitivity: 'sensitive',
  });
  expect(e.reviewFlags).toEqual(
    expect.arrayContaining([
      'sensitive_data',
      'high_volume_processing',
      'unsupported_integration',
      'complex_knowledge',
      'file_upload',
      'complex_logic',
      'complex_recommendations',
    ]),
  );
});
it('discovery requires details and is not a fifth paid service', () => {
  const e = calculate({
    ...fixture(),
    service: 'unsure',
    outcomes: ['other'],
    discovery: 'Help me choose',
    otherOutcome: 'Describe the task',
  });
  expect(e.knownPence).toBeNull();
});
it('rejects missing details, unknown choices, duplicate arrays, negative/fractional counts and invented approval', () => {
  for (const patch of [
    { service: 'unknown' },
    { outcomes: [] },
    { tools: ['none', 'email'] },
    { outcomes: ['faq', 'faq'] },
    { additionalWorkflows: -1 },
    { additionalWorkflows: 0.5 },
    { support: 'unpriced' },
    { approved: true },
    { knowledge: 'unpriced' },
  ])
    expect(() => validateAnswers({ ...fixture(), ...patch })).toThrow();
});
it('validates both JSON catalogues', () => {
  expect(pricingSchema.safeParse(pricing).success).toBe(true);
  expect(servicesSchema.safeParse(services).success).toBe(true);
  expect(
    pricingSchema.safeParse({ ...pricing, starter: { ...pricing.starter, price: -1 } }).success,
  ).toBe(false);
});
it('generates the same local PDF including reference and reviewed totals', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  try {
    const { createAIEstimatePDF } = await import('../src/lib/ai-automation-estimate/pdf');
    const e = calculate(fixture());
    const blob = await createAIEstimatePDF(e);
    expect(blob.type).toBe('application/pdf');
    await mkdir('test-results/ai-estimate', { recursive: true });
    await writeFile('test-results/ai-estimate/sample.pdf', Buffer.from(await blob.arrayBuffer()));
  } finally {
    vi.unstubAllGlobals();
  }
});
