import { test, expect } from '@playwright/test';
const route = '/templates/website/motion/barber-01/';
const endpoint = 'https://counts.fintaxtech.co.uk/visits';

async function configure(page: import('@playwright/test').Page) {
  // Test-only configuration in the real built HTML, no live endpoint or production activation.
  await page.route('**/templates/website/motion/barber-01/?*', async (request) => {
    if (request.request().resourceType() !== 'document') return request.continue();
    const response = await request.fetch();
    const html = (await response.text()).replace(
      /(<script[^>]*id="barber-visit-config"[^>]*>)[\s\S]*?(<\/script>)/,
      '$1' + JSON.stringify({ endpoint, codes: 'DEMO01' }) + '$2',
    );
    await request.fulfill({ response, body: html });
  });
}

test('configured counter sends only an approved code once, without referrer, cookies or personalisation', async ({
  page,
  context,
}) => {
  await configure(page);
  await context.addCookies([
    {
      name: 'unrelated',
      value: 'secret',
      domain: 'counts.fintaxtech.co.uk',
      path: '/',
      secure: true,
    },
  ]);
  const requests: import('@playwright/test').Request[] = [];
  await page.route(endpoint, async (route) => {
    if (route.request().method() === 'POST') requests.push(route.request());
    await route.fulfill({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4323',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST',
      },
    });
  });
  await page.goto(route + '?ref=DEMO01&name=Jay%27s%20Cuts&area=London&phone=447700900123');
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].postDataJSON()).toEqual({ ref: 'DEMO01' });
  expect(await requests[0].headerValue('referer')).toBeNull();
  expect(await requests[0].headerValue('cookie')).toBeNull();
  await page.locator('[data-personalise]').first().click();
  await page.getByLabel('Business name', { exact: true }).fill('Changed name');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  expect(requests).toHaveLength(1);
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
});

for (const reason of ['disabled', 'unknown', 'duplicate', 'dnt', 'gpc']) {
  test(`no request when ${reason}`, async ({ page }) => {
    if (reason !== 'disabled') await configure(page);
    if (reason === 'dnt' || reason === 'gpc')
      await page.addInitScript((reason) => {
        Object.defineProperty(navigator, reason === 'dnt' ? 'doNotTrack' : 'globalPrivacyControl', {
          value: reason === 'dnt' ? '1' : true,
        });
      }, reason);
    const requests: string[] = [];
    await page.route(endpoint, async (route) => {
      requests.push(route.request().url());
      await route.abort();
    });
    const query =
      reason === 'unknown'
        ? 'ref=unknown'
        : reason === 'duplicate'
          ? 'ref=DEMO01&ref=DEMO01'
          : 'ref=DEMO01';
    await page.goto(route + '?name=Geej&' + query);
    await expect(page.locator('[data-business]').first()).toHaveText('Geej');
    await page.locator('[data-book]').first().click();
    await expect(page.locator('#booking-dialog')).toBeVisible();
    expect(requests).toEqual([]);
  });
}

test('network failure stays silent and does not disrupt booking', async ({ page }) => {
  await configure(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    attempts++;
    await route.abort();
  });
  await page.goto(route + '?name=Geej&ref=DEMO01');
  await expect.poll(() => attempts).toBe(1);
  await page.locator('[data-book]').first().click();
  await expect(page.locator('#booking-dialog')).toBeVisible();
  expect(errors).toEqual([]);
  expect(attempts).toBe(1);
});
