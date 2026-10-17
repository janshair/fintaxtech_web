import { test, expect } from '@playwright/test';
import { barberDemo as copy } from '../../src/content/barber-demo';
const route = '/templates/website/motion/barber-01/';

for (const width of [375, 768, 1440]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`sales preview at ${width}px with ${reducedMotion}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      const external: string[] = [];
      page.on('request', (r) => {
        if (new URL(r.url()).origin !== 'http://localhost:4323') external.push(r.url());
      });
      for (const name of [null, 'Geej Barber', "Jay's Cuts & Co", 'A'.repeat(100)]) {
        await page.goto(
          route +
            (name
              ? '?' +
                new URLSearchParams({
                  name,
                  area: 'Broughty Ferry',
                  phone: '+447700900123',
                  ref: 'DEMO01',
                })
              : ''),
        );
        await expect(page.locator('#name-dialog')).not.toBeVisible();
        await expect(page.locator('[data-business]').first()).toHaveText(name || copy.defaultName);
        if (name) {
          await expect(page).toHaveTitle(name + copy.client.titleSuffix);
          await expect(page.locator('[data-area]').first()).toHaveText('Broughty Ferry');
          await expect(page.locator('[data-call]').first()).toHaveAttribute(
            'href',
            'tel:+447700900123',
          );
          await expect(page.locator('[data-whatsapp]')).toHaveAttribute(
            'href',
            'https://wa.me/447700900123',
          );
        } else {
          await expect(page.locator('[data-call]').first()).toHaveAttribute(
            'href',
            '#contact-details',
          );
          await expect(page.locator('[data-area]').first()).toHaveText('Your address here');
          // First scroll prompts once, then the default design remains usable.
          await page.mouse.wheel(0, 120);
          await expect(page.locator('#name-dialog')).toBeVisible();
          await page.getByRole('button', { name: 'Explore the sample first' }).click();
        }
        await page.locator('#ritual').scrollIntoViewIfNeeded();
        await expect(page.locator('#name-dialog')).not.toBeVisible();
        if (reducedMotion === 'reduce' || width < 768) {
          await expect(page.locator('.ritual-steps')).toBeVisible();
          await expect(page.locator('.ritual-steps li')).toHaveCount(3);
        }
        if (reducedMotion === 'reduce')
          await expect(page.locator('.pole-stripes')).toHaveCSS('animation-name', 'none');
        if (width < 768)
          expect((await page.locator('#ritual').boundingBox())!.height).toBeLessThan(1000);
        await page.locator('#gallery').scrollIntoViewIfNeeded();
        await expect(page.locator('.cuts-grid figure')).toHaveCount(6);
        await expect(page.getByText(copy.reviewNote, { exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (width < 768) {
          await expect(page.locator('.mobile-actions')).toBeVisible();
          await page.locator('.mobile-actions button').click();
          await expect(page.locator('#booking-dialog')).toBeVisible();
          await page
            .locator('#booking-dialog')
            .getByRole('button', { name: 'Close', exact: true })
            .click();
        }
        expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
        expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
        if (name === 'Geej Barber' && testInfo.project.name === 'chromium') {
          await page.screenshot({
            path: testInfo.outputPath(`barber-${width}-${reducedMotion}.png`),
            fullPage: true,
          });
        }
      }
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    });
  }
}

test('timed prompt appears once; manual naming makes a safe shareable URL', async ({ page }) => {
  await page.clock.install();
  await page.goto(route + '?ref=TEST#home');
  await page.clock.fastForward(4900);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.clock.fastForward(200);
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Business name', { exact: true }).fill("  Jay's Cuts & Co  ");
  await page.getByRole('button', { name: 'Preview my website' }).click();
  const url = new URL(page.url());
  expect(url.searchParams.get('name')).toBe("Jay's Cuts & Co");
  expect(url.searchParams.get('ref')).toBe('TEST');
  expect(url.hash).toBe('#home');
  await expect(page.locator('[data-monogram]').first()).toHaveText('J / C');
  await page.clock.fastForward(10000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.reload();
  await page.clock.fastForward(6000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await expect(page.locator('[data-business]').first()).toHaveText("Jay's Cuts & Co");
});

test('URL text is capped, inert and never used as a contact URL scheme', async ({ page }) => {
  for (const name of [
    '  Geej Barber  ',
    'Geej',
    '<img src=x onerror=alert(1)>',
    'N'.repeat(150),
    '',
  ]) {
    await page.goto(
      route +
        '?' +
        new URLSearchParams({ name, area: '<svg onload=alert(1)>', phone: 'javascript:alert(1)' }),
    );
    await expect(page.locator('[data-business]').first()).toHaveText(
      name.trim().slice(0, 100) || copy.defaultName,
    );
    await expect(page.locator('[data-business] img, [data-area] svg')).toHaveCount(0);
    await expect(page.locator('[data-call]').first()).toHaveAttribute('href', '#contact-details');
    await expect(page.locator('[data-whatsapp]')).toHaveAttribute('href', '#contact-details');
    await expect(page.locator('[data-directions]')).toHaveAttribute(
      'href',
      /^https:\/\/www.google.com\/maps\/search\/\?api=1&query=/,
    );
    if (name === 'Geej') await expect(page.locator('[data-monogram]').first()).toHaveText('G');
    if (!name) await expect(page.locator('[data-monogram]').first()).toHaveText('B / S');
  }
});

test('every service opens its booking flow and completes without a request', async ({ page }) => {
  await page.goto(route + '?name=Geej%20Barber');
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  for (const service of await page.locator('[data-service]').all()) {
    const name = await service.getAttribute('data-service');
    await service.click();
    await expect(page.locator('#booking-service')).toHaveValue(name!);
    await page.getByRole('button', { name: 'See the next step' }).click();
    await page.getByLabel('Sample day').selectOption('Tuesday');
    await page.getByLabel('Sample time').selectOption('14:00');
    await page.getByRole('button', { name: 'Preview confirmation' }).click();
    await expect(page.locator('#booking-confirmation h3')).toBeFocused();
    await expect(page.locator('#booking-result')).toHaveText(copy.confirmation);
    await expect(page.locator('#booking-summary')).toHaveText(`${name} · Tuesday · 14:00`);
    await page.getByRole('button', { name: 'Try another booking' }).click();
    await expect(page.locator('#booking-service')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(service).toBeFocused();
  }
  expect(requests).toEqual([]);
});

test('all ritual steps and demo labels are present without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://localhost:4323' + route);
  for (const [title, description] of copy.ritual) {
    await expect(page.locator('.ritual-steps')).toContainText(title);
    await expect(page.locator('.ritual-steps')).toContainText(description);
  }
  await expect(page.getByText(copy.reviewNote, { exact: true })).toBeVisible();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await context.close();
});
