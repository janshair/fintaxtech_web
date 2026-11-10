import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { exampleEstimateAnswers } from '../fixtures/branding-estimate';
import { estimateQuestions, brandingEstimateCopy as b } from '../../src/content/branding-estimate';
const next = (p: Page) => p.getByRole('button', { name: 'Continue', exact: true }).click();
const check = (p: Page, name: string, value: string) =>
  p.locator(`input[name="${name}"][value="${value}"]`).check();
async function finish(page: Page, kind: string) {
  await page.locator('[data-estimate-begin]').click();
  if (kind === 'branding') {
    const a = exampleEstimateAnswers();
    for (const q of estimateQuestions) {
      for (const id of a[q.id].selected)
        await page.getByLabel(q.options.find((o) => o.id === id)!.label, { exact: true }).check();
      await next(page);
    }
    await page.getByLabel(b.customer.name, { exact: true }).fill('Example Customer');
    await page.getByLabel(b.customer.email, { exact: true }).fill('example@example.com');
    await page.getByLabel(b.consent).check();
    await page.getByRole('button', { name: b.submit, exact: true }).click();
  }
  if (kind === 'mobile') {
    await check(page, 'platform', 'both');
    await check(page, 'app_type', 'booking');
    await next(page);
    for (const id of [
      'booking',
      'registration',
      'social_sign_in',
      'profiles',
      'payments',
      'push',
      'camera',
    ])
      await check(page, 'features', id);
    await next(page);
    await check(page, 'design', 'standard');
    await check(page, 'screens', '6_10');
    await next(page);
    await check(page, 'admin_dashboard', 'none');
    await next(page);
    await check(page, 'publishing', 'undecided');
    await check(page, 'maintenance', 'basic');
    await next(page);
    await page.getByLabel('Full name', { exact: true }).fill('Example Customer');
    await page.getByLabel('Email address', { exact: true }).fill('example@example.com');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Confirm & View Estimate', exact: true }).click();
  }
  if (kind === 'website') {
    await check(page, 'packageId', 'business');
    await next(page);
    for (const name of ['Home', 'About', 'Services', 'Contact', 'Gallery'])
      await page.getByRole('button', { name, exact: true }).click();
    for (let i = 0; i < 4; i++) await next(page);
  }
  if (kind === 'ai-automation') {
    await check(page, 'service', 'website_assistant');
    await next(page);
    await check(page, 'outcomes', 'faq');
    await check(page, 'currentProcess', 'manual');
    await page
      .getByLabel('Describe the current process, inputs and the result you need', { exact: true })
      .fill('Explain approved FAQs');
    await check(page, 'sources', 'website');
    await check(page, 'usage', 'under_100');
    await next(page);
    await check(page, 'websiteStatus', 'none');
    await check(page, 'tools', 'none');
    await page
      .getByLabel('Which tools should exchange information, and what should move between them?', {
        exact: true,
      })
      .fill('To be assessed');
    await next(page);
    await check(page, 'knowledge', 'basic');
    await check(page, 'sensitivity', 'ordinary');
    await next(page);
    await check(page, 'support', 'care');
    await next(page);
  }
}
const totals: Record<string, string[]> = {
  branding: ['1,269.60', '1,713.96', '171,396.00'],
  mobile: ['17,546.00', '23,687.10', '2,368,710.00'],
  website: ['999.00', '1,348.65', '134,865.00'],
  'ai-automation': ['999.00', '1,348.65', '134,865.00'],
};
for (const kind of Object.keys(totals))
  for (const [i, code] of ['GBP', 'USD', 'PKR'].entries())
    test(`${kind} ${code} route: static journey, no selector/rate text, matching PDF`, async ({
      page,
      request,
    }) => {
      const base = `/estimate/${kind}/`;
      const route = code === 'GBP' ? base : `${base}${code.toLowerCase()}/`;
      await page.setViewportSize({
        width: code === 'PKR' ? 320 : code === 'USD' ? 390 : 1440,
        height: 900,
      });
      await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
      expect((await request.get(route)).status()).toBe(200);
      await page.goto(route);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await finish(page, kind);
      const host = page.locator('[data-estimate-form]');
      await expect(host).toContainText(totals[kind][i]);
      if (code !== 'GBP') await expect(host).toContainText(code);
      await expect(host.getByRole('combobox')).toHaveCount(0);
      await expect(host).not.toContainText('Fixed conversion');
      await expect(host).not.toContainText('exchange rate');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).include('[data-estimate-form]').analyze()).violations,
      ).toEqual([]);
      const label =
        kind === 'branding'
          ? b.download
          : kind === 'mobile'
            ? 'Download indicative estimate'
            : 'Download PDF Estimate';
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: label, exact: true }).click(),
      ]);
      expect(await download.failure()).toBeNull();
      await mkdir('test-results/route-currency', { recursive: true });
      await download.saveAs(`test-results/route-currency/${kind}-${code}.pdf`);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        `https://fintaxtech.co.uk${route}`,
      );
      await expect(page.locator('meta[name=robots]')).toHaveAttribute(
        'content',
        'noindex,nofollow',
      );
      if (code !== 'GBP') {
        expect(await (await request.get('/sitemap.xml')).text()).not.toContain(route);
        const home = await (await request.get('/')).text();
        expect(home).not.toContain(route);
      }
      await page.reload();
      await expect(page.locator('[data-estimate-begin]')).toBeVisible();
      expect(errors).toEqual([]);
    });
test('unsupported currency is not generated', async ({ request }) => {
  expect((await request.get('/estimate/mobile/eur/')).status()).toBe(404);
});
