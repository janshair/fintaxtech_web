import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { promoCopy, promoStatus } from '../../src/content/promo';

const origin = 'https://fintaxtech.co.uk';
test('canonical public pages and every article are crawlable without JavaScript; form variants remain excluded', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>https:\/\/fintaxtech.co.uk([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  const articles = paths.filter((p) => /^\/blog\/.+\/$/.test(p));
  await page.goto('http://localhost:4323/blog/');
  const links = await page
    .locator('main a')
    .evaluateAll((a) => a.map((el) => el.getAttribute('href')));
  for (const path of articles) expect(links).toContain(path);
  for (const path of [
    '/start/',
    '/promo/',
    '/services/websites/',
    '/services/mobile-apps/',
    '/services/ai-automation/',
    ...articles,
  ]) {
    expect(paths.filter((p) => p === path)).toHaveLength(1);
    expect((await page.goto('http://localhost:4323' + path))?.status()).toBe(200);
    await expect(page.locator('meta[name=robots]')).toHaveCount(0);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', origin + path);
    await expect(page.locator('h1')).toHaveCount(1);
    if (articles.includes(path))
      expect((await page.locator('main').innerText()).split(/\s+/).length).toBeGreaterThan(500);
  }
  for (const service of [
    '',
    '?service=branding',
    '?service=websites',
    '?service=mobile-apps',
    '?service=prompt-services',
    '?service=ai-automation',
  ]) {
    expect((await page.goto('http://localhost:4323/enquiry/' + service))?.status()).toBe(200);
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', origin + '/enquiry/');
  }
  expect(sitemap).not.toContain('/enquiry/');
  expect(sitemap).not.toContain('/client/');
  expect(paths.every((path) => !path.includes('?'))).toBe(true);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).not.toMatch(/^Disallow:\s*\S/m);
  expect(robots).toContain(origin + '/sitemap.xml');
  await page.goto('http://localhost:4323/pricing/');
  await page.getByRole('link', { name: promoCopy.linkLabel }).click();
  await expect(page).toHaveURL('http://localhost:4323/promo/');
  await expect(page.getByRole('heading', { name: promoCopy.eligibilityTitle })).toBeVisible();
  await expect(page.getByRole('heading', { name: promoCopy.exclusionsTitle })).toBeVisible();
  if (promoStatus !== 'closed') {
    await expect(page.getByText(promoCopy.ongoing, { exact: true })).toBeVisible();
    await expect(page.getByText(promoCopy.changes, { exact: true })).toBeVisible();
  }
  await context.close();
});

for (const theme of ['light', 'dark'])
  test(`promo terms and application link in ${theme}`, async ({ page }, info) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/promo/');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`promo-${theme}.png`), fullPage: true });
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(
      schema['@graph'].find((n: any) => n['@type'] === 'BreadcrumbList').itemListElement.at(-1)
        .item,
    ).toBe(origin + '/promo/');
    const action = page.locator(promoStatus === 'closed' ? '#standard-start' : '#promo-start');
    await action.focus();
    await page.keyboard.press('Enter');
    if (promoStatus === 'closed') await expect(page).toHaveURL('/start/');
    else {
      await expect(page).toHaveURL('/enquiry/');
      await expect(page.locator('#questionnaire h1')).toHaveText('Website Design and Development');
      await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
    }
  });
