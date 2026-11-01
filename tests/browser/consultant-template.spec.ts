import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { consultantDemo as c, rolePresets } from '../../src/content/consultant-demo';
const route = c.route;
const personalised = `${route}?name=Sarah%20Reid&role=Bookkeeper&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER07`;
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
        (window as any).identityAtPaint = [
          document.querySelector('[data-business]')?.textContent,
          document.querySelector('[data-role]')?.textContent,
          document.querySelector('.tagline')?.textContent,
        ];
      }
    }).observe({ type: 'paint', buffered: true });
  });
  await page.goto(personalised);
  await expect
    .poll(() => page.evaluate(() => (window as any).identityAtPaint))
    .toEqual(['Sarah Reid', 'Bookkeeper', rolePresets.bookkeeper.promise]);
  for (const node of await page.locator('[data-business]').all())
    await expect(node).toHaveText('Sarah Reid');
  for (const node of await page.locator('[data-role]').all())
    await expect(node).toHaveText('Bookkeeper');
  for (const node of await page.locator('[data-monogram]').all())
    await expect(node).toHaveText('SR');
  await expect(page.locator('h1')).toHaveText('Sarah Reid');
  await expect(page.locator('.site-footer [data-role]')).toHaveText('Bookkeeper');
  await expect(page.locator('[data-hero-area]')).toHaveText('Broughty Ferry');
  await expect(page.locator('.contact-line')).toHaveText(
    'Sarah Reid · Bookkeeper · Broughty Ferry',
  );
  await expect(page.locator('[data-phone]').first()).toHaveText('01382 000000');
  await expect(page.locator('#contact [data-call]')).toHaveAttribute('href', 'tel:+441382000000');
  await expect(page.locator('#contact [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/441382000000',
  );
  await expect(page).toHaveTitle('Sarah Reid · Bookkeeper' + c.titleSuffix);
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
      'LETTER07',
    );
  expect(await page.locator('body').innerText()).not.toContain('LETTER07');
  for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
    await expect(page.locator(`[data-capture="${hook}"]`)).toHaveCount(1);
  await expect(page.locator('[data-sample-review] .review-tag')).toHaveText(
    Array(3).fill('Example review'),
  );
  await expect(page.locator('.case-tag')).toHaveText(Array(3).fill('Example case study'));
  await expect(page.locator('.portrait-label')).toHaveText('Your photo here');
  await expect(page.locator('.logo-row li')).toHaveText(Array(4).fill('Client logo'));
  expect(await page.locator('[data-sample-price]').count()).toBe(4);
  await page.waitForTimeout(5100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  const directions = page.locator('[data-directions]');
  await directions.click();
  await expect(page.locator('.contact-preview-value')).toHaveText('Broughty Ferry');
  await page.keyboard.press('Escape');
  await expect(directions).toBeFocused();
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
  expect(
    requests.filter((url) => /Sarah|Reid|Bookkeeper|Broughty|01382|LETTER07/i.test(url)),
  ).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

for (const name of [
  "Jay's Cuts & Co",
  'A'.repeat(100),
  '<img src=x onerror=alert(1)>',
  'Zoë Ó Briain-Ng',
  'A'.repeat(101),
]) {
  test(`safe text personalisation: ${name.slice(0, 30)} (${name.length})`, async ({ page }) => {
    await page.goto(
      `${route}?name=${encodeURIComponent(name)}&role=${encodeURIComponent('<b>' + 'R'.repeat(70))}`,
    );
    await expect(page.locator('h1')).toHaveText(Array.from(name).slice(0, 100).join(''));
    await expect(page.locator('[data-business] img, [data-role] b')).toHaveCount(0);
    await expect(page.locator('[data-role]').first()).toHaveText(
      ('<b>' + 'R'.repeat(70)).slice(0, 60),
    );
    await expect(page.locator('#name-dialog')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('blank and invalid values fall back; delayed offer occurs once; edits keep URL context', async ({
  page,
}) => {
  await page.goto(`${route}?name=%20&role=%20%20&area=%20&phone=invalid&ref=bad%20code`);
  await expect(page.locator('h1')).toHaveText(c.name);
  await expect(page.locator('[data-role]').first()).toHaveText(c.role);
  await expect(page.locator('[data-monogram]').first()).toHaveText(c.monogram);
  await expect(page.locator('[data-phone]').first()).toHaveText('Your number here');
  await expect(page.locator('#contact [data-call]')).toHaveAttribute('href', '#contact');
  await expect(page.locator('#name-dialog')).toBeVisible({ timeout: 6500 });
  await expect(page.getByLabel('Your name or business name')).toBeFocused();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  const call = page.locator('#contact [data-call]');
  await call.click();
  await expect(page.locator('.contact-preview-value')).toHaveText('Your number here');
  await page.keyboard.press('Escape');
  await expect(call).toBeFocused();
  await page.goto(`${route}?role=Coach&area=Dundee&ref=LETTER07`);
  await page.evaluate(() => scrollTo(0, 250));
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Your name or business name').fill('  ');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('#name-error')).toBeVisible();
  await page.getByLabel('Your name or business name').fill('Sarah Reid');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('[data-edit]')).toBeFocused();
  const url = new URL(page.url());
  expect([...url.searchParams]).toEqual([
    ['role', 'Coach'],
    ['area', 'Dundee'],
    ['ref', 'LETTER07'],
    ['name', 'Sarah Reid'],
  ]);
  await expect(page).toHaveTitle('Sarah Reid · Coach' + c.titleSuffix);
  await page.locator('[data-edit]').click();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  await expect(page.locator('h1')).toHaveText(c.name);
  await page.evaluate(() => {
    history.pushState(null, '', '?name=History%20Name');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('h1')).toHaveText('History Name');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText(c.name);
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('History Name');
});

for (const width of [320, 390, 768, 1440]) {
  test(`call booking, layout, scroll and reduced motion at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(personalised);
    await page.addStyleTag({ content: noBar });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390) {
      const bar = (await page.locator('.mobile-contact').boundingBox())!.y;
      for (const selector of ['h1', '.hero-copy .eyebrow', '.hero .button']) {
        const box = (await page.locator(selector).boundingBox())!;
        expect(box.y + box.height).toBeLessThan(bar);
      }
    }
    // Click the cards once they have dealt out of their stack.
    await page.evaluate(() =>
      scrollTo({
        top: document.querySelector('.service-grid')!.getBoundingClientRect().top + scrollY - 120,
        behavior: 'instant',
      }),
    );
    await expect
      .poll(() => page.evaluate(() => (window as any).consultantMotion.scenes.services))
      .toBe(1);
    for (const [index, item] of c.services.entries()) {
      const trigger = page.locator(`.service-card[data-service=${item.id}]`);
      await trigger.click();
      await expect(page.locator('#call-topic')).toHaveValue(item.id);
      await page.getByRole('button', { name: 'Next: pick a time' }).click();
      await expect(page.locator('#time-form h3')).toBeFocused();
      await page.getByRole('button', { name: 'See my booking' }).click();
      await expect(page.locator('#call-final')).toContainText('Demo only, nothing is booked.');
      await expect(page.locator('#call-final')).toContainText(
        'This is where clients would book a call.',
      );
      await expect(page.locator('#call-summary')).toHaveText(
        `${rolePresets.bookkeeper.topics[index]} · ${c.flow.days[0]} · ${c.flow.times[0]} · 15 minutes`,
      );
      await expect(page.locator('#call-final [data-brief-link]')).toContainText(
        'Want this for Sarah Reid? Talk to FinTaxTech',
      );
      await page.getByRole('button', { name: 'Try another booking' }).click();
      await expect(page.locator('#topic-form')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
    for (const link of await page.locator('[data-book]').all()) {
      if (!(await link.isVisible())) continue;
      await link.click();
      await expect(page.locator('#call-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(link).toBeFocused();
    }
    const stage = page.locator('.motion-stage');
    const progress = () =>
      stage.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue('--progress')));
    const top = await page
      .locator('[data-board]')
      .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    const before = await page
      .locator('.note-move')
      .first()
      .evaluate((n) => getComputedStyle(n).transform);
    // The clear line draws itself in every browser (Firefox ignores a unitless calc() here).
    const line = () =>
      page.locator('.clear-line').evaluate((n) => parseFloat(getComputedStyle(n).strokeDashoffset));
    expect(await line()).toBe(100);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(1);
    expect(
      await page
        .locator('.note-move')
        .first()
        .evaluate((n) => getComputedStyle(n).transform),
    ).not.toBe(before);
    expect(await line()).toBe(0);
    await expect(page.locator('.process-steps li').nth(2)).toHaveClass(/is-current/);
    if (width < 768) expect((await stage.boundingBox())!.height).toBeLessThan(844);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(progress).toBe(1);
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
      await page.screenshot({ path: info.outputPath(`consultant-${width}.png`) });
  });
}

for (const [role, key] of [
  ['Life coach', 'coach'],
  ['Web designer', 'designer'],
  ['IT support', 'tech'],
  ['Recruitment specialist', 'consultant'],
] as const) {
  test(`role preset for "${role}" swaps the copy before first paint`, async ({ page }) => {
    const preset = rolePresets[key];
    await page.addInitScript(() => {
      new PerformanceObserver((list) => {
        if (list.getEntries().some((entry) => entry.name === 'first-contentful-paint'))
          (window as any).copyAtPaint = [
            document.querySelector('.tagline')?.textContent,
            document.querySelector('.service-card h3')?.textContent,
          ];
      }).observe({ type: 'paint', buffered: true });
    });
    await page.goto(`${route}?name=Sarah%20Khan&role=${encodeURIComponent(role)}&area=Dundee`);
    await expect
      .poll(() => page.evaluate(() => (window as any).copyAtPaint))
      .toEqual([preset.promise, preset.services[0].name]);
    await expect(page.locator('html')).toHaveAttribute('data-preset', key);
    await expect(page.locator('.hero-copy .eyebrow')).toHaveText(`${role} · Dundee`);
    await expect(page.locator('.contact-line')).toHaveText(`Sarah Khan · ${role} · Dundee`);
    await expect(page.locator('.service-card h3')).toHaveText(preset.services.map((s) => s.name));
    await expect(page.locator('[data-sample-price]')).toHaveText(
      preset.services.map((s) => s.price),
    );
    await expect(page.locator('.case-card h3')).toHaveText(preset.cases.map((item) => item.title));
    await expect(page.locator('.clients li')).toHaveText([...preset.clients]);
    await expect(page.locator('#call-topic option')).toHaveText([...preset.topics]);
    // Changing the role through history swaps the copy back.
    await page.evaluate(() => {
      history.pushState(null, '', '?name=Sarah%20Khan');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.locator('.tagline')).toHaveText(rolePresets.consultant.promise);
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'consultant');
  });
}

test('every scroll scene runs once in order, above the contact bar, on a 375 × 812 phone', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${route}?name=Sarah%20Khan&role=Bookkeeper&area=Dundee&ref=L-TEST`);
  await page.addStyleTag({ content: noBar });
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
  const scenes = {
    hero: '.hero-art',
    services: '.service-grid',
    board: '[data-board]',
    case1: '[data-case-art]',
    portrait: '[data-portrait]',
    credentials: '.placeholders',
    calendar: '[data-calendar]',
  };
  await expect(page.locator('.hero-art')).toHaveClass(/is-live/);
  expect(
    await page
      .locator('.signature-mono')
      .evaluate((node) => node.getAnimations().map((a) => a.playState)),
  ).toEqual(['running']);
  const barTop = (await page.locator('.mobile-contact').boundingBox())!.y;
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const log: Record<string, [number, number]>[] = [];
  for (let y = 0; y <= height; y += 20) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    log.push(
      await page.evaluate((scenes) => {
        const state = (window as any).consultantMotion.scenes;
        return Object.fromEntries(
          Object.entries(scenes).map(([key, selector]) => [
            key,
            [state[key], document.querySelector(selector)!.getBoundingClientRect().top],
          ]),
        );
      }, scenes),
    );
  }
  let previousEnd = -1;
  for (const key of Object.keys(scenes)) {
    const values = log.map((row) => row[key][0]);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    const start = values.findIndex((value) => value > 0);
    const end = values.findIndex((value) => value >= 1);
    expect(start, key).toBeGreaterThan(-1);
    expect(end, key).toBeGreaterThan(start);
    // Each scene starts with its element already above the contact bar.
    expect(log[start][key][1], key).toBeLessThan(barTop);
    if (key !== 'hero') {
      expect(start, key).toBeGreaterThanOrEqual(previousEnd - 1);
      expect((end - start) * 20, key).toBeGreaterThanOrEqual(200);
      previousEnd = end;
    }
  }
  info.attachments.push({
    name: 'scenes.json',
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(log)),
  });
  // Ambient loops pause once the hero is off screen.
  await expect(page.locator('.hero-art')).not.toHaveClass(/is-live/);
  expect(
    await page
      .locator('.signature-mono')
      .evaluate((node) => node.getAnimations().map((a) => a.playState)),
  ).toEqual(['paused']);
  // The booking's final screen draws a tick on the example slot card.
  await page.locator('.mobile-contact [data-book]').click();
  await page.getByRole('button', { name: 'Next: pick a time' }).click();
  await page.getByRole('button', { name: 'See my booking' }).click();
  await expect(page.locator('.booked-card')).toBeVisible();
  expect(
    await page.locator('.booked-card path').evaluate((node) => node.getAnimations().length),
  ).toBe(1);
  await expect
    .poll(() =>
      page
        .locator('.booked-card path')
        .evaluate((node) => parseFloat(getComputedStyle(node).strokeDashoffset)),
    )
    .toBe(0);
  // Reduced motion: every scene is finished, nothing is offset and nothing loops.
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect
    .poll(() => page.evaluate(() => (window as any).consultantMotion.scenes))
    .toMatchObject({
      hero: 0,
      services: 1,
      board: 1,
      case1: 1,
      case2: 1,
      case3: 1,
      portrait: 1,
      credentials: 1,
      calendar: 1,
    });
  expect(
    await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => a.playState === 'running').length,
      cards: [...document.querySelectorAll<HTMLElement>('.service-card')].map(
        (n) => n.style.translate + n.style.rotate,
      ),
      pending: document.documentElement.classList.contains('sign-pending'),
    })),
  ).toEqual({ running: 0, cards: ['', '', '', ''], pending: false });
});

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
  await expect(page.locator('h1')).toHaveText("Jay's Cuts & Co");
  await expect(page.locator('.hero .button')).toBeVisible();
  expect(
    await page.locator('.hero-copy').evaluate((node) => Number(getComputedStyle(node).opacity)),
  ).toBeGreaterThanOrEqual(0.6);
  await page.waitForLoadState('load');
  await page.addStyleTag({ content: noBar });
  await expect(page.locator('[data-monogram]').first()).toHaveText('JC');
  await expect(page.locator('[data-role]').first()).toHaveText(c.role);
  for (const selector of ['#contact [data-call]', '.mobile-contact [data-call]'])
    await expect(page.locator(selector)).toHaveAttribute('href', 'tel:+447526699217');
  await expect(page.locator('#contact [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/447526699217',
  );
  for (const link of await page.locator('[data-agency-link]').all())
    expect(new URL((await link.getAttribute('href'))!, page.url()).searchParams.get('ref')).toBe(
      'L-TEST',
    );
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
  const top = await page
    .locator('[data-board]')
    .evaluate((node) => node.getBoundingClientRect().top + scrollY);
  const log: [number, number][] = [];
  for (let y = top - 900, i = 0; y < top + 200; y += 8 + ((i++ * 13) % 33)) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(24);
    log.push([y, await page.evaluate(() => (window as any).consultantMotion.progress)]);
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
  await page.locator('.mobile-contact [data-book]').click();
  await page.getByRole('button', { name: 'Next: pick a time' }).click();
  await page.getByRole('button', { name: 'See my booking' }).click();
  await expect(page.locator('#call-final')).toContainText('Demo only, nothing is booked.');
  await expect(page.locator('#call-final [data-brief-link]')).toContainText(
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
  await expect(still.locator('noscript a')).toHaveAttribute('href', '/contact/');
  await still.screenshot({ path: info.outputPath('letter-no-js.png') });
  await offline.close();
});
