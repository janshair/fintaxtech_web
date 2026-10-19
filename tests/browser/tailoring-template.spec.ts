import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { tailoringDemo as c } from '../../src/content/tailoring-demo';
import { motionGallery, motionTemplates } from '../../src/content/templates';
const named = '?name=Test%20Business&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER02';

for (const template of motionTemplates) {
  test(`${template.id}: gallery discovery, metadata, assets and noindex`, async ({
    page,
    request,
  }) => {
    await page.goto(motionGallery.route);
    await expect(page.locator('.template-card')).toHaveCount(motionTemplates.length);
    const link = page.getByRole('link', {
      name: `${motionGallery.previewLabel} ${template.name}`,
      exact: true,
    });
    await link.focus();
    await link.press('Enter');
    await expect(page).toHaveURL(template.route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk${template.route}`,
    );
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
    for (const file of ['styles.css', 'app.js', 'preview.webp'])
      expect((await request.get(template.route + file)).status()).toBe(200);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain(`<loc>https://fintaxtech.co.uk${motionGallery.route}</loc>`);
    expect(sitemap).not.toContain(template.route);
  });
}

for (const width of [320, 390, 768, 1440]) {
  test(`tailoring preview at ${width}px: name safety, first screen and overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const requests: import('@playwright/test').Request[] = [];
    page.on('request', (req) => requests.push(req));
    for (const value of [
      'Test Business',
      "Jay's Cuts & Co",
      'A'.repeat(100),
      '<img src=x onerror=alert(1)>',
      'The',
      '   ',
    ]) {
      await page.goto(
        c.route +
          '?' +
          new URLSearchParams({
            name: value,
            area: 'Broughty Ferry',
            phone: '01382 000000',
            ref: 'LETTER02',
          }),
      );
      await expect(page.locator('#name-dialog')).not.toBeVisible();
      for (const element of await page.locator('[data-business]').all())
        await expect(element).toHaveText(value.trim() || c.name);
      await expect(page).toHaveTitle((value.trim() || c.name) + c.titleSuffix);
      await expect(page.locator('[data-business] img')).toHaveCount(0);
      await expect(page.locator('[data-phone-text]')).toHaveText('+44 1382 000000');
      await expect(page.locator('[data-call]').first()).toHaveAttribute(
        'href',
        'tel:+441382000000',
      );
      await expect(page.locator('[data-whatsapp]')).toHaveAttribute(
        'href',
        'https://wa.me/441382000000',
      );
      await expect(page.locator('.hero-identity')).toContainText('Broughty Ferry');
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://fintaxtech.co.uk' + c.route,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const footerName = (await page.locator('footer [data-business]').boundingBox())!;
      expect(footerName.width).toBeGreaterThan(value === 'The' ? 20 : 90);
      if (value === 'The') expect(footerName.height).toBeLessThan(40);
      if (value === 'Test Business') {
        await expect(page.locator('[data-monogram]').first()).toHaveText('TB');
        if (width === 390) {
          const button = await page.locator('.hero-copy [data-book]').boundingBox();
          const identity = await page.locator('.hero-identity').boundingBox();
          expect(identity!.y).toBeGreaterThan(0);
          expect(button!.y + button!.height).toBeLessThan(844 - 75);
        }
      }
      if (value === 'The') await expect(page.locator('[data-monogram]').first()).toHaveText('T');
    }
    expect(errors).toEqual([]);
    for (const req of requests) {
      if (!req.isNavigationRequest()) {
        expect(req.url()).not.toMatch(/Test%20Business|Broughty|01382|LETTER02|Jay/);
        expect(req.postData()).toBeNull();
        expect(await req.headerValue('referer')).toBeNull();
      }
      expect(new URL(req.url()).origin).toBe('http://localhost:4323');
    }
    expect(
      await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
    ).toEqual([[], []]);
  });
}

test('missing/invalid parameters, delayed dialog, editing and history restoration', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(c.route + '?ref=LETTER02');
  await expect(page.locator('.hero-identity [data-business]')).toHaveText(c.name);
  await page.clock.fastForward(4900);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.clock.fastForward(200);
  await expect(page.locator('#name-dialog')).toBeVisible();
  await expect(page.getByLabel(c.nameDialog.label, { exact: true })).toBeFocused();
  await page.getByLabel(c.nameDialog.label, { exact: true }).fill("Jay's Cuts & Co");
  await page.getByRole('button', { name: c.nameDialog.submit }).click();
  expect(new URL(page.url()).searchParams.get('name')).toBe("Jay's Cuts & Co");
  expect(new URL(page.url()).searchParams.get('ref')).toBe('LETTER02');
  await page.clock.fastForward(10000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: c.edit }).click();
  await page.getByRole('button', { name: c.nameDialog.reset }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  await page.clock.fastForward(6000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.goto(c.route + '?name=Alpha&area=London');
  await page.goto(c.route + '?name=Beta&area=Dundee');
  await page.goBack();
  await expect(page.locator('.hero-identity')).toHaveText('Alpha · London');
  await page.goForward();
  await expect(page.locator('.hero-identity')).toHaveText('Beta · Dundee');
  await page.goto(c.route + '?name=%20%20&area=%20&phone=javascript:alert(1)&ref=bad%40ref');
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await expect(page.locator('[data-hero-area]')).not.toBeVisible();
  await expect(page.locator('[data-call]').first()).toHaveAttribute('href', '#contact-details');
  await expect(page.locator('[data-whatsapp]')).toHaveAttribute('href', '#contact-details');
  await expect(page.locator('.agency-contact').first()).toHaveAttribute(
    'href',
    'http://localhost:4323/contact/',
  );
  await expect(page.locator('#name-dialog')).not.toBeVisible();
});

test('first user scroll prompts once, keyboard closes and returns focus', async ({ page }) => {
  await page.goto(c.route);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.mouse.wheel(0, 180);
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.mouse.wheel(0, 180);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: c.edit }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: c.edit })).toBeFocused();
});

test('all services complete the fitting journey without a request, then lead to the agency', async ({
  page,
}) => {
  await page.goto(c.route + named);
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  for (const service of c.services.items) {
    const link = page.locator(`[data-service=${service.code}]`);
    await link.click();
    await expect(page.locator('#booking-service')).toHaveValue(service.code);
    await page.getByRole('button', { name: c.booking.next + ' ↗', exact: true }).click();
    await expect(page.locator('#slot-form h3')).toBeFocused();
    await page.getByLabel(c.booking.dayLabel).selectOption('Saturday');
    await page.getByLabel(c.booking.timeLabel).selectOption('14:00');
    await page.getByRole('button', { name: c.booking.confirm + ' ↗', exact: true }).click();
    await expect(page.locator('#booking-final h3')).toBeFocused();
    await expect(page.locator('.demo-result')).toHaveText(c.booking.final);
    await expect(page.locator('#booking-summary')).toHaveText(`${service.name} · Saturday · 14:00`);
    await expect(page.locator('.final-offer')).toHaveText(
      'Want this for Test Business? Talk to FinTaxTech',
    );
    await page.getByRole('button', { name: c.booking.restart }).click();
    await expect(page.locator('#booking-service')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(link).toBeFocused();
  }
  expect(requests).toEqual([]);
  await expect(page.locator('.agency-contact').first()).toHaveAttribute(
    'href',
    'http://localhost:4323/contact/?ref=LETTER02',
  );
  await page.locator('.agency-contact').first().click();
  await expect(page).toHaveURL('/contact/?ref=LETTER02');
});

for (const width of [390, 1440])
  test(`scroll-driven stitching and live reduced-motion switch at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(c.route + named);
    const box = await page.locator('#process').boundingBox();
    if (width < 768) expect(box!.height).toBeLessThan(844 * 1.1);
    // Enter the measured/pinned phase before comparing it with the sewn phase.
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      width < 768 ? box!.y - 422 : box!.y,
    );
    await expect
      .poll(() => page.locator('html').evaluate((node) => node.style.getPropertyValue('--stitch')))
      .toBe('0');
    const start = await page.locator('.needle').getAttribute('transform');
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      box!.y + box!.height - 844,
    );
    await expect.poll(() => page.locator('.needle').getAttribute('transform')).not.toBe(start);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('html')).not.toHaveClass(/motion-ready/);
    await expect(page.locator('.steps li')).toHaveCount(3);
    const end = await page.locator('.needle').getAttribute('transform');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator('.needle')).toHaveAttribute('transform', end!);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('html')).toHaveClass(/motion-ready/);
  });

test('mobile accessibility, menu and static no-JavaScript content', async ({ page, browser }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(c.route + named);
  await page.getByRole('button', { name: c.menu, exact: false }).click();
  await expect(page.locator('#navigation')).toBeVisible();
  await page.locator('#navigation a').first().click();
  await expect(page.locator('#navigation')).not.toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://localhost:4323' + c.route);
  await expect(staticPage.locator('.hero-identity')).toHaveText(c.name);
  for (const [title, body] of c.process.steps) {
    await expect(staticPage.locator('.steps')).toContainText(title);
    await expect(staticPage.locator('.steps')).toContainText(body);
  }
  await expect(staticPage.locator('.no-script')).toBeVisible();
  await expect(staticPage.locator('.no-script')).toContainText(c.noScript);
  await expect(staticPage.locator('#seam-path')).toHaveCSS('stroke-dasharray', 'none');
  await context.close();
});
