import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { metoni } from '../../src/content/metoni';
import { company } from '../../src/content/site';
import { publishedApps } from '../../src/content/work';

test('shared Google Play badges retain app destinations, keyboard access and responsive artwork', async ({
  page,
}, info) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((theme) => localStorage.setItem('ftt:theme', theme), theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/work/', metoni.route]) {
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
    // Business pilot pricing must remain separate from the consumer app offer.
    const consumerCopy = await staticPage.locator('main').evaluate((main) => {
      const copy = main.cloneNode(true) as HTMLElement;
      copy.querySelector('#for-gyms')?.remove();
      return copy.textContent;
    });
    expect(consumerCopy).not.toMatch(
      /\bAI\b|artificial intelligence|\bPro\b|subscriptions?|[£$€]\d/i,
    );
    await expect(staticPage.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk${route}`,
    );
    await expect(staticPage.locator('meta[name=robots]')).toHaveCount(0);
    await expect(staticPage.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(
      staticPage
        .locator(route === metoni.route ? 'body' : 'main')
        .getByRole('link', { name: metoni.supportLabel, exact: true }),
    ).toHaveCount(route === metoni.route ? 2 : 1);
  }
  await staticPage.goto(metoni.route);
  await expect(staticPage.getByRole('heading', { name: metoni.featuresTitle })).toBeVisible();
  await expect(staticPage.getByRole('link', { name: metoni.appStoreLabel })).toHaveCount(2);
  for (const badge of await staticPage.getByRole('link', { name: metoni.appStoreLabel }).all()) {
    await expect(badge).toHaveAttribute('href', metoni.appStoreURL);
  }
  const schema = JSON.parse(
    await staticPage.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(
    schema['@graph'].find((n: Record<string, unknown>) => n['@type'] === 'MobileApplication')
      .operatingSystem,
  ).toEqual(['Android', 'iOS']);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const route of [metoni.route, metoni.supportRoute])
    expect(sitemap.split(`<loc>https://fintaxtech.co.uk${route}</loc>`)).toHaveLength(2);
  await context.close();
  await page.goto('/work/');
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
  await expect(page.locator('main a[href^="tel:"]')).toHaveAttribute('href', 'tel:+447442906018');
  await expect(page.locator('main form')).toHaveCount(0);
});

for (const theme of ['light', 'dark'])
  test(`Metoni responsive layout and accessibility in ${theme}`, async ({ page }, info) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('metoni:theme', theme);
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
          await expect(images).toHaveCount(8);
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

test('Metoni loads YouTube only on keyboard activation and keeps a no-JavaScript fallback', async ({
  page,
  browser,
  request,
}, info) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  const youtubeRequests: string[] = [];
  page.on('request', (r) => {
    if (
      /(^|\.)(youtube(?:-nocookie)?\.com|ytimg\.com|googlevideo\.com)$/.test(
        new URL(r.url()).hostname,
      )
    )
      youtubeRequests.push(r.url());
  });
  // Verify our integration deterministically without depending on YouTube's network or consent UI.
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Video test</title>',
    }),
  );
  await page.goto(metoni.route);
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  const load = page.getByRole('button', { name: metoni.videoLoad, exact: true });
  await load.scrollIntoViewIfNeeded();
  expect(youtubeRequests).toEqual([]);
  if (info.project.name === 'chromium')
    await page
      .locator('section[aria-labelledby="metoni-video"]')
      .screenshot({ path: 'test-results/metoni-youtube.png' });
  await load.focus();
  await load.press('Enter');
  const player = page.getByTitle(metoni.videoFrameTitle, { exact: true });
  await expect(player).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/x-koq6t8YC4?playsinline=1&rel=0',
  );
  await expect(player).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  await expect(player).toBeFocused();
  await expect.poll(() => youtubeRequests.length).toBe(1);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await player.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto(metoni.route);
  await expect(staticPage.getByRole('link', { name: metoni.videoLink })).toHaveAttribute(
    'href',
    'https://youtu.be/x-koq6t8YC4',
  );
  await expect(staticPage.getByRole('button', { name: metoni.videoLoad })).toHaveCount(0);
  await context.close();
  for (const removed of ['promotional-video.mp4', 'promotional-video.vtt'])
    expect((await request.get(`/metoni/${removed}`)).status()).toBe(404);
});

test('gym pilot enquiries identify the package and preserve the app download route', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(metoni.route);
  const navigation = page.getByRole('link', { name: 'For gyms', exact: true });
  await navigation.focus();
  await navigation.press('Enter');
  await expect(page).toHaveURL(/#for-gyms$/);
  const section = page.locator('#for-gyms');
  await expect(section).toContainText('Gym packages are in development.');
  const packages = [
    ['Website', '79', '499'],
    ['Connected Gym', '149', '749'],
    ['Own Brand', '249', '999'],
  ];
  for (const [name, monthly, setup] of packages) {
    const card = section.getByRole('article', { name, exact: true });
    await expect(card.locator('.monthly-price')).toHaveText(`£${monthly}/month`);
    await expect(card.locator('.setup-price')).toHaveText(`£${setup} one-time setup`);
    const enquiry = card.getByRole('link');
    await enquiry.focus();
    await expect(enquiry).toBeFocused();
    const url = new URL((await enquiry.getAttribute('href'))!);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe(company.email);
    expect(url.searchParams.get('subject')).toBe(`Metoni gym package enquiry — ${name}`);
  }
  for (const detail of await section.locator('details').all()) {
    await detail.locator('summary').focus();
    await detail.locator('summary').press('Enter');
    await expect(detail).toHaveAttribute('open', '');
  }
  expect((await new AxeBuilder({ page }).include('#for-gyms').analyze()).violations).toEqual([]);
  const example = section.getByRole('link', { name: 'Preview the gym website template' });
  expect(new URL((await example.getAttribute('href'))!).pathname).toBe(
    '/templates/website/motion/gym-06/',
  );
  expect((await request.get('/templates/website/motion/gym-06/')).status()).toBe(200);
  expect((await request.get('/contact/')).status()).toBe(200);
  await page.getByRole('link', { name: 'Get the app' }).click();
  await expect(page).toHaveURL(/#download$/);
  await expect(
    page.locator('#download').getByRole('link', { name: metoni.appStoreLabel }),
  ).toBeVisible();
});
