import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { estimateQuestions, brandingEstimateCopy as c } from '../src/content/branding-estimate';
import { calculateEstimate, catalogItems, tax } from '../src/lib/branding-estimate/calculate';
import {
  answerLabels,
  validateCustomer,
  validateEstimate,
  visibleQuestions,
} from '../src/lib/branding-estimate/rules';
import type { EstimateAnswers } from '../src/lib/branding-estimate/types';
import { exampleEstimateAnswers, estimateCustomer } from './fixtures/branding-estimate';
import { seoPages, indexablePaths } from '../src/content/seo';
afterEach(() => vi.unstubAllGlobals());

it('uses the confirmed catalogue and VAT: example £1,058 + £211.60 = £1,269.60', () => {
  const e = calculateEstimate(exampleEstimateAnswers());
  expect(e.lines.map((line) => line.amountMinor)).toEqual([36900, 9900, 18000, 23000, 18000]);
  expect(e.subtotalMinor).toBe(105800);
  expect(e.vatMinor).toBe(21160);
  expect(e.totalMinor).toBe(126960);
  expect(e.reviewReasons).toEqual([]);
  expect(tax).toMatchObject({ mode: 'exclusive', ratePercent: 20 });
});
it('requires visible questions, ignoring hidden stale answers and supplied amounts', () => {
  const a = exampleEstimateAnswers();
  a['branding-deliverables'].selected = ['logo-design', 'logo-design'];
  a['branding-guidelines-level'].selected = ['invalid'];
  (a as unknown as Record<string, unknown>).totalMinor = 1;
  expect(visibleQuestions(a).map((q) => q.id)).toEqual(['branding-deliverables']);
  expect(calculateEstimate(a).subtotalMinor).toBe(36900);
  a['branding-deliverables'].selected = [];
  expect(() => calculateEstimate(a)).toThrow(c.errorRequired);
});
it('never introduces an automatic guidelines package or accepts forged options', () => {
  const a = exampleEstimateAnswers();
  a['branding-deliverables'].selected = ['business-stationery'];
  delete a['branding-guidelines-level'];
  expect(validateEstimate(a)?.id).toBe('branding-guidelines-level');
  a['branding-guidelines-level'] = { selected: ['existing-guidelines'], other: [] };
  expect(calculateEstimate(a).subtotalMinor).toBe(18000);
  a['branding-stationery-items'].selected.push('made-up-service');
  expect(() => calculateEstimate(a)).toThrow(c.errorSelection);
});
it('keeps unknown guidelines and unclassified Other unpriced, never zero-priced', () => {
  const a = exampleEstimateAnswers();
  a['branding-guidelines-level'].selected = ['not-sure'];
  a['branding-deliverables'].selected.push('other');
  a['branding-deliverables'].other = ['Bespoke environmental branding'];
  const e = calculateEstimate(a);
  expect(e.lines.filter((line) => line.amountMinor === null)).toHaveLength(2);
  expect(e.totalMinor).toBeNull();
  expect(e.subtotalMinor).toBe(95900);
  expect(e.knownTotalMinor).toBe(115080);
  expect(e.incomplete).toBe(true);
  expect(e.reviewReasons.length).toBeGreaterThan(1);
});
for (const [id, questionId] of [
  ['branding.stationery', 'branding-stationery-items'],
  ['branding.social-media', 'branding-social-media-items'],
  ['branding.marketing', 'branding-marketing-items'],
]) {
  describe(id, () => {
    it.each([1, 2, 3, 4, 5, 6])(
      'counts %i items independently, including each Other row once',
      (count) => {
        const a = exampleEstimateAnswers();
        a[questionId] = {
          selected: ['other'],
          other: Array.from({ length: count }, (_, i) => `Custom design ${i + 1}`),
        };
        const line = calculateEstimate(a).lines.find((line) => line.id === id)!;
        expect(line.quantity).toBe(count);
        expect(line.amountMinor).toBe(18000 + 5000 * Math.max(0, count - 3));
        expect(calculateEstimate(a).reviewReasons.length).toBeGreaterThan(0);
        a[questionId].selected = [
          estimateQuestions.find((q) => q.id === questionId)!.options[0].id,
        ];
        expect(calculateEstimate(a).lines.find((line) => line.id === id)!.quantity).toBe(1);
      },
    );
  });
}
it('rejects empty, duplicate, overlong and control-character custom rows', () => {
  const a = exampleEstimateAnswers();
  a['branding-stationery-items'].selected = ['business-cards', 'other'];
  for (const other of [
    [''],
    ['Custom', ' custom '],
    ['Business Cards'],
    ['x'.repeat(301)],
    ['hidden\nline'],
  ]) {
    a['branding-stationery-items'].other = other;
    expect(validateEstimate(a)?.id).toBe('branding-stationery-items');
  }
  a['branding-stationery-items'].other = ["Jay's <script> & design"];
  expect(validateEstimate(a)).toBeNull();
  expect(answerLabels(estimateQuestions[1], a)).toContain("Jay's <script> & design");
});
it('resolves all nonempty service combinations without duplicated guidelines or charges', () => {
  const options = estimateQuestions[0].options;
  for (let mask = 1; mask < 32; mask++) {
    const a = exampleEstimateAnswers();
    a['branding-deliverables'].selected = options
      .filter((_, i) => mask & (1 << i))
      .map((o) => o.id);
    const e = calculateEstimate(a);
    expect(new Set(e.lines.map((line) => line.id)).size).toBe(e.lines.length);
    expect(e.lines.filter((line) => line.id.startsWith('branding.guidelines')).length).toBe(
      mask === 1 ? 0 : 1,
    );
  }
});
it('validates name and email, allows optional business/phone, and checks supplied phone', () => {
  expect(validateCustomer(estimateCustomer)).toBeNull();
  expect(
    validateCustomer({ ...estimateCustomer, business: '', phone: '+44 7884 594929' }),
  ).toBeNull();
  for (const patch of [
    { name: '' },
    { email: 'invalid@' },
    { phone: 'hello' },
    { name: 'x'.repeat(151) },
  ])
    expect(validateCustomer({ ...estimateCustomer, ...patch })).toBe(c.errorCustomer);
});
it('keeps all question copy price-free and validates every catalogue reference', () => {
  expect(JSON.stringify(estimateQuestions)).not.toMatch(/£|18000|36900|5000/);
  for (const q of estimateQuestions)
    for (const option of q.options) expect(catalogItems[option.pricingItemId]).toBeDefined();
  expect(seoPages[c.route]).toMatchObject({ noindex: true, nofollow: true });
  expect(indexablePaths).not.toContain(c.route);
});
it('generates a branded multipage PDF with local assets, including long custom lists', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createEstimatePDF } = await import('../src/lib/branding-estimate/pdf');
  await mkdir('test-results/branding-estimate', { recursive: true });
  for (const [name, answers] of [
    ['example', exampleEstimateAnswers()],
    [
      'long',
      {
        ...exampleEstimateAnswers(),
        'branding-stationery-items': {
          selected: ['other'],
          other: Array.from(
            { length: 50 },
            (_, i) => `Custom item ${i + 1}: ${'Detailed design requirement '.repeat(8)}`,
          ),
        },
      },
    ],
  ] as [string, EstimateAnswers][]) {
    const blob = await createEstimatePDF({
      estimate: calculateEstimate(answers),
      customer: estimateCustomer,
      reference: 'FTT-BR-TEST-EXAMPLE',
      issued: '2026-10-29T12:00:00Z',
    });
    const bytes = Buffer.from(await blob.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.toString().match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(1);
    await writeFile(`test-results/branding-estimate/${name}.pdf`, bytes);
  }
});
