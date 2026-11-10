import { it, expect, vi } from 'vitest';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import {
  convertMinor,
  formatMoney,
  convertedParts,
  currencyFromPath,
} from '../src/lib/estimate-currency';
import { calculate, initialAnswers } from '../src/lib/website-estimate/calculate';
import { estimateText } from '../src/lib/website-estimate/presentation';
import { calculateMobileEstimate } from '../src/lib/mobile-estimate/calculate';
import { publicCalculationConfig, mobilePricing } from '../src/lib/mobile-estimate/config';
import { lineAmount, monthlyAmount } from '../src/lib/mobile-estimate/presentation';
it('uses the approved fixed rates in exact minor units', () => {
  expect(convertMinor(10000)).toBe(10000);
  expect(convertMinor(10000, 'USD')).toBe(13500);
  expect(convertMinor(10000, 'PKR')).toBe(1350000);
  expect(formatMoney(10000, 'USD')).toContain('135.00');
  expect(formatMoney(10000, 'PKR')).toContain('13,500.00');
  expect(convertMinor(1, 'USD')).toBe(1);
  expect(convertMinor(10, 'USD')).toBe(14);
  expect(() => convertMinor(-1, 'GBP')).toThrow();
  expect(() => convertMinor(100, 'EUR' as any)).toThrow();
});
it('balances rounded payment milestones to the converted total', () => {
  expect(convertedParts([19950, 11970, 7980], 'USD')).toEqual([26933, 16160, 10772]);
});
it('converts website line prices, totals and milestones without changing base amounts', () => {
  const e = calculate({
    ...initialAnswers(),
    packageId: 'placeholder',
    packageBriefs: { placeholder: {} },
  });
  const original = JSON.stringify(e);
  const text = estimateText(e, 'USD').join(' ');
  expect(text).toContain('538.65');
  expect(estimateText(e, 'PKR').join(' ')).toContain('53,865.00');
  expect(JSON.stringify(e)).toBe(original);
});
it('converts mobile recurring prices while retaining unpriced states', () => {
  const e = calculateMobileEstimate(
    mobilePricing.regression_cases[0].answers,
    publicCalculationConfig(),
  );
  expect(monthlyAmount(e, 'USD')).toContain('201.15');
  expect(
    lineAmount(
      e.lines.find((l) => l.amount_pence === null)!,
      'PKR',
    ),
  ).not.toContain('0.00');
});
it('creates converted website PDFs from the same estimate', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  try {
    const { createWebsitePDF } = await import('../src/lib/website-estimate/pdf');
    const e = calculate({
      ...initialAnswers(),
      packageId: 'placeholder',
      packageBriefs: { placeholder: {} },
    });
    await mkdir('test-results/currency', { recursive: true });
    for (const currency of ['USD', 'PKR'] as const) {
      const blob = await createWebsitePDF(e, currency);
      await writeFile(
        `test-results/currency/website-${currency}.pdf`,
        Buffer.from(await blob.arrayBuffer()),
      );
      expect(blob.size).toBeGreaterThan(1000);
    }
  } finally {
    vi.unstubAllGlobals();
  }
});

it('uses only explicit supported currency route suffixes', () => {
  for (const kind of ['branding', 'mobile', 'website', 'ai-automation']) {
    expect(currencyFromPath(`/estimate/${kind}/`)).toBe('GBP');
    expect(currencyFromPath(`/estimate/${kind}/usd/`)).toBe('USD');
    expect(currencyFromPath(`/estimate/${kind}/pkr`)).toBe('PKR');
  }
  expect(currencyFromPath('/estimate/mobile/eur/')).toBe('GBP');
  expect(currencyFromPath('/other/usd/')).toBe('GBP');
});
