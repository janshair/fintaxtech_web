import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const next = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true }).click();
const back = (page: Page) => page.getByRole('button', { name: 'Back', exact: true }).click();
async function begin(page: Page, id: string) {
  await page.goto('/estimate/website/');
  await page.getByRole('button', { name: 'Prepare my website estimate' }).click();
  await page.locator(`input[name=packageId][value=${id}]`).check();
  await next(page);
}
async function info(page: Page) {
  await page
    .getByRole('radio', { name: 'Yes — I will supply my existing logo', exact: true })
    .check();
  for (const [label, value] of [
    ['Business name', 'Example Studio'],
    ['Business tagline', 'A clear first impression'],
    ['Business email address', 'hello@example.com'],
    ['Business WhatsApp number', '+44 1382 000000'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
}
for (const [id, price] of [
  ['placeholder', '£399.00'],
  ['landing', '£699.00'],
])
  for (const width of [320, 390, 1440])
    for (const theme of ['light', 'dark'])
      test(`${id} ${width}px ${theme}: fixed scope and downloadable estimate`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((t) => {
          localStorage.setItem('ftt:consent', 'rejected');
          localStorage.setItem('ftt:theme', t);
        }, theme);
        await begin(page, id);
        await expect(page.getByRole('button', { name: 'Add page', exact: true })).toHaveCount(0);
        await info(page);
        await next(page);
        if (id === 'placeholder')
          await page
            .getByLabel('Business title to display', { exact: true })
            .fill('Example Studio');
        else
          for (const label of [
            'Main headline',
            'Supporting text',
            'Brief business introduction',
            'Services or key benefits',
            'What should the main contact call-to-action say?',
            'Contact details to display',
          ])
            await page
              .getByLabel(label, { exact: true })
              .fill('Approved customer-supplied content');
        await next(page);
        await expect(page.locator('input[name=features]')).toHaveCount(0);
        await expect(page.locator('input[name="visibility.mode"]')).toHaveCount(0);
        await next(page);
        await expect(page.locator('input[name="support.planId"]')).toHaveCount(0);
        await next(page);
        await expect(page.locator('[data-result] .estimate-total').first()).toHaveText(price);
        await expect(page.locator('[data-result] .estimate-total').last()).toHaveText(
          '£0.00/month',
        );
        await expect(page.locator('[data-result]')).not.toContainText('Essential SEO, AEO and GEO');
        await expect(page.locator('[data-result]')).toContainText(
          'SEO, AEO or GEO optimisation services',
        );
        expect(
          (await new AxeBuilder({ page }).include('.website-estimate').analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (width === 390) {
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Download PDF Estimate' }).click(),
          ]);
          expect(await download.failure()).toBeNull();
        }
        await page
          .locator('.website-estimate')
          .screenshot({ path: `test-results/entry-packages/${id}-${width}-${theme}.png` });
      });
test('switching preserves separate briefs and existing page choices', async ({ page }) => {
  await begin(page, 'business');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await back(page);
  await page.locator('input[value=placeholder]').check();
  await next(page);
  await info(page);
  await back(page);
  await page.locator('input[value=landing]').check();
  await next(page);
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue('');
  await back(page);
  await page.locator('input[value=placeholder]').check();
  await next(page);
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue('Example Studio');
  await back(page);
  await page.locator('input[value=business]').check();
  await next(page);
  await expect(page.getByLabel('Page name', { exact: true })).toHaveValue('Home');
});
