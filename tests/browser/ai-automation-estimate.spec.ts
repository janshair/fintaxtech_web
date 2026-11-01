import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route = '/estimate/ai-automation/';
const next = (p: Page) => p.getByRole('button', { name: 'Continue', exact: true }).click();
const choose = (p: Page, name: string, value: string) =>
  p.locator(`input[name="${name}"][value="${value}"]`).check();
async function journey(p: Page, service = 'website_assistant') {
  await p.goto(route);
  await p.getByRole('button', { name: 'Prepare my automation estimate' }).click();
  await choose(p, 'service', service);
  await next(p);
  const outcome =
    service === 'website_assistant'
      ? 'faq'
      : service === 'lead_automation'
        ? 'records'
        : service === 'booking_automation'
          ? 'reminders'
          : 'extract';
  await choose(p, 'outcomes', outcome);
  await choose(p, 'currentProcess', 'manual');
  await p
    .getByLabel('Describe the current process, inputs and the result you need', { exact: true })
    .fill('Local draft unique-472. No customer records.');
  await choose(p, 'sources', 'website');
  await choose(p, 'usage', 'under_100');
  await next(p);
  await choose(p, 'websiteStatus', 'existing');
  await choose(p, 'tools', 'email');
  await choose(p, 'tools', 'none');
  await expect(p.locator('input[name=tools][value=email]')).not.toBeChecked();
  await choose(p, 'tools', 'email');
  await expect(p.locator('input[name=tools][value=none]')).not.toBeChecked();
  await p
    .getByLabel('Which tools should exchange information, and what should move between them?', {
      exact: true,
    })
    .fill('Assess email notification; not a confirmed connection count.');
  if (service === 'booking_automation') await choose(p, 'bookingMode', 'human_confirmation');
  if (service === 'lead_automation') await choose(p, 'destination', 'email');
  await next(p);
  await choose(p, 'knowledge', 'basic');
  await choose(p, 'sensitivity', 'ordinary');
  await next(p);
  await choose(p, 'support', 'care');
  await next(p);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});
for (const service of [
  'website_assistant',
  'lead_automation',
  'booking_automation',
  'document_automation',
])
  test(`${service}: complete local journey and PDF`, async ({ page }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
    page.on('pageerror', (e) => errors.push(e.message));
    await journey(page, service);
    await expect(page.locator('.estimate-total').first()).toHaveText('£999.00');
    await expect(page.locator('.estimate-total').last()).toHaveText('£49.00/month');
    await expect(page.locator('[data-estimate-form]')).toContainText(
      'Indicative / subject to review',
    );
    await expect(page.locator('[data-estimate-form]')).toContainText(
      'VAT has not been calculated or added',
    );
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PDF Estimate' }).click(),
    ]);
    expect(await download.failure()).toBeNull();
    expect(errors).toEqual([]);
    expect(requests.join(' ')).not.toContain('unique-472');
    expect(requests.some((r) => r.startsWith('POST '))).toBe(false);
    expect(
      await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
    ).not.toContain('unique-472');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.locator('input[value=care]')).toBeChecked();
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Prepare my automation estimate' }),
    ).toBeVisible();
  });
test('conditional fields, validation, from-prices and PDF failure retain answers', async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Prepare my automation estimate' }).click();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Please complete');
  await choose(page, 'service', 'unsure');
  await expect(
    page.getByLabel('What repetitive work would you like help with?', { exact: true }),
  ).toBeVisible();
  await journey(page, 'document_automation');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByLabel('Additional independent workflows', { exact: true }).fill('1');
  await page
    .getByLabel('Describe each additional workflow and how it is independent', { exact: true })
    .fill('Independent daily record workflow');
  await page.getByLabel('Additional standard document templates', { exact: true }).fill('2');
  await page
    .getByLabel('Describe the extra templates and agreed information they should contain', {
      exact: true,
    })
    .fill('Two standard layouts for review');
  await next(page);
  await next(page);
  await expect(page.locator('.estimate-total').first()).toHaveText('From £1,996.00');
  await page.route('**/mark-print.png', (r) => r.abort());
  await page.getByRole('button', { name: 'Download PDF Estimate' }).click();
  await expect(page.getByRole('alert')).toContainText('PDF could not be created');
  await expect(page.locator('.estimate-total').first()).toHaveText('From £1,996.00');
});
for (const width of [320, 375, 390, 768, 1440])
  for (const theme of ['light', 'dark'])
    test(`${width}px ${theme} accessible responsive flow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => localStorage.setItem('ftt:theme', t), theme);
      await journey(page);
      expect(
        (await new AxeBuilder({ page }).include('.ai-automation-estimate').analyze()).violations,
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page
        .locator('.ai-automation-estimate')
        .screenshot({ path: `test-results/ai-estimate/${width}-${theme}.png` });
    });
test('static SEO and sitemap exclusion', async ({ page, request }) => {
  expect((await request.get(route)).status()).toBe(200);
  await page.goto(route);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://fintaxtech.co.uk${route}`,
  );
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(route);
});
