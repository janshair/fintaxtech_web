import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { mobileEstimateCopy as c, mobileServices as s } from '../../src/content/mobile-estimate';
const route = c.route;
const form = (page: Page) => page.locator('[data-estimate-form]');
const next = (page: Page) => page.getByRole('button', { name: c.next, exact: true }).click();
async function select(page: Page, id: string, value: string) {
  await page.locator(`input[name="${id}"][value="${value}"]`).check();
}
async function begin(page: Page) {
  await page.goto(route);
  await page.getByRole('button', { name: c.begin }).click();
}
async function toBusiness(page: Page) {
  await select(page, 'platform', 'both');
  await select(page, 'app_type', 'booking');
  await next(page);
  const choices = page.locator('input[name="features"]');
  expect(await choices.first().getAttribute('value')).toBe('booking');
  expect(
    await choices.evaluateAll(
      (nodes) => nodes.filter((n) => (n as HTMLInputElement).checked).length,
    ),
  ).toBe(0);
  for (const id of [
    'booking',
    'registration',
    'social_sign_in',
    'profiles',
    'payments',
    'push',
    'camera',
  ])
    await select(page, 'features', id);
  await expect(form(page)).not.toContainText('£');
  await next(page);
  await select(page, 'design', 'standard');
  await select(page, 'screens', '6_10');
  await next(page);
}
async function review(page: Page) {
  await toBusiness(page);
  await select(page, 'admin_dashboard', 'none');
  await expect(page.locator('input[name="existing_system"]')).toHaveCount(0);
  await next(page);
  await select(page, 'publishing', 'undecided');
  await select(page, 'maintenance', 'basic');
  await next(page);
  await expect(form(page).locator('h2')).toHaveText(c.review);
  await expect(form(page)).toContainText(s.final_review.hidden_status_label);
  await expect(form(page)).not.toContainText('£');
}
async function confirm(page: Page) {
  await page.getByLabel(c.name, { exact: true }).fill("Jay's <b>Studio</b> & Co");
  await page.getByLabel(c.email, { exact: true }).fill('private-mobile-871@example.com');
  await page.getByLabel(c.consent, { exact: true }).check();
  await page.getByRole('button', { name: 'Confirm & View Estimate' }).click();
  await expect(form(page).locator('h2')).toHaveText(c.resultTitle);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});
