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

test('letter: name everywhere, privacy, builder to ticket on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => {
    if (r.resourceType() !== 'document') requests.push(r.url() + ' ' + (r.headers().referer || ''));
  });
  await page.goto(letter);
  await expect(page).toHaveTitle("Jay's Juice & Co — Juice bar website demo by FinTaxTech");
  await expect(page.locator('.bar [data-business]')).toHaveText("Jay's Juice & Co");
  await expect(page.locator('.hero .lead [data-area]')).toHaveText('Kirkcaldy');
  await expect(page.locator('[data-call]')).toHaveAttribute('href', 'tel:+447526699217');
  for (const link of await page.locator('[data-agency-link]').all())
    await expect(link).toHaveAttribute('href', '/contact/?ref=L-TEST');
  await page.waitForFunction(() =>
    ['live', 'fallback'].includes(document.documentElement.dataset.three || ''),
  );
  await expect(page.locator('#name-dialog')).not.toBeVisible();

  await page.locator('.hero [data-order]').click();
  await expect(page.locator('#build-title')).toBeFocused();
  for (const fruit of ['mango', 'mango', 'spinach', 'ginger'])
    await page.locator(`[data-fruit="${fruit}"]`).click();
  // A full cup refuses more fruit but stays focusable (aria-disabled).
  await expect(page.locator('[data-fruit="banana"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-fruit="banana"]').click({ force: true });
  await expect(page.locator('[data-fruit-count]')).toHaveText('· 4 of 4, cup’s full');
  await expect(page.locator('[data-fruit="mango"] .badge')).toHaveText('×2');
  await expect(page.locator('[data-builder-status]')).toContainText('full');
  await page.locator('[data-undo]').click();
  await expect(page.locator('[data-fruit-count]')).toHaveText('· 3 of 4');
  await expect(page.locator('[data-cup-name]')).toHaveText('The Sunset Swamp');
  await page.locator('[data-blend]').click();
  await expect(page.locator('[data-to-collect]')).toBeFocused({ timeout: 5000 });
  await page.locator('[data-to-collect]').click();
  await expect(page.locator('#collect-title')).toBeFocused();
  await page.locator('label', { hasText: 'Lunch, 12:30' }).click();
  await page.locator('[data-times] button[type=submit]').click();
  const ticket = page.locator('[data-ticket]');
  await expect(ticket).toBeVisible();
  await expect(ticket).toContainText("Jay's Juice & Co");
  await expect(ticket).toContainText('The Sunset Swamp');
  await expect(ticket).toContainText('Lunch, 12:30');
  await expect(ticket).toContainText('Demo: nothing is ordered or paid.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(requests.filter((r) => /Jay|Kirkcaldy|07526|L-TEST/.test(r))).toEqual([]);
  expect(errors).toEqual([]);
});

test('every order button opens the same builder', async ({ page }) => {
  await page.goto(route + '?name=Order%20Test');
  const count = await page.locator('[data-order]').count();
  expect(count).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < count; i++) {
    const button = page.locator('[data-order]').nth(i);
    if (!(await button.isVisible())) continue;
    await page.evaluate(() => scrollTo(0, 0));
    await button.click();
    await expect(page.locator('#build-title')).toBeFocused();
    await expect(page.locator('[data-builder]')).toBeInViewport({ ratio: 0.3 });
  }
});

test('the builder works by keyboard alone', async ({ page }) => {
  await page.goto(route + '?name=Key%20Test#build');
  await page.locator('[data-fruit="strawberry"]').focus();
  await page.keyboard.press('Enter');
  // WebKit skips buttons when tabbing by default, so move focus directly.
  await page.locator('[data-fruit="banana"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-builder-status]')).toHaveText('Banana added. 2 of 4.');
  await page.locator('input[name="base"]:checked').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('input[value="Orange juice"]')).toBeChecked();
  await page.locator('[data-blend]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-to-collect]')).toBeFocused({ timeout: 5000 });
  await expect(page.locator('[data-cup-name]')).toHaveText('The Pink Hug');
});

for (const kind of ['reduced-motion', 'no-javascript'] as const) {
  test('fallback keeps the page complete: ' + kind, async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: kind === 'reduced-motion' ? 'reduce' : 'no-preference',
      javaScriptEnabled: kind !== 'no-javascript',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(route + '?name=Fallback%20Test');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hero .poster')).toBeVisible();
    await expect(page.locator('.drinks li')).toHaveCount(6);
    await expect(page.locator('.loader')).toBeHidden();
    if (kind === 'reduced-motion') {
      await expect(page.locator('html')).toHaveAttribute('data-three', 'static');
      await expect(page.locator('.stage canvas')).toHaveCount(0);
      await page.locator('[data-fruit="pineapple"]').click();
      await expect(page.locator('#build [data-flat-layers] rect')).toHaveCount(2);
    }
    // Measured from the layout, so it also works with JavaScript disabled.
    const box = await page.locator('main').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    if (kind === 'reduced-motion')
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await context.close();
  });
}

test('loader plays once per session and can be skipped', async ({ page }) => {
  await page.goto(route + '?name=Loader%20Test');
  const loader = page.locator('.loader');
  if ((await page.locator('html').getAttribute('data-loader')) === 'on') {
    await page.locator('[data-loader-skip]').click();
  }
  await expect(loader).toBeHidden({ timeout: 2000 });
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-loader', 'on');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('the shared name dialog never opens by itself', async ({ page }) => {
  await page.goto(route);
  await page.waitForTimeout(1600);
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 400);
  await page.waitForTimeout(7000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.locator('[data-edit]').click();
  await expect(page.locator('#name-dialog')).toBeVisible();
});
