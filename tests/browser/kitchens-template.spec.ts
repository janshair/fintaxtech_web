import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route = '/templates/website/3d/kitchens-13/';
const letter = route + '?name=Test%20Business&area=Leeds&phone=07526%20699217&ref=K-TEST';

test('letter: name everywhere, privacy, designer to visit card on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => {
    if (r.resourceType() !== 'document') requests.push(r.url() + ' ' + (r.headers().referer || ''));
  });
  await page.goto(letter);
  await expect(page).toHaveTitle('Test Business — Kitchen and bathroom website demo by FinTaxTech');
  await expect(page.locator('.bar [data-business]')).toHaveText('Test Business');
  await expect(page.locator('.kicker [data-area]')).toHaveText('Leeds');
  await expect(page.locator('[data-call]')).toHaveAttribute('href', 'tel:+447526699217');
  await page.waitForFunction(() =>
    ['live', 'fallback'].includes(document.documentElement.dataset.three || ''),
  );
  await page.locator('.hero [data-order]').click();
  await expect(page.locator('#design-title')).toBeFocused();
  await page.locator('label', { hasText: 'Bathroom' }).click();
  await page.locator('input[name="door"][value="cobalt"]').check({ force: true });
  await page.locator('input[name="top"][value="terrazzo"]').check({ force: true });
  await expect(page.locator('[data-room-name]')).toHaveText('Your bathroom so far');
  await expect(page.locator('[data-spec-summary]')).toContainText('Cobalt shaker doors · Terrazzo');
  await expect(page.locator('[data-builder-status]')).toHaveText('Worktop changed to Terrazzo.');
  await page.locator('[data-undo]').click();
  await expect(page.locator('input[name="top"][value="oak"]')).toBeChecked();
  await expect(page.locator('[data-builder-status]')).toContainText('Undone.');
  await page.locator('.go a[data-wipe]').click();
  await expect(page.locator('#visit-title')).toBeFocused();
  await page.locator('label', { hasText: 'Afternoon' }).click();
  await page.locator('[data-visit] button[type=submit]').click();
  const card = page.locator('[data-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Test Business');
  await expect(card).toContainText('Bathroom');
  await expect(card).toContainText('Cobalt shaker');
  await expect(card).toContainText('afternoon');
  await expect(card).toContainText('Demo: nothing is ordered, booked or paid.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(requests.filter((r) => /Test%20Business|Leeds|07526|K-TEST/.test(r))).toEqual([]);
  expect(errors).toEqual([]);
});

test('every booking button opens the same designer', async ({ page }) => {
  await page.goto(route + '?name=Order%20Test');
  const count = await page.locator('[data-order]').count();
  expect(count).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < count; i++) {
    const button = page.locator('[data-order]').nth(i);
    if (!(await button.isVisible())) continue;
    await page.evaluate(() => scrollTo(0, 0));
    await button.click();
    await expect(page.locator('#design-title')).toBeFocused();
  }
});

test('the designer works by keyboard alone', async ({ page }) => {
  await page.goto(route + '?name=Key%20Test#design');
  await page.locator('input[name="door"]:checked').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('input[name="door"][value="ink"]')).toBeChecked();
  await expect(page.locator('[data-builder-status]')).toHaveText('Doors changed to Ink blue.');
  await page.locator('input[name="handle"]:checked').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-picked="handle"]')).toHaveText('Knob');
  await page.locator('[data-undo]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-picked="handle"]')).toHaveText('Cup');
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
    await expect(page.locator('.style-list li')).toHaveCount(6);
    await expect(page.locator('.loader')).toBeHidden();
    if (kind === 'reduced-motion') {
      await expect(page.locator('html')).toHaveAttribute('data-three', 'static');
      await page.locator('input[name="handle"][value="bar"]').check({ force: true });
      await expect(page.locator('#design [data-elevation]')).toHaveAttribute('data-handle', 'bar');
    }
    const box = await page.locator('main').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    if (kind === 'reduced-motion')
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await context.close();
  });
}

test('juice-bar-05 and kitchens-13 both pass axe on desktop', async ({ page }) => {
  for (const path of ['/templates/website/3d/juice-bar-05/?name=A', route + '?name=A']) {
    await page.goto(path);
    await page.evaluate(() => document.querySelector<HTMLDialogElement>('#name-dialog')!.close());
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});
