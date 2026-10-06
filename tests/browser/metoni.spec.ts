import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { metoni } from '../../src/content/metoni';
import { publishedApps } from '../../src/content/work';

test('shared Google Play badges retain app destinations, keyboard access and responsive artwork', async ({
  page,
}, info) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((theme) => localStorage.setItem('ftt:theme', theme), theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/selected-work/', metoni.route]) {
        await page.goto(route);
        const badges = page.locator('.google-play-badge');
        await expect(badges).toHaveCount(2);
        for (let i = 0; i < 2; i++) {
          const badge = badges.nth(i);
          const expected =
            route === metoni.route
              ? { url: metoni.playStoreURL, label: metoni.playLabel }
              : { url: publishedApps[i].playStoreUrl, label: publishedApps[i].visitLabel };
          await expect(badge).toHaveAttribute('href', expected.url);
          await expect(badge).toHaveAccessibleName(expected.label);
          await expect(badge).toHaveAttribute('rel', 'noopener noreferrer');
          await badge.focus();
          await expect(badge).toBeFocused();
          const img = badge.locator('img');
          await expect
            .poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0))
            .toBe(true);
          const size = await img.boundingBox();
          expect(size!.width / size!.height).toBeCloseTo(646 / 250);
          expect(size!.height).toBeGreaterThan(44);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (info.project.name === 'chromium' && width === 1280) {
          await page.locator(route === metoni.route ? '.page-head' : '.app-list').screenshot({
            path: `test-results/play-badges-${route === metoni.route ? 'metoni' : 'work'}-${theme}.png`,
          });
        }
      }
    }
  }
});

test('Metoni routes, store destinations and static metadata', async ({
  page,
  request,
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  for (const route of [metoni.route, metoni.supportRoute, metoni.privacyRoute, metoni.termsRoute]) {
    expect((await staticPage.goto(route))?.status()).toBe(200);
    await expect(staticPage.locator('h1')).toHaveCount(1);
    await expect(staticPage.locator('main')).not.toContainText(
      /\bAI\b|artificial intelligence|\bPro\b|subscriptions?|[£$€]\d/i,
    );
    await expect(staticPage.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk${route}`,
    );
    await expect(staticPage.locator('meta[name=robots]')).toHaveCount(0);
    await expect(staticPage.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(
      staticPage.locator('main').getByRole('link', { name: metoni.supportLabel, exact: true }),
    ).toHaveCount(route === metoni.route ? 2 : 1);
  }
  await staticPage.goto(metoni.route);
  await expect(staticPage.getByRole('heading', { name: metoni.featuresTitle })).toBeVisible();
  await expect(staticPage.getByRole('link', { name: metoni.appStoreLabel })).toHaveCount(0);
  const schema = JSON.parse(
    await staticPage.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(
    schema['@graph'].find((n: Record<string, unknown>) => n['@type'] === 'MobileApplication')
      .operatingSystem,
  ).toBe('Android');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const route of [metoni.route, metoni.supportRoute])
    expect(sitemap.split(`<loc>https://fintaxtech.co.uk${route}</loc>`)).toHaveLength(2);
  await context.close();
  await page.goto('/selected-work/');
  await page.getByRole('link', { name: metoni.exploreLabel, exact: true }).click();
  await expect(page).toHaveURL(/\/metoni\/$/);
  await expect(page.getByRole('link', { name: metoni.playLabel }).first()).toHaveAttribute(
    'href',
    metoni.playStoreURL,
  );
  await page.getByRole('link', { name: metoni.supportLabel, exact: true }).first().click();
  await expect(page).toHaveURL(/\/metoni\/support\/$/);
  await expect(page.locator('main a[href^="mailto:"]').first()).toHaveAttribute(
    'href',
    /ask@fintaxtech.co.uk/,
  );
  await expect(page.locator('main a[href^="tel:"]')).toHaveAttribute('href', 'tel:+447884594929');
  await expect(page.locator('main form')).toHaveCount(0);
});

for (const theme of ['light', 'dark'])
  test(`Metoni responsive layout and accessibility in ${theme}`, async ({ page }, info) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [metoni.route, metoni.supportRoute]) {
        await page.goto(route);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        const link = page.locator('main a').first();
        await link.focus();
        await expect(link).toBeFocused();
        if (route === metoni.route) {
          const images = page.locator('.metoni-gallery img');
          await expect(images).toHaveCount(6);
          for (const img of await images.all()) {
            await img.scrollIntoViewIfNeeded();
            await expect
              .poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0))
              .toBe(true);
            expect(await img.getAttribute('alt')).toBeTruthy();
            expect(await img.getAttribute('width')).toBeTruthy();
            expect(await img.getAttribute('height')).toBeTruthy();
          }
        }
        if (info.project.name === 'chromium' && width === 390)
          await page.screenshot({
            path: `test-results/metoni-${route.includes('support') ? 'support' : 'marketing'}-${theme}.png`,
            fullPage: true,
          });
      }
    }
  });

test('Metoni launch page omits the outdated promotional video', async ({ page }) => {
  await page.goto(metoni.route);
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.getByText(metoni.transcriptTitle, { exact: true })).toHaveCount(0);
});
