import { test, expect } from '@playwright/test';
import { tailoringDemo as c } from '../../src/content/tailoring-demo';
const query = '?name=Tayside%20Alterations&area=Broughty%20Ferry&phone=01382%20000000';
for (const width of [320, 375, 390, 768, 1440]) {
  test(`every tailoring reveal becomes readable while scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(c.route + query);
    const nodes = page.locator('[data-reveal]');
    expect(await nodes.count()).toBeGreaterThan(15);
    for (const node of await nodes.all()) {
      await node.evaluate((n) =>
        scrollTo({ top: n.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
      );
      await expect(node).toHaveClass(/revealed/);
      await expect(node).toHaveCSS(
        'opacity',
        (await node.getAttribute('class'))?.includes('hours-closed') ? '0.7' : '1',
        { timeout: 2000 },
      );
      await expect(node).toHaveCSS('clip-path', 'none');
    }
    await expect(page.locator('#services .section-heading')).toHaveClass(/revealed/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const node of await nodes.all()) await expect(node).toHaveCSS('opacity', '1');
    expect(errors).toEqual([]);
  });
}

test('independent watchdog reveals an in-view heading when observer callbacks are lost', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(
          options?.threshold === 0 && options?.rootMargin === '0px' ? () => {} : callback,
          options,
        );
      }
    };
  });
  await page.goto(c.route + query);
  const heading = page.locator('#services .section-heading');
  await heading.evaluate((n) =>
    scrollTo({ top: n.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
  );
  await expect(heading).toHaveClass(/reveal-forced/, { timeout: 1600 });
  await expect(heading).toHaveCSS('opacity', '1');
});

test('missing motion script leaves all content visible; no reveal CSS is enabled', async ({
  page,
}) => {
  await page.route('**/tailoring-02/motion.js', (route) => route.abort());
  await page.goto(c.route + query);
  await expect(page.locator('html')).not.toHaveClass(/motion-ready|reveal-ready/);
  for (const node of await page
    .locator('.section-heading,.service-row,.visit > div,.contact > div')
    .all()) {
    await expect(node).toHaveCSS('opacity', '1');
    await expect(node).toHaveCSS('clip-path', 'none');
  }
});

test('phone name/headline readable at 500ms and entrance finishes by 1.5s', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(c.route + query, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const nameClips = await page
    .locator('.name-word')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).clipPath));
  expect(nameClips.length).toBeGreaterThan(0);
  expect(
    nameClips.every(
      (clip) =>
        clip === 'none' || (clip.match(/[\d.]+/g) || []).every((value) => Number(value) === 0),
    ),
  ).toBe(true);
  const headlineOffsets = await page
    .locator('.headline-mask > *')
    .evaluateAll((nodes) =>
      nodes.map((n) => new DOMMatrixReadOnly(getComputedStyle(n).transform).m42),
    );
  expect(headlineOffsets.every((y) => Math.abs(y) < 0.5)).toBe(true);
  await expect(page.locator('.hero-copy > .button')).toHaveCSS('opacity', '1');
  await page.waitForTimeout(1000);
  await expect(page.locator('html')).not.toHaveClass(/load-sequence/);
  await expect(page.locator('.hero-identity')).not.toHaveClass(/name-sewing/);
});

test('initial reduced motion exposes all reveal content immediately and favicon resolves', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(c.route + query);
  await expect(page.locator('html')).not.toHaveClass(/reveal-ready/);
  for (const node of await page.locator('[data-reveal]').all())
    await expect(node).toHaveCSS('opacity', '1');
  const favicon = await page.locator('link[rel=icon]').getAttribute('href');
  expect((await request.get(favicon!)).status()).toBe(200);
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});
