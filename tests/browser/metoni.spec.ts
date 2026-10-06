import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { metoni } from '../../src/content/metoni';

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

test('Metoni video loads only on demand and plays with captions and a readable alternative', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  const mediaRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('/metoni/promotional-video.mp4')) mediaRequests.push(r.url());
  });
  await page.goto(metoni.route);
  const video = page.locator('video');
  await video.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).not.toHaveAttribute('autoplay');
  await expect(video).toHaveAttribute('poster', /video-poster.*\.webp$/);
  await expect(video.locator('track')).toHaveAttribute('kind', 'captions');
  expect(mediaRequests).toHaveLength(0);
  const vtt = await request.get('/metoni/promotional-video.vtt');
  expect(vtt.status()).toBe(200);
  expect(await vtt.text()).toContain('WEBVTT');
  await video.focus();
  await expect(video).toBeFocused();
  // Mute only the test playback so the automated suite does not play audio on the user's computer.
  await video.evaluate(async (v: HTMLVideoElement) => {
    v.muted = true;
    await v.play();
  });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  const state = await video.evaluate((v: HTMLVideoElement) => ({
    duration: v.duration,
    width: v.videoWidth,
    height: v.videoHeight,
    error: v.error,
  }));
  expect(state.duration).toBeGreaterThan(42);
  expect(state.duration).toBeLessThan(43);
  expect(state.width / state.height).toBeCloseTo(16 / 9);
  expect(state.error).toBeNull();
  await video.evaluate((v: HTMLVideoElement) => v.pause());
  await page.getByText(metoni.transcriptTitle, { exact: true }).click();
  await expect(page.locator('details[open]')).toContainText('Apply Suggestion');
});
