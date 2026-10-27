import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { threeDTemplates, threeDGallery } from '../../src/content/templates';
const route = threeDTemplates[0].route;
const letter =
  route + '?name=Jay%27s%20Juice%20%26%20Co&area=Kirkcaldy&phone=07526%20699217&ref=L-TEST';

test('3D gallery keeps official themes and all registered previews', async ({ page }) => {
  await page.goto(threeDGallery.route);
  await expect(page.locator('h1')).toHaveText(threeDGallery.title);
  for (const demo of threeDTemplates) {
    await expect(page.locator(`a[href="${demo.route}"]`)).toBeVisible();
    await expect(page.locator(`img[src="${demo.preview.src}"]`)).toBeVisible();
  }
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});

test('letter: immediate identity, privacy, drink flow, literal text and phone layouts', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors: string[] = [],
    warnings: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning') warnings.push(m.text());
  });
  page.on('request', (r) => {
    if (r.resourceType() !== 'document') requests.push(r.url() + ' ' + (r.headers().referer || ''));
  });
  const navigationStarted = Date.now();
  await page.goto(letter, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(Math.max(0, 300 - (Date.now() - navigationStarted)));
  const firstScreenMs = Date.now() - navigationStarted;
  expect(firstScreenMs).toBeLessThan(400);
  testInfo.annotations.push({ type: 'first-screen-ms', description: String(firstScreenMs) });
  await expect(page.locator('.brand [data-business]').first()).toHaveText("Jay's Juice & Co");
  await expect(page.locator('h1')).toBeInViewport();
  await expect(page.locator('.hero [data-order]')).toBeInViewport();
  await expect(page.locator('.hero-scene img')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('letter-300ms.png') });
  await page.waitForFunction(() =>
    ['live', 'fallback'].includes(document.documentElement.dataset.three || ''),
  );
  if ((await page.locator('html').getAttribute('data-three')) === 'live')
    await expect(page.locator('canvas')).toHaveAttribute('data-label', "Jay's Juice & Co");
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  for (const link of await page.locator('[data-agency-link]').all())
    await expect(link).toHaveAttribute('href', '/contact/?ref=L-TEST');
  await expect(page.locator('[data-call]').first()).toHaveAttribute('href', 'tel:+447526699217');
  await expect(page.locator('[data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/447526699217',
  );
  await page.locator('.hero [data-order]').click();
  await page.getByRole('button', { name: 'Next: your mix' }).click();
  await page.locator('#drink-fruit').selectOption('berry');
  await expect(page.locator('[data-drink-description]')).toContainText('Strawberry');
  if ((await page.locator('html').getAttribute('data-three')) === 'live')
    await expect(page.locator('canvas')).toHaveAttribute('data-colour', '#d77e91');
  await page.getByRole('button', { name: 'See order preview' }).click();
  await expect(page.locator('#order-final')).toContainText(
    'Demo only — nothing is ordered or paid.',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('.hero [data-order]')).toBeFocused();
  for (const name of ['X'.repeat(100), '<img src=x onerror=alert(1)> & Co']) {
    await page.locator('[data-edit]').click();
    await page.locator('#business-name').fill(name);
    await page.getByRole('button', { name: 'Preview my website' }).click();
    await expect(page.locator('.brand [data-business]').first()).toHaveText(name);
    expect(await page.locator('[data-business] img').count()).toBe(0);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  expect(
    await page
      .locator('main section')
      .evaluateAll((nodes) => nodes.every((n) => getComputedStyle(n).opacity === '1')),
  ).toBe(true);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(requests.filter((r) => /Jay|Kirkcaldy|07526|L-TEST/.test(r))).toEqual([]);
  expect(errors).toEqual([]);
  // Headless Chromium's screenshot compositor may emit this exact driver
  // diagnostic. Preserve/report it; all application and other WebGL warnings fail.
  const captureWarnings = warnings.filter((w) => /GPU stall due to ReadPixels/.test(w));
  if (captureWarnings.length)
    testInfo.annotations.push({
      type: 'capture-driver-warning',
      description: JSON.stringify(captureWarnings),
    });
  expect(warnings.filter((w) => !/GPU stall due to ReadPixels/.test(w))).toEqual([]);
  await testInfo.attach('network-requests', {
    body: JSON.stringify(requests, null, 2),
    contentType: 'application/json',
  });
});

