import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cleaningDemo as c } from '../../src/content/cleaning-demo';
const route = c.route;
const personalised = `${route}?name=Test%20Business&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER04`;

test('link values apply before first paint, stay local, and metadata remains canonical', async ({
  page,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    if (request.resourceType() !== 'document') requests.push(request.url());
  });
  await page.addInitScript(() => {
    // Observe the actual identity at the browser's first rendering opportunity.
    new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => entry.name === 'first-contentful-paint')) {
        (window as any).identityAtPaint = document.querySelector('[data-business]')?.textContent;
      }
    }).observe({ type: 'paint', buffered: true });
  });
  await page.goto(personalised);
  await expect
    .poll(() => page.evaluate(() => (window as any).identityAtPaint))
    .toBe('Test Business');
  for (const node of await page.locator('[data-business]').all())
    await expect(node).toHaveText('Test Business');
  await expect(page.locator('[data-monogram]').first()).toHaveText('TB');
  await expect(page.locator('[data-hero-area]')).toHaveText('Broughty Ferry');
  await expect(page.locator('[data-phone]').first()).toHaveText('01382 000000');
  await expect(page).toHaveTitle('Test Business' + c.titleSuffix);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://fintaxtech.co.uk${route}`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://fintaxtech.co.uk${route}`,
  );
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('h1')).toHaveCount(1);
  const enquiry = page.locator('[data-agency-link]').first();
  expect(new URL((await enquiry.getAttribute('href'))!).searchParams.get('ref')).toBe('LETTER04');
  expect(await page.locator('body').innerText()).not.toContain('LETTER04');
  await page.waitForTimeout(5100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  for (const kind of ['call', 'message', 'directions']) {
    const button = page.locator(`#visit [data-contact=${kind}]`);
    await button.click();
    await expect(page.locator('#contact-dialog')).toBeVisible();
    await expect(page.locator('.contact-preview-value')).toHaveText(
      kind === 'directions' ? 'Broughty Ferry' : '01382 000000',
    );
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  }
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
  expect(requests.filter((url) => /Test|Business|Broughty|01382|LETTER04/i.test(url))).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

for (const name of [
  "Jay's Cuts & Co",
  'A'.repeat(100),
  '<img src=x onerror=alert(1)>',
  '清潔な家 Dundee',
  'A'.repeat(101),
]) {
  test(`safe text personalisation: ${name.slice(0, 30)} (${name.length})`, async ({ page }) => {
    await page.goto(`${route}?name=${encodeURIComponent(name)}`);
    await expect(page.locator('[data-business]').first()).toHaveText(
      Array.from(name).slice(0, 100).join(''),
    );
    await expect(page.locator('[data-business] img')).toHaveCount(0);
    await expect(page.locator('#name-dialog')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('blank and invalid values fall back; delayed offer occurs once, edits and restore retain URL context', async ({
  page,
}) => {
  await page.goto(`${route}?name=%20%20&area=%20&phone=invalid&ref=bad%20code`);
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await expect(page.locator('[data-phone]').first()).toHaveText('Your number here');
  await expect(page.locator('[data-area]').first()).toHaveText('Dundee & Tayside');
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await expect(page.locator('#name-dialog')).toBeVisible({ timeout: 6500 });
  await expect(page.getByLabel('Business name', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.goto(`${route}?area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER04`);
  await page.evaluate(() => scrollTo(0, 250));
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Business name', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Business name', { exact: true }).fill("Jay's Cleaning & Co");
  await page.getByRole('button', { name: 'Preview my website' }).click();
  expect(new URL(page.url()).searchParams.get('name')).toBe("Jay's Cleaning & Co");
  for (const [key, value] of [
    ['area', 'Broughty Ferry'],
    ['phone', '01382 000000'],
    ['ref', 'LETTER04'],
  ])
    expect(new URL(page.url()).searchParams.get(key)).toBe(value);
  await page.reload();
  await expect(page.locator('[data-business]').first()).toHaveText("Jay's Cleaning & Co");
  await page.locator('[data-edit]').click();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  expect(new URL(page.url()).searchParams.get('ref')).toBe('LETTER04');
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await expect(page.locator('[data-edit]')).toBeFocused();
  await page.evaluate(() => {
    history.pushState(null, '', '?name=History%20Cleaning');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('[data-business]').first()).toHaveText('History Cleaning');
  await page.goBack();
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await page.goForward();
  await expect(page.locator('[data-business]').first()).toHaveText('History Cleaning');
});

for (const width of [320, 390, 768, 1440]) {
  test(`complete quote, accessible layout, scroll and reduced motion at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(personalised);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390) {
      const hero = await page.locator('.hero .button').boundingBox();
      expect(hero!.y + hero!.height).toBeLessThan(760);
      const brand = await page.locator('.business-header .brand').boundingBox();
      expect(brand!.y).toBeLessThan(200);
    }
    for (const item of c.services) {
      const trigger = page.locator(`[data-service=${item.id}]`);
      await trigger.click();
      await expect(page.locator('#quote-service')).toHaveValue(item.id);
      await page.getByRole('button', { name: 'Next: your space' }).click();
      await expect(page.locator('#space-form h3')).toBeFocused();
      await page.locator('#quote-size').selectOption('3–4 rooms');
      await page.locator('#quote-frequency').selectOption('Weekly');
      await page.getByRole('button', { name: 'See quote preview' }).click();
      await expect(page.locator('#quote-final')).toContainText('Demo only, nothing is sent.');
      await expect(page.locator('#quote-summary')).toHaveText(`${item.name} · 3–4 rooms · Weekly`);
      await page.getByRole('button', { name: 'Try another clean' }).click();
      await expect(page.locator('#service-form')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
    for (const link of await page.locator('[data-quote]').all()) {
      if (!(await link.isVisible())) continue;
      await link.click();
      await expect(page.locator('#quote-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(link).toBeFocused();
    }
    await page.locator('[data-edit]').click();
    await page.locator('#name-dialog [data-close]').click();
    await expect(page.locator('[data-edit]')).toBeFocused();
    const stage = page.locator('.motion-stage');
    const stageTop = await stage.evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await page.evaluate(
      (y) => scrollTo({ top: y - innerHeight * 0.9, behavior: 'instant' }),
      stageTop,
    );
    await expect
      .poll(() =>
        stage.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue('--clean'))),
      )
      .toBeLessThan(0.1);
    const before = await page
      .locator('.cleaning-wand')
      .evaluate((node) => getComputedStyle(node).transform);
    await page.evaluate(
      (y) => scrollTo({ top: y - innerHeight * 0.3, behavior: 'instant' }),
      stageTop,
    );
    await expect
      .poll(() =>
        stage.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue('--clean'))),
      )
      .toBeGreaterThan(0.7);
    const after = await page
      .locator('.cleaning-wand')
      .evaluate((node) => getComputedStyle(node).transform);
    expect(before).not.toBe(after);
    if (width < 768) expect((await stage.boundingBox())!.height).toBeLessThan(844);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect
      .poll(() =>
        stage.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue('--clean'))),
      )
      .toBe(1);
    await expect(page.locator('.cleaning-wand')).toHaveCSS('display', 'none');
    await expect(page.locator('.dust-layer')).toHaveCSS('display', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.cleaning-wand')).not.toHaveCSS('display', 'none');
    for (const details of await page.locator('details').all()) {
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (info.project.name === 'chromium')
      await page.screenshot({ path: info.outputPath(`cleaning-${width}.png`) });
  });
}

test('page content and finished reduced-motion graphic remain usable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.process-steps li')).toHaveCount(3);
  await expect(page.locator('noscript a')).toHaveAttribute('href', '/contact/');
  await expect(page.locator('.dust-layer')).toHaveCSS('display', 'none');
  await context.close();
});

test('large sparkles zoom in and out around every picture while artwork stays still', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(personalised);
  await expect(page.getByRole('button', { name: 'Pause motion', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-sparkle-picture]')).toHaveCount(5);
  await expect(page.locator('.loop-leaves, .loop-light, .loop-glint, .loop-drop')).toHaveCount(0);
  for (const picture of await page.locator('[data-sparkle-picture]').all()) {
    await picture.scrollIntoViewIfNeeded();
    await expect(picture.locator('.picture-sparkle')).toHaveCount(5);
    const star = picture.locator('.picture-sparkle').first();
    await expect
      .poll(() =>
        star.evaluate((node) =>
          node
            .getAnimations()
            .some(
              (a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity,
            ),
        ),
      )
      .toBe(true);
    const widths = await star.evaluate((node) => {
      const animation = node.getAnimations()[0];
      const duration = Number(animation.effect!.getTiming().duration);
      animation.pause();
      const widths = [0, duration / 2, duration].map((time) => {
        animation.currentTime = time;
        return node.getBoundingClientRect().width;
      });
      animation.play();
      return widths;
    });
    expect(widths[1]).toBeGreaterThan(widths[0] * 3);
    expect(widths[2]).toBeCloseTo(widths[0], 1);
    const room = picture.locator('.room-art');
    if (await room.count())
      expect(await room.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const star of await page.locator('.picture-sparkle').all())
    await expect(star).toHaveCSS('animation-name', 'none');
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect
    .poll(() =>
      page
        .locator('.picture-sparkle')
        .first()
        .evaluate((node) => node.getAnimations().some((a) => a.playState === 'running')),
    )
    .toBe(true);
  if (testInfo.project.name === 'chromium') {
    // Keep a real default-name capture available for the gallery thumbnail.
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(route);
    await expect(page.locator('[data-business]').first()).toHaveText(c.name);
    await expect(page.locator('#name-dialog')).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('cleaning-default.png') });
  }
});
