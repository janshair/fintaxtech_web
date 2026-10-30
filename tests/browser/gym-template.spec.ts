import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gymDemo as c } from '../../src/content/gym-demo';
const route = c.route;
const personalised = `${route}?name=Test%20Business&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER06`;
const letter = `${route}?name=Jay%27s%20Cuts%20%26%20Co&area=Kirkcaldy&phone=07526%20699217&ref=L-TEST`;
const noBar = 'astro-dev-toolbar{display:none!important}';

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
  for (const node of await page.locator('[data-monogram]').all())
    await expect(node).toHaveText('TB');
  await expect(page.locator('[data-hero-area]')).toHaveText('Broughty Ferry');
  await expect(page.locator('[data-phone]').first()).toHaveText('01382 000000');
  await expect(page.locator('#visit [data-call]')).toHaveAttribute('href', 'tel:+441382000000');
  await expect(page.locator('#visit [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/441382000000',
  );
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
  for (const link of await page.locator('[data-agency-link]').all())
    expect(new URL((await link.getAttribute('href'))!, page.url()).searchParams.get('ref')).toBe(
      'LETTER06',
    );
  expect(await page.locator('body').innerText()).not.toContain('LETTER06');
  for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
    await expect(page.locator(`[data-capture="${hook}"]`)).toHaveCount(1);
  await expect(page.locator('[data-sample-review]')).toHaveCount(3);
  await expect(page.locator('[data-sample-review] .review-tag')).toHaveText(
    Array(3).fill('Example review'),
  );
  expect(await page.locator('[data-sample-price]').count()).toBeGreaterThan(5);
  await page.waitForTimeout(5100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  const directions = page.locator('[data-directions]');
  await directions.click();
  await expect(page.locator('#contact-dialog')).toBeVisible();
  await expect(page.locator('.contact-preview-value')).toHaveText('Broughty Ferry');
  await page.keyboard.press('Escape');
  await expect(directions).toBeFocused();
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
  expect(requests.filter((url) => /Test|Business|Broughty|01382|LETTER06/i.test(url))).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

for (const name of [
  "Jay's Cuts & Co",
  'A'.repeat(100),
  '<img src=x onerror=alert(1)>',
  'ジム Dundee',
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

test('blank and invalid values fall back; delayed offer occurs once, edits and restore keep URL context', async ({
  page,
}) => {
  await page.goto(`${route}?name=%20%20&area=%20&phone=invalid&ref=bad%20code`);
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await expect(page.locator('[data-monogram]').first()).toHaveText(c.monogram);
  await expect(page.locator('[data-phone]').first()).toHaveText('Your number here');
  await expect(page.locator('[data-area]').first()).toHaveText(c.area);
  await expect(page.locator('#visit [data-call]')).toHaveAttribute('href', '#visit');
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await expect(page.locator('#name-dialog')).toBeVisible({ timeout: 6500 });
  await expect(page.getByLabel('Business name', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  // Without a phone, Call explains the preview instead of following a broken tel: link.
  const call = page.locator('#visit [data-call]');
  await call.click();
  await expect(page.locator('#contact-dialog')).toBeVisible();
  await expect(page.locator('.contact-preview-value')).toHaveText('Your number here');
  await page.keyboard.press('Escape');
  await expect(call).toBeFocused();
  await page.goto(`${route}?area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER06`);
  await page.evaluate(() => scrollTo(0, 250));
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Business name', { exact: true }).fill('   ');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('#name-error')).toHaveText(
    'Enter your business name, or explore the sample.',
  );
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Business name', { exact: true }).fill("Jay's Gym & Co");
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('[data-edit]')).toBeFocused();
  expect(new URL(page.url()).searchParams.get('name')).toBe("Jay's Gym & Co");
  await expect(page.locator('[data-monogram]').first()).toHaveText('JG');
  for (const [key, value] of [
    ['area', 'Broughty Ferry'],
    ['phone', '01382 000000'],
    ['ref', 'LETTER06'],
  ])
    expect(new URL(page.url()).searchParams.get(key)).toBe(value);
  await page.reload();
  await expect(page.locator('[data-business]').first()).toHaveText("Jay's Gym & Co");
  await page.locator('[data-edit]').click();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  expect(new URL(page.url()).searchParams.get('ref')).toBe('LETTER06');
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await page.evaluate(() => {
    history.pushState(null, '', '?name=History%20Gym');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('[data-business]').first()).toHaveText('History Gym');
  await page.goBack();
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await page.goForward();
  await expect(page.locator('[data-business]').first()).toHaveText('History Gym');
});

for (const width of [320, 390, 768, 1440]) {
  test(`complete visit flow, timetable, layout, scroll and reduced motion at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(personalised);
    await page.addStyleTag({ content: noBar });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390) {
      const button = await page.locator('.hero .button').boundingBox();
      const bar = await page.locator('.mobile-contact').boundingBox();
      expect(button!.y + button!.height).toBeLessThan(bar!.y);
      await expect(page.locator('.hero-name [data-business]')).toBeInViewport();
      await expect(page.locator('h1')).toBeInViewport();
    }
    for (const item of c.services) {
      const trigger = page.locator(`.service-card[data-service=${item.id}]`);
      await trigger.click();
      await expect(page.locator('#visit-service')).toHaveValue(item.id);
      await page.getByRole('button', { name: 'Next: pick a time' }).click();
      await expect(page.locator('#when-form h3')).toBeFocused();
      await page.getByRole('button', { name: 'See my visit' }).click();
      await expect(page.locator('#visit-final')).toContainText('Demo only, nothing is sent.');
      await expect(page.locator('#visit-summary')).toHaveText(
        `${item.name} · Monday · ${c.flow.times[0][1]} · ${c.flow.levels[0]}`,
      );
      await page.getByRole('button', { name: 'Try another booking' }).click();
      await expect(page.locator('#try-form')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
    for (const link of await page.locator('[data-book], .membership [data-service]').all()) {
      if (!(await link.isVisible())) continue;
      await link.click();
      await expect(page.locator('#visit-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(link).toBeFocused();
    }
    // Timetable days switch, and a class opens the flow with that class preselected.
    await page.locator('[data-day=Thu]').click();
    await expect(page.locator('[data-day=Thu]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#day-Thu')).toBeVisible();
    await expect(page.locator('#day-Mon')).toBeHidden();
    await page.locator('#day-Thu [data-class="Kettlebell basics"]').click();
    await expect(page.locator('#visit-service')).toHaveValue('classes');
    await expect(page.locator('#visit-class')).toHaveText('Taster: Kettlebell basics');
    await page.getByRole('button', { name: 'Next: pick a time' }).click();
    await expect(page.locator('#visit-day')).toHaveValue('Thursday');
    await expect(page.locator('#visit-time')).toHaveValue('evening');
    await page.getByRole('button', { name: 'See my visit' }).click();
    await expect(page.locator('#visit-summary')).toContainText('Kettlebell basics · Thursday');
    const enquiry = page.locator('#visit-final [data-agency-link]');
    await expect(enquiry).toContainText('Want this for Test Business? Talk to FinTaxTech');
    await page.locator('#visit-dialog [data-close]').click();
    await page.locator('[data-edit]').click();
    await page.locator('#name-dialog [data-close]').click();
    await expect(page.locator('[data-edit]')).toBeFocused();
    const stage = page.locator('.motion-stage');
    const progress = () =>
      stage.evaluate((node) =>
        Number((node as HTMLElement).style.getPropertyValue('--lift-progress')),
      );
    const top = await page
      .locator('[data-lift-illustration]')
      .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    const before = await page.locator('.plate-l1').evaluate((n) => getComputedStyle(n).transform);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(1);
    const after = await page.locator('.plate-l1').evaluate((n) => getComputedStyle(n).transform);
    expect(before).not.toBe(after);
    await expect(page.locator('.process-steps li').nth(2)).toHaveClass(/is-current/);
    if (width < 768) expect((await stage.boundingBox())!.height).toBeLessThan(844);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(progress).toBe(1);
    await expect(page.locator('.hero-copy')).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const details of await page.locator('details').all()) {
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
    }
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [...document.querySelectorAll('[data-reveal]')].filter(
              (node) => getComputedStyle(node).opacity !== '1',
            ).length,
        ),
      )
      .toBe(0);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    // Let the step-card colour transition settle before measuring contrast.
    await page.waitForTimeout(600);
    expect(
      (
        await new AxeBuilder({ page })
          .exclude('astro-dev-toolbar')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (info.project.name === 'chromium')
      await page.screenshot({ path: info.outputPath(`gym-${width}.png`) });
  });
}

test('letter link on a 375 × 812 phone: instant hero, continuous scroll, tap-through booking', async ({
  browser,
}, info) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const start = Date.now();
  await page.goto(letter, { waitUntil: 'commit' });
  await page.waitForSelector('.hero .button', { state: 'attached' });
  await page.waitForTimeout(Math.max(0, 300 - (Date.now() - start)));
  await page.screenshot({ path: info.outputPath('letter-300ms.png') });
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.hero-name [data-business]')).toHaveText("Jay's Cuts & Co");
  await expect(page.locator('.hero .button')).toBeVisible();
  const opacity = await page
    .locator('.hero-copy')
    .evaluate((node) => Number(getComputedStyle(node).opacity));
  expect(opacity).toBeGreaterThanOrEqual(0.6);
  await page.waitForLoadState('load');
  await page.addStyleTag({ content: noBar });
  await expect(page.locator('[data-monogram]').first()).toHaveText('JC');
  await expect(page.locator('#visit [data-call]')).toHaveAttribute('href', 'tel:+447526699217');
  await expect(page.locator('.mobile-contact [data-call]')).toHaveAttribute(
    'href',
    'tel:+447526699217',
  );
  await expect(page.locator('#visit [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/447526699217',
  );
  await expect(page.locator('[data-phone]').first()).toHaveText('07526 699217');
  await expect(page.locator('[data-area]').first()).toHaveText('Kirkcaldy');
  for (const link of await page.locator('[data-agency-link]').all())
    expect(new URL((await link.getAttribute('href'))!, page.url()).searchParams.get('ref')).toBe(
      'L-TEST',
    );
  // Step through the motion section with instant scrolls and record progress.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    (window as any).gymMotion.log = [];
  });
  const top = await page
    .locator('[data-lift-illustration]')
    .evaluate((node) => node.getBoundingClientRect().top + scrollY);
  const log: [number, number][] = [];
  for (let y = top - 900, i = 0; y < top + 200; y += 8 + ((i++ * 13) % 33)) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(24);
    log.push([y, await page.evaluate(() => (window as any).gymMotion.progress)]);
  }
  for (let i = 1; i < log.length; i++) expect(log[i][1]).toBeGreaterThanOrEqual(log[i - 1][1]);
  const first = log.find(([, p]) => p > 0)!;
  const last = log.find(([, p]) => p >= 1)!;
  expect(last[0] - first[0]).toBeGreaterThan(480);
  expect(last[0] - first[0]).toBeLessThan(720);
  for (let stage = 0; stage < 3; stage++)
    expect(
      log.filter(([, p]) => p * 3 > stage + 0.1 && p * 3 < stage + 0.9).length,
    ).toBeGreaterThanOrEqual(3);
  info.attachments.push({
    name: 'scroll-progress.json',
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(log)),
  });
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('[data-reveal]')].filter(
            (node) => getComputedStyle(node).opacity !== '1',
          ).length,
      ),
    )
    .toBe(0);
  // Tap straight through the booking flow without typing.
  await page.locator('.mobile-contact [data-book]').click();
  await page.getByRole('button', { name: 'Next: pick a time' }).click();
  await page.getByRole('button', { name: 'See my visit' }).click();
  await expect(page.locator('#visit-final')).toContainText('Demo only, nothing is sent.');
  await expect(page.locator('#visit-final [data-agency-link]')).toContainText(
    "Want this for Jay's Cuts & Co?",
  );
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
  await context.close();
  const offline = await browser.newContext({
    viewport: { width: 375, height: 812 },
    javaScriptEnabled: false,
  });
  const still = await offline.newPage();
  await still.goto(letter);
  await expect(still.locator('h1')).toBeVisible();
  await expect(still.locator('.hero .button')).toBeVisible();
  await expect(still.locator('.process-steps li')).toHaveCount(3);
  await expect(still.locator('.day-panel')).toHaveCount(7);
  await expect(still.locator('#day-Sun')).toBeVisible();
  await expect(still.locator('noscript a')).toHaveAttribute('href', '/contact/');
  await still.screenshot({ path: info.outputPath('letter-no-js.png') });
  await offline.close();
});

test.describe('hero kettlebell motion', () => {
  const hero = `${route}?name=Dundee%20Fitness`;
  const heroAnimations = (page: import('@playwright/test').Page) =>
    page.evaluate(() =>
      document
        .querySelector('.hero-art')!
        .getAnimations({ subtree: true })
        .map((a) => (a.effect!.getTiming().iterations === Infinity ? 'loop' : 'entrance')),
    );

  test('desktop: entrance on load, gentle loop, scroll swing, tap and hidden-tab pause', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(hero);
    await expect.poll(() => page.evaluate(() => (window as any).gymMotion.hero.entered)).toBe(true);
    await expect(page.locator('.kb-mark text')).toHaveText('DF');
    await expect(page.locator('h1')).toHaveCSS('opacity', '1');
    // The entrance settles within 1.4 s, then only the ambient loop runs.
    await expect
      .poll(() => heroAnimations(page), { timeout: 4000 })
      .toEqual(expect.arrayContaining(['loop']));
    expect(await heroAnimations(page)).not.toContain('entrance');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(
      await page.evaluate(() =>
        document
          .querySelector('.hero-art')!
          .getAnimations({ subtree: true })
          .every((a) => a.playState === 'paused'),
      ),
    ).toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // Scroll swing: 0 → about 35° → 0 as the hero leaves, in small steps.
    await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
    const angles: number[] = [];
    for (let y = 0; y <= 700; y += 20) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(24);
      angles.push(await page.evaluate(() => (window as any).gymMotion.hero.angle));
    }
    expect(Math.min(...angles)).toBeLessThan(-33);
    expect(angles.at(-1)).toBeCloseTo(0, 1);
    for (let i = 1; i < angles.length; i++)
      expect(Math.abs(angles[i] - angles[i - 1])).toBeLessThan(6);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const button = page.getByRole('button', { name: 'Play kettlebell animation' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect
      .poll(() => page.locator('.kb-tap').evaluate((n) => getComputedStyle(n).transform))
      .not.toBe('none');
    expect(await page.evaluate(() => (window as any).gymMotion.hero.taps)).toBe(1);
  });

  test('phone: the illustration peeks above the bar and enters on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(hero);
    await page.addStyleTag({ content: noBar });
    const box = (selector: string) => page.locator(selector).first().boundingBox();
    const bar = (await box('.mobile-contact'))!.y;
    for (const selector of ['.hero-name [data-business]', 'h1', '.hero .button'])
      expect((await box(selector))!.y + (await box(selector))!.height).toBeLessThan(bar);
    expect((await box('.hero-sticker'))!.y).toBeLessThan(bar - 40);
    expect((await box('.kb-drop'))!.y).toBeLessThan(bar - 20);
    await expect(page.locator('.hero-sticker')).toHaveCSS('opacity', '1');
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as any).gymMotion.hero.entered)).toBe(false);
    await page.evaluate(() => scrollTo({ top: 260, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => (window as any).gymMotion.hero.entered)).toBe(true);
    await expect
      .poll(() => heroAnimations(page), { timeout: 4000 })
      .toEqual(expect.arrayContaining(['loop']));
    for (const selector of ['.kb-drop', '.kb-mark', '.hero-dumbbell', '.hero-card'])
      await expect(page.locator(selector).first()).toHaveCSS('opacity', '1');
  });

  test('reduced motion and no JavaScript show the settled illustration', async ({ browser }) => {
    for (const options of [{ reducedMotion: 'reduce' as const }, { javaScriptEnabled: false }]) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        ...options,
      });
      const page = await context.newPage();
      await page.goto(hero);
      await page.evaluate(() => scrollTo(0, 500)).catch(() => {});
      await page.waitForTimeout(400);
      for (const selector of [
        '.kb-drop',
        '.kb-mark',
        '.hero-dumbbell',
        '.hero-plates',
        '.hero-sticker',
        '.hero-card',
      ])
        await expect(page.locator(selector).first()).toHaveCSS('opacity', '1');
      await expect(page.locator('.kb-button')).toBeHidden();
      if (options.reducedMotion) {
        expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
        await expect(page.locator('.kb-scroll')).toHaveCSS('transform', 'none');
      }
      await context.close();
    }
  });
});

test.describe('scroll scenes below the hero', () => {
  const phone = `${route}?name=Dundee%20Fitness&ref=L-TEST`;
  const names = ['train', 'timetable', 'gallery1', 'gallery2', 'gallery3', 'visit'];

  test('each scene plays 0 → 1 on its own phone screen, one at a time', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(phone);
    await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const rows: Record<string, number>[] = [];
    for (let y = 0; y <= height - 812; y += 20) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(20);
      rows.push(
        await page.evaluate((y) => {
          const motion = (window as any).gymMotion;
          return { y, hero: motion.hero.progress, lift: motion.progress, ...motion.scenes };
        }, y),
      );
    }
    const active = (row: Record<string, number>, name: string) => row[name] > 0 && row[name] < 1;
    for (const name of ['hero', 'lift', ...names]) {
      const span = rows.filter((row) => active(row, name));
      expect(span.length, name).toBeGreaterThan(5);
      for (let i = 1; i < rows.length; i++)
        expect(rows[i][name], name).toBeGreaterThanOrEqual(rows[i - 1][name] - 0.001);
      const length = span.at(-1)!.y - span[0].y + 20;
      if (!name.startsWith('gallery')) {
        expect(length, name).toBeGreaterThan(480);
        expect(length, name).toBeLessThan(720);
      }
    }
    for (const row of rows)
      expect(
        ['hero', 'lift', ...names].filter((name) => active(row, name)).length,
        `scenes competing at ${row.y}px`,
      ).toBeLessThanOrEqual(1);
    const train = await page.locator('#train').boundingBox();
    expect(train!.height).toBeLessThan(812 * 1.2);
  });

  test('day highlight slides, memberships expand, and the pass card draws its tick', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(phone);
    await page.addStyleTag({ content: noBar });
    const indicator = page.locator('.day-indicator');
    const start = await indicator.evaluate((n) => getComputedStyle(n).transform);
    await page.locator('[data-day=Fri]').click();
    await expect(page.locator('#day-Fri')).toBeVisible();
    await expect
      .poll(() => indicator.evaluate((n) => getComputedStyle(n).transform))
      .not.toBe(start);
    await expect(page.locator('#day-Fri .pulse-line')).toHaveAttribute('d', /^M15 0V/);
    const toggle = page.getByRole('button', { name: 'What’s included in Anytime' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#perks-1')).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#perks-1 li')).toHaveText([
      'Gym floor & cardio',
      'All group classes',
      'Free induction',
    ]);
    await toggle.press('Enter');
    await expect(page.locator('#perks-1')).toBeHidden();
    await page.locator('.hero .button').click();
    await page.getByRole('button', { name: 'Next: pick a time' }).click();
    await page.getByRole('button', { name: 'See my visit' }).click();
    await expect(page.locator('.pass-card .pass-name')).toHaveText('Dundee Fitness');
    await expect
      .poll(() =>
        page.locator('.pass-tick path').evaluate((n) => getComputedStyle(n).strokeDashoffset),
      )
      .toBe('0px');
  });

  test('reduced motion and no JavaScript show every scene finished', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(phone);
    for (const y of [1200, 3200, 5200, 8200]) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(100);
      const scenes = await page.evaluate(() => (window as any).gymMotion.scenes);
      for (const name of names) expect(scenes[name], name).toBe(1);
      expect(scenes.swing).toBe(0);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    }
    await expect(page.locator('.hours dd').last()).toHaveCSS('opacity', '1');
    await page.locator('[data-day=Sat]').click();
    await expect(page.locator('#day-Sat')).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await context.close();
    const offline = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const still = await offline.newPage();
    await still.goto(phone);
    await expect(still.locator('.perks').first()).toBeVisible();
    await expect(still.locator('.perks-toggle').first()).toBeHidden();
    await expect(still.locator('.wipe').first()).not.toBeInViewport();
    await offline.close();
  });
});
