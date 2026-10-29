import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { brandingEstimateCopy as c, estimateQuestions } from '../../src/content/branding-estimate';
import { exampleEstimateAnswers } from '../fixtures/branding-estimate';
const route = c.route;
const host = (page: Page) => page.locator('[data-estimate-form]');
const next = (page: Page) => page.getByRole('button', { name: c.next, exact: true }).click();
async function begin(page: Page) {
  await page.goto(route);
  await page.getByRole('button', { name: c.begin }).click();
}
async function contact(page: Page) {
  await page.getByLabel(c.customer.name, { exact: true }).fill("Jay's <b>Studio</b> & Co");
  await page.getByLabel(c.customer.email, { exact: true }).fill('local-only-239@example.com');
  await page.getByLabel(c.consent).check();
}
async function example(page: Page) {
  const answers = exampleEstimateAnswers();
  for (const q of estimateQuestions) {
    await expect(host(page).locator('h2')).toHaveText(q.label);
    for (const id of answers[q.id].selected)
      await page.getByLabel(q.options.find((o) => o.id === id)!.label, { exact: true }).check();
    await expect(host(page)).not.toContainText(/£|1,058|180\.00/);
    await next(page);
  }
  await expect(host(page).locator('h2')).toHaveText(c.review);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});

test('complete catalogue journey hides prices until submission, downloads PDF and sends no answers', async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
  page.on('pageerror', (e) => errors.push(e.message));
  await begin(page);
  await example(page);
  await contact(page);
  await expect(host(page)).not.toContainText(/£|1,058|369\.00/);
  await expect(host(page).locator('b')).toHaveCount(0);
  await page.getByRole('button', { name: c.submit }).click();
  await expect(host(page).locator('h2')).toHaveText(c.thanks);
  await expect(host(page)).toContainText('£1,058.00');
  await expect(host(page)).toContainText('£211.60');
  await expect(host(page)).toContainText('£1,269.60');
  await expect(host(page)).toContainText('It has not been emailed');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: c.download }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^FTT-BR-[A-F0-9-]+\.pdf$/);
  expect((await readFile((await download.path())!)).subarray(0, 5).toString()).toBe('%PDF-');
  expect(requests.some((r) => r.startsWith('POST '))).toBe(false);
  expect(requests.join('\n')).not.toContain('local-only-239');
  const storage = await page.evaluate(() =>
    JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
  );
  expect(storage).not.toContain('local-only-239');
  expect(storage).not.toContain('Studio');
  expect(errors).toEqual([]);
  await page.getByRole('button', { name: c.revise }).click();
  await expect(page.getByLabel(c.customer.name, { exact: true })).toHaveValue(
    "Jay's <b>Studio</b> & Co",
  );
  await expect(host(page)).not.toContainText('£');
  await page.reload();
  await expect(page.getByRole('button', { name: c.begin })).toBeVisible();
});

test('conditional Other rows, validation, back/edit and deselection preserve only applicable answers', async ({
  page,
}) => {
  await begin(page);
  await next(page);
  await expect(page.getByRole('alert')).toHaveText(c.errorRequired);
  await page.getByLabel('Business Stationery', { exact: true }).check();
  await next(page);
  const q = estimateQuestions[1];
  await page.getByLabel(q.otherOption.label!, { exact: true }).check();
  await next(page);
  await expect(page.getByRole('alert')).toHaveText(c.errorOther);
  await page
    .getByLabel(`${q.otherOption.fieldLabel} 1`, { exact: true })
    .fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: q.otherOption.addButtonLabel! }).click();
  await page.getByLabel(`${q.otherOption.fieldLabel} 2`, { exact: true }).fill(' Custom card ');
  await next(page);
  await expect(host(page).locator('h2')).toHaveText(estimateQuestions[4].label);
  await page.getByLabel('I already have brand guidelines', { exact: true }).check();
  await next(page);
  await expect(host(page)).toContainText('<img src=x onerror=alert(1)>');
  await expect(host(page).locator('img')).toHaveCount(0);
  await page.getByRole('button', { name: `${c.edit}: ${q.label}`, exact: true }).click();
  await expect(page.getByLabel(`${q.otherOption.fieldLabel} 2`, { exact: true })).toHaveValue(
    ' Custom card ',
  );
  await page.getByRole('button', { name: `${c.remove} 2` }).click();
  await expect(page.locator('.estimate-custom-row')).toHaveCount(1);
  await page.getByLabel(q.otherOption.label!, { exact: true }).uncheck();
  await page.getByLabel(q.otherOption.label!, { exact: true }).check();
  await expect(page.getByLabel(`${q.otherOption.fieldLabel} 1`, { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: c.previous, exact: true }).click();
  await page.getByLabel('Business Stationery', { exact: true }).uncheck();
  await page.getByLabel('Logo Design', { exact: true }).check();
  await next(page);
  await expect(host(page).locator('h2')).toHaveText(c.review);
  await expect(host(page)).not.toContainText('<img');
  await contact(page);
  await page.getByRole('button', { name: c.submit }).click();
  await expect(host(page).locator('h2')).toHaveText(c.thanks);
  await expect(host(page)).toContainText('£442.80');
  await expect(host(page)).not.toContainText('Stationery');
});

test('manual review remains incomplete and PDF failure keeps answers available for retry', async ({
  page,
}) => {
  await begin(page);
  await page.getByLabel('Other', { exact: true }).check();
  await page
    .getByLabel('What else do you need? 1', { exact: true })
    .fill('Bespoke brand environment');
  await next(page);
  await contact(page);
  await page.route('**/mark-print.png', (r) => r.abort());
  await page.getByRole('button', { name: c.submit }).click();
  await expect(page.getByRole('alert')).toHaveText(c.errorGenerate);
  await expect(page.getByLabel(c.customer.email, { exact: true })).toHaveValue(
    'local-only-239@example.com',
  );
  await page.unroute('**/mark-print.png');
  await page.getByRole('button', { name: c.submit }).click();
  await expect(host(page).locator('h2')).toHaveText(c.thanks);
  await expect(host(page)).toContainText(c.incomplete);
  await expect(host(page)).toContainText(c.pending);
  await expect(host(page)).not.toContainText(c.total);
});

test('route is static, noindex and absent from sitemap, with a useful no-JS fallback', async ({
  page,
  request,
  browser,
}) => {
  const response = await request.get(route);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(c.privacy);
  await page.goto(route);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://fintaxtech.co.uk${route}`,
  );
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(route);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await context.newPage();
  await fallback.goto(new URL(route, page.url()).href);
  await expect(fallback.getByText(c.noScript, { exact: true })).toBeVisible();
  await expect(fallback.getByRole('link', { name: c.contactLink })).toHaveAttribute(
    'href',
    '/contact/',
  );
  await context.close();
});

for (const width of [320, 390, 768, 1440])
  for (const theme of ['light', 'dark']) {
    test(`keyboard, accessibility and layout at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem('ftt:theme', theme), theme);
      await begin(page);
      const check = page.getByLabel('Logo Design', { exact: true });
      await check.focus();
      await page.keyboard.press('Space');
      await expect(check).toBeChecked();
      await next(page);
      await expect(host(page).locator('h2')).toBeFocused();
      const scan = await new AxeBuilder({ page }).include('.branding-estimate').analyze();
      expect(scan.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (testInfo.project.name === 'chromium' && (width === 390 || width === 1440))
        await page.screenshot({
          path: `test-results/branding-estimate/review-${width}-${theme}.png`,
          fullPage: true,
        });
    });
  }
