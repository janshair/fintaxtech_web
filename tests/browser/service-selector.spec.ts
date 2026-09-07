import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { services } from '../../src/content/services';
import { selectorCopy, ui } from '../../src/content/site';
import { quizCopy } from '../../src/content/questionnaire';

async function selectorMetrics(page: Page) {
  return page.locator('.service-selector').evaluate((section) => {
    const selectors = [
      '.container',
      'h2',
      '.service-grid',
      '.service-card',
      '.number',
      'h3',
      '.service-card p',
      '.arrow',
      '.unsure',
      '.unsure a',
      '.unsure .muted',
    ];
    const properties = [
      'width',
      'height',
      'padding',
      'border',
      'borderRadius',
      'textAlign',
      'fontFamily',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'margin',
      'gap',
      'alignSelf',
      'color',
      'backgroundColor',
      'gridTemplateColumns',
    ];
    const metrics = Object.fromEntries(
      selectors.map((selector) => {
        const style = getComputedStyle(section.querySelector(selector)!);
        return [
          selector,
          Object.fromEntries(properties.map((p) => [p, style[p as keyof CSSStyleDeclaration]])),
        ];
      }),
    );
    const grid = section.querySelector('.service-grid')!.getBoundingClientRect();
    const cards = [...section.querySelectorAll('.service-card')].map((card) => {
      const rect = card.getBoundingClientRect();
      return {
        x: Math.round((rect.x - grid.x) * 100) / 100,
        y: Math.round((rect.y - grid.y) * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
      };
    });
    return {
      metrics,
      cards,
      text: section.textContent?.replace(/\s+/g, ' ').trim(),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
}

for (const width of [1024, 1280, 1440, 320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`shared selector matches at ${width}px in ${theme} mode`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((theme) => {
        localStorage.setItem('ftt:theme', theme);
        localStorage.setItem('ftt:consent', 'rejected');
      }, theme);
      const captures: Buffer[] = [];
      const results: Awaited<ReturnType<typeof selectorMetrics>>[] = [];
      for (const [name, route] of [
        ['home', '/'],
        ['start', '/start/'],
      ]) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(0, 0);
        const selector = page.locator('.service-selector');
        await expect(selector.getByRole('heading', { level: 2 })).toHaveText(selectorCopy.title);
        await expect(selector.locator('.service-card')).toHaveCount(4);
        await expect(selector.getByRole('link', { name: ui.notSure, exact: true })).toBeVisible();
        await expect(selector.getByRole('button')).toHaveCount(0);
        results.push(await selectorMetrics(page));
        expect(results.at(-1)!.overflow).toBe(false);
        if (name === 'start') {
          const notice = await page.locator('#start-selection .notice').first().boundingBox();
          const grid = await selector.locator('.service-grid').boundingBox();
          expect(notice!.x).toBeCloseTo(grid!.x);
          expect(notice!.width).toBeCloseTo(grid!.width);
          expect(notice!.y + notice!.height).toBeLessThan(grid!.y);
        }
        if (testInfo.project.name === 'chromium') {
          await mkdir('docs/visual-checks/service-selector', { recursive: true });
          captures.push(
            await selector.locator('.container').screenshot({
              path: `docs/visual-checks/service-selector/${name}-${width}-${theme}.png`,
            }),
          );
        }
      }
      expect(results[1]).toEqual(results[0]);
      expect(new Set(results[0].cards.map((card) => card.y)).size).toBe(width >= 1024 ? 1 : 4);
      expect(results[0].metrics['.service-card'].textAlign).toBe('left');
      if (captures.length) {
        const home = await sharp(captures[0])
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const start = await sharp(captures[1])
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        expect(start.info.width).toBe(home.info.width);
        expect(Math.abs(start.info.height - home.info.height)).toBeLessThanOrEqual(1);
        // A fractional document Y-coordinate can add a crop row or shift rasterisation by one pixel.
        // Geometry and computed styles above must still match exactly to 0.01px.
        const height = Math.min(start.info.height, home.info.height) - 1;
        const width = home.info.width;
        const ratios = [-1, 0, 1].map((offset) => {
          let different = 0;
          for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++) {
              const a = ((y + Math.max(0, -offset)) * width + x) * 4;
              const b = ((y + Math.max(0, offset)) * width + x) * 4;
              if (
                Math.max(...[0, 1, 2].map((c) => Math.abs(home.data[a + c] - start.data[b + c]))) >
                40
              )
                different++;
            }
          return different / (width * height);
        });
        expect(Math.min(...ratios)).toBeLessThan(0.015);
      }
    });
  }
}

test('shared card links preserve keyboard activation and questionnaire back navigation', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  await page.goto('/start/');
  for (const [index, service] of services.entries()) {
    const card = page.locator(`.service-card[data-start-service="${service.id}"]`);
    await page.locator('#start-title').focus();
    for (let i = 0; i <= index; i++)
      await page.keyboard.press(testInfo.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(card).toBeFocused();
    await expect(card).toHaveCSS('outline-style', 'solid');
    await card.press('Enter');
    await expect(page).toHaveURL(/\/start\/$/);
    await expect(page.locator('#questionnaire h1')).toHaveText(service.name);
    await expect(page.locator('#start-selection')).toBeHidden();
    await page.getByRole('button', { name: quizCopy.begin, exact: true }).click();
    await expect(page.locator('#questionnaire fieldset')).toBeVisible();
    await page.getByRole('button', { name: quizCopy.back, exact: true }).click();
    await page.getByRole('button', { name: quizCopy.back, exact: true }).click();
    await expect(page.locator('.service-selector')).toBeVisible();
  }
  const help = page
    .locator('.service-selector')
    .getByRole('link', { name: ui.notSure, exact: true });
  await help.focus();
  await help.press('Enter');
  await expect(page.locator('#questionnaire h1')).toHaveText(quizCopy.routingTitle);
  await page.getByRole('button', { name: quizCopy.back, exact: true }).click();
  await expect(page.locator('.service-selector h2')).toHaveText(selectorCopy.title);
  await page.goto('/');
  await page.locator('.service-card').first().press('Enter');
  await expect(page).toHaveURL(/\/services\/branding\/$/);
});
