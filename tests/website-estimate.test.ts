import { it, expect, vi } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pricing, pricingSchema } from '../src/lib/website-estimate/config';
import { calculate, type Answers } from '../src/lib/website-estimate/calculate';
for (const example of pricing.examples) {
  if (!('input' in example) || 'externalReviewFixture' in example || example.id === 'example_20')
    continue;
  it(example.name, () => {
    const input = structuredClone(example.input) as Answers;
    // Several supplied examples retain mutated inputs from later scenarios. Restore
    // the scenario described by its title, without modifying the source catalogue.
    if (['example_09', 'example_10', 'example_11'].includes(example.id))
      input.support.planId = 'shopify_care';
    if (example.id === 'example_17')
      input.featureDetails.booking_embed.bookingProviderIncludesPayment = true;
    if (example.id === 'example_22') input.content.stockImageCount = 10;
    if (example.id === 'example_24') input.migration.details.pageCount = 5;
    if (example.id === 'example_25') input.migration.details.pageCount = 6;
    if (example.id === 'example_27')
      input.visibility.services = ['seo_advanced', 'aeo_advanced', 'geo_advanced'];
    const e = calculate(input);
    expect(e.knownSubtotalMinor).toBe(example.expected.knownSubtotalMinor);
    expect(e.fullTotalMinor).toBe(example.expected.fullTotalMinor);
    expect(e.monthlySubtotalMinor).toBe(example.expected.monthlySubtotalMinor);
    expect(e.taxMinor).toBeNull();
    expect(e.milestonesMinor).toEqual(example.expected.milestonesMinor);
  });
}
it('validates price types', () => {
  const bad = structuredClone(pricing);
  bad.packages.business.amountMinor = -1;
  expect(pricingSchema.safeParse(bad).success).toBe(false);
});
it('creates a PDF from the same calculated values', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  try {
    const { createWebsitePDF } = await import('../src/lib/website-estimate/pdf');
    const blob = await createWebsitePDF(calculate(pricing.examples[0].input as Answers));
    await mkdir('test-results/website-estimate', { recursive: true });
    await writeFile(
      'test-results/website-estimate/sample.pdf',
      Buffer.from(await blob.arrayBuffer()),
    );
    expect(blob.size).toBeGreaterThan(1000);
  } finally {
    vi.unstubAllGlobals();
  }
});
it('holds extra product fees until the included allowance allocation is valid', () => {
  const input = structuredClone(pricing.examples[8].input) as Answers;
  input.support.planId = 'none';
  input.shopify.includedSimple = 0;
  input.shopify.includedVariable = 0;
  const e = calculate(input);
  expect(e.knownSubtotalMinor).toBe(pricing.packages.shopify.amountMinor);
  expect(e.fullTotalMinor).toBeNull();
});
it('ignores inactive Shopify and visibility choices when pricing a business website', () => {
  const input = structuredClone(pricing.examples[0].input) as Answers;
  input.shopify = { extraSimple: 999 };
  input.visibility.services = ['seo_advanced'];
  expect(calculate(input).knownSubtotalMinor).toBe(pricing.packages.business.amountMinor);
});
it('rejects customer-supplied staff assessments', () => {
  const input = structuredClone(pricing.examples[0].input) as Answers;
  input.trustedAssessment = { approved: true };
  expect(calculate(input).status).toBe('invalid_input');
});
