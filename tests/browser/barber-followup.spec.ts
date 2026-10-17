import { test, expect } from '@playwright/test';
import { barberDemo as copy } from '../../src/content/barber-demo';
const route = '/templates/website/motion/barber-01/';
const john = '?name=John%20Barber&area=London';

for (const width of [320, 375, 390, 768, 1440]) {
  test(`prospect layout and personalisation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    for (const query of [
      '',
      john,
      john + '&phone=%2B44%201382%20000000',
      '?name=' + encodeURIComponent("Jay's Cuts & Co"),
      '?name=' + 'A'.repeat(100),
      '?name=' +
        encodeURIComponent(
          'A very long barbershop name with ordinary word boundaries '.repeat(2).slice(0, 100),
        ),
      '?name=' + encodeURIComponent('<img src=x onerror=alert(1)>'),
    ]) {
      await page.goto(route + query);
      const name = new URLSearchParams(query).get('name') || copy.defaultName;
      await expect(page.locator('.hero-business [data-business]')).toHaveText(name);
      await expect(page.locator('.footer-brand [data-business]')).toHaveText(name);
      await expect(page.locator('[data-business] img')).toHaveCount(0);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://fintaxtech.co.uk' + route,
      );
      await expect(page.locator('meta[name=robots]')).toHaveAttribute(
        'content',
        'noindex,nofollow',
      );
      if (query.includes('area='))
        await expect(page.locator('.hero-business')).toHaveText('John Barber · London');
      if (query.includes('phone=')) {
        await expect(page.locator('[data-phone-text]')).toHaveText('+44 1382 000000');
        await expect(page.locator('[data-call]').first()).toHaveAttribute(
          'href',
          'tel:+441382000000',
        );
        await expect(page.locator('[data-whatsapp]')).toHaveAttribute(
          'href',
          'https://wa.me/441382000000',
        );
      } else await expect(page.locator('[data-phone-text]')).toHaveText(copy.phonePlaceholder);
      await expect(
        page.getByText(/Add a business phone|Use international format|Map preview only/),
      ).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const footer = await page.locator('.footer-brand [data-business]').boundingBox();
      expect(footer!.width).toBeGreaterThan(100);
      if (name === 'John Barber') {
        expect(footer!.height).toBeLessThan(25);
        if (width === 390) {
          const hero = await page.locator('.hero-business').boundingBox();
          const cta = await page.locator('.hero-copy > .button').boundingBox();
          expect(hero!.y).toBeGreaterThan(0);
          expect(cta!.y + cta!.height).toBeLessThan(844 - 80);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`ritual boundaries at ${width}px, ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion });
      await page.goto(route + john);
      const bounds = await page.locator('#ritual').boundingBox();
      // Sample the whole scroll-driven progress range, including both extremes.
      for (let step = 0; step <= 10; step++) {
        await page.evaluate(
          (y) => window.scrollTo({ top: y, behavior: 'instant' }),
          bounds!.y - 844 + ((bounds!.height + 844) * step) / 10,
        );
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        if (width < 768) {
          const stage = await page.locator('.razor-stage').boundingBox();
          const list = await page.locator('.ritual-steps').boundingBox();
          expect(stage!.y + stage!.height).toBeLessThanOrEqual(list!.y);
          if (reducedMotion === 'no-preference')
            await expect(page.locator('.razor-stage')).toHaveCSS('overflow', 'hidden');
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
      if (reducedMotion === 'reduce') {
        await expect(page.locator('.ritual-steps')).toBeVisible();
        await expect(page.locator('.ritual-steps li')).toHaveCount(3);
        await expect(page.locator('.razor-blade')).toHaveCSS('transform', 'none');
      }
    });
  }
}

test('booking ends with a personalised contact link; review cards contain no invented quotes', async ({
  page,
}) => {
  await page.goto(route + john);
  await expect(page.locator('.reviews-grid blockquote')).toHaveCount(0);
  await expect(page.locator('.review-placeholder')).toHaveCount(3);
  for (const card of await page.locator('.review-placeholder').all())
    await expect(card).toHaveText(copy.reviewPlaceholder);
  await page.locator('[data-service]').first().click();
  await page.getByRole('button', { name: 'See the next step' }).click();
  await page.getByLabel(copy.day, { exact: true }).selectOption('Tuesday');
  await page.getByLabel(copy.time, { exact: true }).selectOption('11:30');
  await page.getByRole('button', { name: copy.continueBooking }).click();
  await expect(page.locator('#booking-result')).toHaveText(copy.confirmation);
  const offer = page.getByRole('link', { name: 'Want this for John Barber? Talk to FinTaxTech' });
  await expect(offer).toHaveAttribute('href', '/contact/');
  await expect(page.getByRole('button', { name: copy.restart })).toBeVisible();
  await offer.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/contact/');
  await expect(page.locator('#contact-form')).toBeVisible();
});

test('phone review screenshots', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One set of review screenshots.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route + john);
  await page.screenshot({ path: testInfo.outputPath('hero.png') });
  await page.locator('#ritual').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('ritual.png') });
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('lookbook.png') });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('footer.png') });
  await page.locator('.mobile-actions button').click();
  await page.getByRole('button', { name: 'See the next step' }).click();
  await page.getByRole('button', { name: copy.continueBooking }).click();
  await page.screenshot({ path: testInfo.outputPath('booking-final.png') });
});