test('story progresses through all stages in 20px steps, with one renderer and pauses', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(letter);
  await page.waitForFunction(() => !!document.documentElement.dataset.three);
  if ((await page.locator('html').getAttribute('data-three')) !== 'live') {
    testInfo.annotations.push({
      type: 'limitation',
      description:
        'Engine uses poster fallback: ' +
        (await page.locator('html').getAttribute('data-fallback')),
    });
    return;
  }
  const start = await page
    .locator('[data-story-track]')
    .evaluate((e) => e.getBoundingClientRect().top + scrollY - 470);
  const logs: { y: number; p: number; top: number; bottom: number; bar: number }[] = [];
  for (let offset = 0; offset <= 820; offset += 20) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), start + offset);
    await page.waitForTimeout(22);
    logs.push(
      await page.evaluate(() => {
        const track = document.querySelector<HTMLElement>('[data-story-track]')!,
          r = document.querySelector('[data-scene=story]')!.getBoundingClientRect();
        return {
          y: scrollY,
          p: Number(track.dataset.progress),
          top: r.top,
          bottom: r.bottom,
          bar: document.querySelector('.mobile-contact')!.getBoundingClientRect().height,
        };
      }),
    );
  }
  for (let i = 1; i < logs.length; i++) {
    expect(logs[i].p).toBeGreaterThanOrEqual(logs[i - 1].p);
    if (logs[i].p > logs[i - 1].p && logs[i].p < 1) {
      expect(logs[i].top).toBeGreaterThanOrEqual(0);
      expect(logs[i].bottom).toBeLessThanOrEqual(812 - logs[i].bar + 1);
    }
  }
  for (let stage = 0; stage < 3; stage++)
    expect(
      logs.filter((l) => l.p > stage / 3 + 0.03 && l.p < (stage + 1) / 3 - 0.03).length,
    ).toBeGreaterThan(3);
  const active = logs.filter((l) => l.p > 0 && l.p < 1);
  expect(active.at(-1)!.y - active[0].y).toBeGreaterThanOrEqual(560);
  expect(active.at(-1)!.y - active[0].y).toBeLessThanOrEqual(660);
  await testInfo.attach('scroll-progress', {
    body: JSON.stringify(logs, null, 2),
    contentType: 'application/json',
  });
  expect(await page.locator('canvas').count()).toBe(1);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2200);
  await expect(page.locator('html')).toHaveAttribute('data-rendering', 'paused');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('posters keep the complete page usable without JavaScript', async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto(letter);
  for (const section of ['.hero', '#menu', '#contact'])
    await expect(page.locator(section)).toBeVisible();
  await expect(page.locator('.poster-sequence figure')).toHaveCount(3);
  expect(await page.locator('canvas').count()).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('no-javascript.png') });
  await context.close();
});

for (const kind of [
  'reduced-motion',
  'save-data',
  'low-memory',
  'webgl',
  'low-frame-rate',
] as const) {
  test('poster fallback: ' + kind, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      reducedMotion: kind === 'reduced-motion' ? 'reduce' : 'no-preference',
    });
    await context.addInitScript((mode) => {
      if (mode === 'save-data')
        Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
      if (mode === 'low-memory') Object.defineProperty(navigator, 'deviceMemory', { value: 2 });
      if (mode === 'webgl') {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type: any, ...args: any[]): any {
          if (String(type).includes('webgl')) return null;
          return original.apply(this, [type, ...args] as any);
        };
      }
      if (mode === 'low-frame-rate')
        window.requestAnimationFrame = (callback) =>
          window.setTimeout(() => callback(performance.now()), 55);
    }, kind);
    const page = await context.newPage();
    await page.goto(letter);
    await expect(page.locator('html')).toHaveAttribute('data-three', 'fallback', {
      timeout: 15000,
    });
    await expect(page.locator('.poster-sequence')).toBeVisible();
    await page.locator('.hero [data-order]').click();
    await page.getByRole('button', { name: 'Next: your mix' }).click();
    await page.getByRole('button', { name: 'See order preview' }).click();
    await expect(page.locator('#order-final')).toBeVisible();
    await testInfo.attach('fallback-reason', {
      body: (await page.locator('html').getAttribute('data-fallback')) || '',
      contentType: 'text/plain',
    });
    await context.close();
  });
}

test('motion preference changes live, name edit validates, default offer and restore', async ({
  page,
}) => {
  await page.goto(route);
  await expect(page.locator('#name-dialog')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('#name-error')).toContainText('Enter your business name');
  await page.locator('#business-name').fill('Tayside Juice Co');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page).toHaveURL(/name=Tayside/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-fallback', 'reduced-motion');
  await page.locator('[data-edit]').click();
  await page.locator('#restore-name').click();
  await expect(page.locator('.brand [data-business]').first()).toHaveText('Daybreak Juice Club');
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
});
