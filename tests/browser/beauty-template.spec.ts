import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { beautyDemo as b, treatments, treatmentGroups } from '../../src/content/beauty-demo';
const route = b.route;
const personalised = `${route}?name=Test%20Business&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER08`;
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
          document.querySelector('[data-monogram]')?.textContent,
          document.querySelector('[data-hero-area]')?.textContent,
        ];
      }
    }).observe({ type: 'paint', buffered: true });
  });
  await page.goto(personalised);
  await expect
    .poll(() => page.evaluate(() => (window as any).identityAtPaint))
    .toEqual(['Test Business', 'TB', 'Broughty Ferry']);
  for (const node of await page.locator('[data-business]').all())
    await expect(node).toHaveText('Test Business');
  for (const node of await page.locator('[data-monogram]').all())
    await expect(node).toHaveText('TB');
  await expect(page.locator('h1')).toHaveText('Test Business');
  await expect(page.locator('.contact-line')).toHaveText('Test Business · Broughty Ferry');
  await expect(page.locator('[data-phone]').first()).toHaveText('01382 000000');
  await expect(page.locator('#contact [data-call]')).toHaveAttribute('href', 'tel:+441382000000');
  await expect(page.locator('#contact [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/441382000000',
  );
  await expect(page).toHaveTitle('Test Business' + b.titleSuffix);
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
      'LETTER08',
    );
  expect(await page.locator('body').innerText()).not.toContain('LETTER08');
  for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
    await expect(page.locator(`[data-capture="${hook}"]`)).toHaveCount(1);
  await expect(page.locator('[data-sample-review] .review-tag')).toHaveText(
    Array(3).fill('Example review'),
  );
  await expect(page.locator('.tile-tag')).toHaveText(Array(b.gallery.length).fill('Example'));
  await expect(page.locator('.art-tag')).toHaveText(Array(2).fill('Illustrated example'));
  await expect(page.locator('.patch-note')).toContainText(b.patchTest);
  // One per treatment row, the gift voucher, and the booking demo's price line.
  expect(await page.locator('[data-sample-price]').count()).toBe(treatments.length + 2);
  await page.waitForTimeout(5100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  const directions = page.locator('[data-directions]');
  await directions.click();
  await expect(page.locator('.contact-preview-value')).toHaveText('Broughty Ferry');
  await page.keyboard.press('Escape');
  await expect(directions).toBeFocused();
  const voucher = page.locator('[data-voucher]');
  await voucher.click();
  await expect(page.locator('#contact-dialog-title')).toHaveText('Gift voucher preview');
  await page.keyboard.press('Escape');
  await expect(voucher).toBeFocused();
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
  expect(requests.filter((url) => /Test|Business|Broughty|01382|LETTER08/i.test(url))).toEqual([]);
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
    await page.goto(`${route}?name=${encodeURIComponent(name)}`);
    await expect(page.locator('h1')).toHaveText(Array.from(name).slice(0, 100).join(''));
    await expect(page.locator('[data-business] img')).toHaveCount(0);
    await expect(page.locator('#name-dialog')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('blank and invalid values fall back; delayed offer occurs once; edits keep URL context', async ({
  page,
}) => {
  await page.goto(`${route}?name=%20&area=%20&phone=invalid&ref=bad%20code`);
  await expect(page.locator('h1')).toHaveText(b.name);
  await expect(page.locator('[data-monogram]').first()).toHaveText(b.monogram);
  await expect(page.locator('[data-hero-area]')).toHaveText(b.area);
  await expect(page.locator('[data-phone]').first()).toHaveText('Your number here');
  await expect(page.locator('#contact [data-call]')).toHaveAttribute('href', '#contact');
  await expect(page.locator('#name-dialog')).toBeVisible({ timeout: 6500 });
  await expect(page.getByLabel('Your business name')).toBeFocused();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  const call = page.locator('#contact [data-call]');
  await call.click();
  await expect(page.locator('.contact-preview-value')).toHaveText('Your number here');
  await page.keyboard.press('Escape');
  await expect(call).toBeFocused();
  await page.goto(`${route}?area=Dundee&ref=LETTER08`);
  await page.evaluate(() => scrollTo(0, 250));
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Your business name').fill('  ');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('#name-error')).toBeVisible();
  await page.getByLabel('Your business name').fill('Glow Studio');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('[data-edit]')).toBeFocused();
  expect([...new URL(page.url()).searchParams]).toEqual([
    ['area', 'Dundee'],
    ['ref', 'LETTER08'],
    ['name', 'Glow Studio'],
  ]);
  await expect(page).toHaveTitle('Glow Studio' + b.titleSuffix);
  await expect(page.locator('[data-monogram]').first()).toHaveText('GS');
  await page.locator('[data-edit]').click();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  await expect(page.locator('h1')).toHaveText(b.name);
  await page.evaluate(() => {
    history.pushState(null, '', '?name=History%20Name');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('h1')).toHaveText('History Name');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText(b.name);
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('History Name');
});

for (const width of [375, 390]) {
  test(`dialog eyebrows clear the close button at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(personalised);
    await page.locator('.mobile-contact [data-book]').click();
    const eyebrow = page.locator('#book-dialog > .eyebrow');
    await expect(eyebrow).toHaveText('EXAMPLE BOOKING · NOTHING IS SENT');
    const text = await eyebrow.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].map((r) => ({
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      }));
    });
    // At least 8px of clear space: at 375px the unpadded text stopped 3.6px from the button.
    const close = (await page.locator('#book-dialog [data-close]').boundingBox())!;
    for (const line of text)
      expect(
        line.right <= close.x - 8 || line.top >= close.y + close.height || line.bottom <= close.y,
      ).toBe(true);
  });
}

test('treatment tabs switch by click and arrow keys, and every row books its treatment', async ({
  page,
}) => {
  await page.goto(personalised);
  await page.addStyleTag({ content: noBar });
  await expect(page.getByRole('tab')).toHaveText(treatmentGroups.map((group) => group.label));
  // Keep the list on screen, so its rows have slid in with the scroll.
  await page
    .locator('[data-prices]')
    .evaluate((node) =>
      scrollTo({ top: node.getBoundingClientRect().top + scrollY - 160, behavior: 'instant' }),
    );
  for (const [index, group] of treatmentGroups.entries()) {
    const tab = page.getByRole('tab', { name: group.label });
    if (index % 2) {
      await page.getByRole('tab', { name: treatmentGroups[index - 1].label }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(tab).toBeFocused();
    } else await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel');
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute('aria-labelledby', `tab-${group.id}`);
    const items = treatments.filter((item) => item.group === group.id);
    await expect(panel.locator('h4')).toHaveText(items.map((item) => item.name));
    await expect(panel.locator('[data-sample-price]')).toHaveText(items.map((item) => item.price));
    // Rows finish sliding in after a tab change.
    await expect
      .poll(() =>
        panel
          .locator('.price-row')
          .last()
          .evaluate((n) => getComputedStyle(n).opacity),
      )
      .toBe('1');
    for (const item of items) {
      const trigger = panel.locator(`[data-service="${item.id}"]`);
      await trigger.click();
      await expect(page.locator('#book-treatment')).toHaveValue(item.id);
      await expect(page.locator('#book-price')).toHaveText(
        `${item.duration} · Example price: ${item.price}`,
      );
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
  }
  await page.getByRole('tab', { name: 'Nails' }).click();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Extras' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Nails' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Extras' })).toHaveAttribute('aria-selected', 'true');
  // Changing the treatment in the booking demo updates its example price.
  await page.locator('.hero [data-book]').click();
  const lift = treatments.find((item) => item.id === 'lift')!;
  await page.locator('#book-treatment').selectOption(lift.id);
  await expect(page.locator('#book-price')).toHaveText(
    `${lift.duration} · Example price: ${lift.price}`,
  );
  await page.keyboard.press('Escape');
  // "See lash treatments" opens the Lashes tab.
  await page.locator('[data-tab-link="lashes"]').click();
  await expect(page.getByRole('tab', { name: 'Lashes' })).toHaveAttribute('aria-selected', 'true');
});

for (const width of [320, 390, 768, 1440]) {
  test(`booking, layout, scroll and reduced motion at ${width}px`, async ({ page }, info) => {
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
    for (const link of await page.locator('[data-book]').all()) {
      if (!(await link.isVisible())) continue;
      await link.click();
      await expect(page.locator('#book-dialog')).toBeVisible();
      await expect(page.locator('#book-treatment')).toHaveValue(treatments[0].id);
      await page.getByRole('button', { name: 'Next: technician & time' }).click();
      await expect(page.locator('#time-form h3')).toBeFocused();
      await expect(page.locator('#book-tech option')).toHaveText([...b.flow.technicians]);
      await page.getByRole('button', { name: 'See my booking' }).click();
      await expect(page.locator('#book-final')).toContainText(
        'This is where clients would book and pay a deposit on your finished website.',
      );
      await expect(page.locator('#book-final')).toContainText(
        'Demo only — nothing is booked or charged.',
      );
      await expect(page.locator('#book-summary')).toHaveText(
        `${treatments[0].name} · Any available · ${b.flow.days[0]} ${b.flow.times[0]} · ${treatments[0].duration}`,
      );
      await expect(page.locator('.booked-name')).toHaveText('Test Business');
      await expect(page.locator('#book-final [data-agency-link]')).toContainText(
        'Want this for Test Business? Talk to FinTaxTech',
      );
      await page.getByRole('button', { name: 'Book something else' }).click();
      await expect(page.locator('#treatment-form')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(link).toBeFocused();
    }
    const stage = page.locator('.story-stage');
    const progress = () =>
      stage.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue('--progress')));
    const top = await page
      .locator('[data-story]')
      .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    const before = await page
      .locator('.coat-colour')
      .first()
      .evaluate((n) => getComputedStyle(n).strokeDashoffset);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(1);
    expect(
      await page
        .locator('.coat-colour')
        .first()
        .evaluate((n) => getComputedStyle(n).strokeDashoffset),
    ).not.toBe(before);
    await expect(page.locator('.story-steps li').nth(3)).toHaveClass(/is-current/);
    if (width < 768) expect((await stage.boundingBox())!.height).toBeLessThan(844);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(progress).toBe(1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
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
      await page.screenshot({ path: info.outputPath(`beauty-${width}.png`) });
  });
}

test('every scroll scene runs once in order, above the contact bar, on a 375 × 812 phone', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${route}?name=Sarah%27s%20Nails&area=Dundee&ref=L-TEST`);
  await page.addStyleTag({ content: noBar });
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
  // Hero: the cap lifts and the brush paints the name's underline, then the bottle turns.
  await expect
    .poll(() => page.locator('.name-stroke').evaluate((node) => getComputedStyle(node).transform))
    .toBe('none');
  await expect(page.locator('html')).not.toHaveClass(/paint-pending/);
  await expect(page.locator('.hero-art')).toHaveClass(/is-live/);
  expect(
    await page.locator('.bottle').evaluate((node) => node.getAnimations().map((a) => a.playState)),
  ).toEqual(['running']);
  const scenes = {
    prices: '[data-prices]',
    story: '[data-story]',
    lashes: '[data-lashes]',
    brows: '[data-brows]',
    gallery: '[data-gallery]',
  };
  const barTop = (await page.locator('.mobile-contact').boundingBox())!.y;
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const log: Record<string, [number, number]>[] = [];
  for (let y = 0; y <= height; y += 20) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    log.push(
      await page.evaluate((scenes) => {
        const state = (window as any).beautyMotion.scenes;
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
    expect(start, key).toBeGreaterThanOrEqual(previousEnd - 1);
    expect((end - start) * 20, key).toBeGreaterThanOrEqual(240);
    previousEnd = end;
  }
  info.attachments.push({
    name: 'scenes.json',
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(log)),
  });
  // Ambient loops pause once the hero is off screen.
  await expect(page.locator('.hero-art')).not.toHaveClass(/is-live/);
  expect(
    await page.locator('.bottle').evaluate((node) => node.getAnimations().map((a) => a.playState)),
  ).toEqual(['paused']);
  // The booking's final screen bursts sparkles around the booked card.
  await page.locator('.mobile-contact [data-book]').click();
  await page.getByRole('button', { name: 'Next: technician & time' }).click();
  await page.getByRole('button', { name: 'See my booking' }).click();
  await expect(page.locator('.booked-card')).toBeVisible();
  expect(
    await page
      .locator('.sparkles i')
      .evaluateAll((nodes) => nodes.map((node) => node.getAnimations().length)),
  ).toEqual(Array(12).fill(1));
  // Reduced motion: every scene is finished, nothing is offset and nothing loops.
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  // motion.js drops reveal-ready once it has handled the preference change.
  await expect(page.locator('html')).not.toHaveClass(/reveal-ready/);
  await expect
    .poll(() => page.evaluate(() => (window as any).beautyMotion.scenes))
    .toEqual({ prices: 1, story: 1, lashes: 1, brows: 1, gallery: 1 });
  expect(
    await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => a.playState === 'running').length,
      tiles: [...document.querySelectorAll('.tile')].map((n) => getComputedStyle(n).transform),
      pending: document.documentElement.classList.contains('paint-pending'),
    })),
  ).toEqual({
    running: 0,
    tiles: Array(b.gallery.length).fill('matrix(1, 0, 0, 1, 0, 0)'),
    pending: false,
  });
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
    .locator('[data-story]')
    .evaluate((node) => node.getBoundingClientRect().top + scrollY);
  const log: [number, number][] = [];
  for (let y = top - 900, i = 0; y < top + 200; y += 8 + ((i++ * 13) % 33)) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(24);
    log.push([y, await page.evaluate(() => (window as any).beautyMotion.progress)]);
  }
  for (let i = 1; i < log.length; i++) expect(log[i][1]).toBeGreaterThanOrEqual(log[i - 1][1]);
  const first = log.find(([, p]) => p > 0)!;
  const last = log.find(([, p]) => p >= 1)!;
  expect(last[0] - first[0]).toBeGreaterThan(480);
  expect(last[0] - first[0]).toBeLessThan(720);
  for (let stage = 0; stage < 4; stage++)
    expect(
      log.filter(([, p]) => p * 4 > stage + 0.1 && p * 4 < stage + 0.9).length,
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
  await page.getByRole('button', { name: 'Next: technician & time' }).click();
  await page.getByRole('button', { name: 'See my booking' }).click();
  await expect(page.locator('#book-final')).toContainText(
    'Demo only — nothing is booked or charged.',
  );
  await expect(page.locator('#book-final [data-agency-link]')).toContainText(
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
  await expect(still.locator('.story-steps li')).toHaveCount(4);
  // Without JavaScript every treatment list is shown, without tabs.
  await expect(still.locator('.price-panel')).toHaveCount(treatmentGroups.length);
  for (const panel of await still.locator('.price-panel').all()) await expect(panel).toBeVisible();
  await expect(still.locator('noscript a')).toHaveAttribute('href', '/contact/');
  await still.screenshot({ path: info.outputPath('letter-no-js.png') });
  await offline.close();
});
