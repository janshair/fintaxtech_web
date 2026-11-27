import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  estimateKinds,
  estimateCurrencyPaths,
  proposalServices,
} from '../../src/content/estimate-currency';

for (const kind of estimateKinds) {
  test(`legacy ${kind} estimate links continue to a price-free enquiry`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
    const { service, title } = proposalServices[kind];
    const base = `/estimate/${kind}/`;
    for (const suffix of ['', ...estimateCurrencyPaths.map((currency) => `${currency}/`)]) {
      const route = base + suffix;
      expect((await page.goto(route))?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://fintaxtech.co.uk' + route,
      );
      await expect(page.locator('meta[name=robots]')).toHaveAttribute(
        'content',
        'noindex,nofollow',
      );
      await expect(page.locator('main')).not.toContainText(/[£€$]\s*\d/);
      await expect(page.getByRole('link', { name: 'Start your enquiry' })).toHaveAttribute(
        'href',
        `/enquiry/?service=${service}`,
      );
    }
    await page.getByRole('link', { name: 'Start your enquiry' }).click();
    await expect(page).toHaveURL(`/enquiry/?service=${service}`);
  });
}

test('proposal entry works at mobile width in both themes', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/estimate/website/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  }
  for (const path of ['/estimate/mobile/catalogue.json', '/estimate/mobile/eur/'])
    expect((await request.get(path)).status()).toBe(404);
});
