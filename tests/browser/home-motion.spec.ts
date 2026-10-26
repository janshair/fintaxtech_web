import { test, expect } from '@playwright/test';
import { heroProcess } from '../../src/content/home-motion';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});

test('scenes play once, pause offscreen, resume and settle without changing layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const hero = page.locator('.hero-process');
  await expect(hero).toHaveAccessibleName(heroProcess.label);
  await expect(page.locator('[data-home-motion]')).toHaveCount(6);
  await expect(hero).toHaveAttribute('data-motion-state', 'running');
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await expect(hero).toHaveAttribute('data-motion-state', 'paused');
  await expect(hero.locator('.input-card').last()).toHaveCSS('opacity', '1');
  await expect(hero.locator('.review-mark')).toHaveCSS('opacity', '1');
  const times = await hero.evaluate((node) =>
    node.getAnimations({ subtree: true }).map((a) => a.currentTime),
  );
  expect(times.length).toBeGreaterThan(0);
  await page.waitForTimeout(200);
  expect(
    await hero.evaluate((node) => node.getAnimations({ subtree: true }).map((a) => a.currentTime)),
  ).toEqual(times);
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-motion-state', 'finished');
  expect(await hero.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  for (const scene of await page.locator('[data-home-motion]').all()) {
    await scene.scrollIntoViewIfNeeded();
    const before = await scene.boundingBox();
    await expect(scene).toHaveAttribute('data-motion-state', 'finished');
    const after = await scene.boundingBox();
    expect(after?.width).toBe(before?.width);
    expect(after?.height).toBe(before?.height);
  }
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-motion-state', 'finished');
  expect(errors).toEqual([]);
});

test('reduced motion and JavaScript unavailable both show the final artwork', async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const scene of await page.locator('[data-home-motion]').all()) {
    await expect(scene).toHaveAttribute('data-motion-state', 'finished');
    expect(await scene.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://localhost:4323/');
  await expect(staticPage.locator('.review-mark')).toHaveCSS('opacity', '1');
  await expect(staticPage.locator('.step-content').last()).toHaveCSS('opacity', '1');
  await expect(staticPage.locator('.hero-process')).toHaveAccessibleName(heroProcess.label);
  await context.close();
});

test('motion is homepage-only and keyboard card activation is unchanged', async ({ page }) => {
  for (const route of ['/start/', '/services/']) {
    await page.goto(route);
    await expect(page.locator('[data-home-motion]')).toHaveCount(0);
  }
  await page.goto('/');
  const card = page.locator('.service-card').first();
  await card.focus();
  await expect(card).toBeFocused();
  await card.press('Enter');
  await expect(page).toHaveURL(/\/services\/branding\/$/);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive motion artwork at ${width}px in both themes`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      for (const selector of ['.hero-process', '.service-grid', '.home-process-steps']) {
        const section = page.locator(selector);
        await section.scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const box = await section.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        if (testInfo.project.name === 'chromium') {
          await section.screenshot({
            path: testInfo.outputPath(`${selector.slice(1)}-${width}-${theme}.png`),
          });
        }
      }
      await expect(page.locator('.step-connection path').first()).toHaveCSS(
        'vector-effect',
        'non-scaling-stroke',
      );
    }
  });
}

for (const width of [390, 768, 1440, 1920]) {
  test(`process connectors meet fixed dots before revealing text at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const process = page.locator('.home-process-steps');
    await process.scrollIntoViewIfNeeded();
    await expect(process).toHaveAttribute('data-motion-state', 'running');
    const dots = process.locator('.step-number');
    const initial = await dots.evaluateAll((nodes) =>
      nodes.map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    const sample = async (time: number) => {
      await process.evaluate((node, time) => {
        for (const animation of node.getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = time;
        }
      }, time);
    };
    await sample(800);
    await expect(process.locator('.step-label').nth(1)).toHaveCSS(
      'clip-path',
      'inset(0px 100% 0px 0px)',
    );
    await sample(1200);
    await expect(process.locator('.step-label').nth(1)).not.toHaveCSS(
      'clip-path',
      'inset(0px 100% 0px 0px)',
    );
    const line = await process.locator('.step-connection').first().boundingBox();
    const horizontal = width >= 768;
    expect(line![horizontal ? 'x' : 'y']).toBeCloseTo(initial[0][horizontal ? 'x' : 'y'] + 20, 0);
    expect(line![horizontal ? 'x' : 'y'] + line![horizontal ? 'width' : 'height']).toBeCloseTo(
      initial[1][horizontal ? 'x' : 'y'] + 20,
      0,
    );
    await expect(process.locator('.step-connection path').first()).toHaveCSS(
      'stroke-dasharray',
      'none',
    );
    await sample(1800);
    await expect(process.locator('.step-label').nth(2)).toHaveCSS(
      'clip-path',
      'inset(0px 100% 0px 0px)',
    );
    await sample(2500);
    await expect(process.locator('.step-label').nth(2)).not.toHaveCSS(
      'clip-path',
      'inset(0px 100% 0px 0px)',
    );
    expect(
      await dots.evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y, width, height };
        }),
      ),
    ).toEqual(initial);
    if (testInfo.project.name === 'chromium')
      await process.screenshot({ path: testInfo.outputPath(`connected-process-${width}.png`) });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const label of await process.locator('.step-label').all())
      await expect(label).toHaveCSS('clip-path', 'none');
    await expect(process).toHaveAttribute('data-motion-state', 'finished');
  });
}