test('five-step regression, local-only data, price gate, pending scope, downloadable estimate and edits', async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
  page.on('pageerror', (e) => errors.push(e.message));
  await begin(page);
  await review(page);
  expect(requests.some((r) => r.includes('catalogue.json'))).toBe(false);
  await confirm(page);
  await expect(form(page).locator('[data-line="backend.standard"]')).toContainText('£2,999.00');
  await expect(form(page).locator('[data-line="migration.not_assessed"]')).toContainText(c.pending);
  await expect(form(page).locator('[data-line="publishing.undecided"]')).toContainText(c.pending);
  await expect(form(page).locator('.estimate-total').nth(0)).toHaveText('£17,546.00');
  await expect(form(page).locator('.estimate-total').nth(1)).toHaveText('£149.00/month');
  await expect(form(page)).toContainText('VAT has not been added');
  await expect(form(page)).toContainText('Needs review');
  await expect(page.getByRole('button', { name: /Approve|Issue fixed/i })).toHaveCount(0);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: c.download }).click(),
  ]);
  expect((await readFile((await download.path())!)).subarray(0, 5).toString()).toBe('%PDF-');
  expect(requests.join('\n')).not.toContain('private-mobile-871');
  expect(requests.some((r) => r.startsWith('POST '))).toBe(false);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain('Studio');
  expect(errors).toEqual([]);
  await page.getByRole('button', { name: 'Edit My Requirements' }).click();
  await expect(form(page)).not.toContainText('£');
  await select(page, 'platform', 'ios');
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  await expect(page.getByLabel(c.name, { exact: true })).toHaveValue("Jay's <b>Studio</b> & Co");
  await confirm(page);
  await expect(form(page).locator('.estimate-total').first()).toHaveText('£16,296.00');
  await page.reload();
  await expect(page.getByRole('button', { name: c.begin })).toBeVisible();
});
test('required controls, conditional stale clearing and fresh answers on reactivation', async ({
  page,
}) => {
  await begin(page);
  await next(page);
  await expect(page.getByRole('alert')).toContainText(c.errorRequired);
  await toBusiness(page);
  await select(page, 'admin_dashboard', 'basic');
  await select(page, 'existing_system', 'existing');
  await select(page, 'migration_required', 'yes');
  await select(page, 'migration_source', 'csv');
  await select(page, 'admin_dashboard', 'none');
  await expect(page.locator('input[name="migration_source"]')).toHaveCount(0);
  await select(page, 'admin_dashboard', 'basic');
  await expect(page.locator('input[name="existing_system"]:checked')).toHaveCount(0);
  await next(page);
  await expect(page.getByRole('alert')).toContainText(c.errorRequired);
  await select(page, 'existing_system', 'new_system');
  await select(page, 'migration_required', 'no');
  await next(page);
  await page.getByRole('button', { name: c.back, exact: true }).click();
  await expect(page.locator('input[name="migration_required"][value="no"]')).toBeChecked();
});
test('failed catalogue and PDF requests retain answers and can be retried', async ({ page }) => {
  await begin(page);
  await review(page);
  await page.getByLabel(c.name, { exact: true }).fill('Local Customer');
  await page.getByLabel(c.email, { exact: true }).fill('customer@example.com');
  await page.getByLabel(c.consent).check();
  await page.route('**/estimate/mobile/catalogue.json', (r) => r.abort());
  await page.getByRole('button', { name: 'Confirm & View Estimate' }).click();
  await expect(page.getByRole('alert')).toHaveText(c.errorGenerate);
  await page.unroute('**/estimate/mobile/catalogue.json');
  await confirm(page);
  await page.route('**/mark-print.png', (r) => r.abort());
  await page.getByRole('button', { name: c.download }).click();
  await expect(page.getByRole('alert')).toHaveText(c.downloadError);
  await expect(form(page)).toContainText('£17,546.00');
});
test('static canonical route, sitemap exclusion and no-JS fallback', async ({
  page,
  request,
  browser,
}) => {
  const response = await request.get(route);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(c.privacy);
  await page.goto(route);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://fintaxtech.co.uk${route}`,
  );
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(route);
  const catalogueResponse = await request.get(`${route}catalogue.json`);
  expect(catalogueResponse.status()).toBe(200);
  const catalogue = await catalogueResponse.json();
  expect(catalogue.catalogue['backend.standard'].amount_pence).toBe(299900);
  expect(catalogue).not.toHaveProperty('configuration_schema');
  expect(catalogue).not.toHaveProperty('regression_cases');
  expect(catalogue).not.toHaveProperty('quotation_workflow');
  expect(catalogue.catalogue).not.toHaveProperty('backend.existing');
  expect(catalogue.catalogue).not.toHaveProperty('qa.advanced');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await context.newPage();
  await fallback.goto(new URL(route, page.url()).href);
  await expect(fallback.getByText(c.noScript, { exact: true })).toBeVisible();
  await context.close();
});
for (const width of [320, 390, 768, 1440])
  for (const theme of ['light', 'dark'])
    test(`accessible full result at ${width}px ${theme}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => localStorage.setItem('ftt:theme', t), theme);
      await begin(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const radio = page.locator('input[name="platform"][value="both"]');
      await radio.focus();
      await page.keyboard.press('Space');
      await expect(radio).toBeChecked();
      expect(
        (await new AxeBuilder({ page }).include('.mobile-estimate').analyze()).violations,
      ).toEqual([]);
      await review(page);
      await confirm(page);
      await expect(form(page).locator('h2')).toBeFocused();
      expect(
        (await new AxeBuilder({ page }).include('.mobile-estimate').analyze()).violations,
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (info.project.name === 'chromium' && (width === 390 || width === 1440))
        await page.screenshot({
          path: `test-results/mobile-estimate/result-${width}-${theme}.png`,
          fullPage: true,
        });
    });
