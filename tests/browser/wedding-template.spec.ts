import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { weddingDemo as w, presets, supplierTypes } from '../../src/content/wedding-demo';
const route = w.route;
const personalised = `${route}?name=Test%20Business&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER09`;
const letter = `${route}?name=Jay%27s%20Cuts%20%26%20Co&area=Kirkcaldy&phone=07526%20699217&ref=L-TEST`;
const noBar = 'astro-dev-toolbar{display:none!important}';
// Text of visible elements, skipping the other supplier types' hidden [data-only] copy.
const visibleText = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node) => (node as HTMLElement).getClientRects().length > 0)
      .map((node) => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let text = '';
        while (walker.nextNode())
          if (walker.currentNode.parentElement!.getClientRects().length)
            text += walker.currentNode.textContent;
        return text.replace(/\s+/g, ' ').trim();
      }),
  );

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
          document.documentElement.dataset.type,
          document.querySelector('[data-type-label]')?.textContent,
        ];
      }
    }).observe({ type: 'paint', buffered: true });
  });
  await page.goto(`${personalised}&type=florist`);
  await expect
    .poll(() => page.evaluate(() => (window as any).identityAtPaint))
    .toEqual(['Test Business', 'TB', 'Broughty Ferry', 'florist', 'Wedding flowers']);
  for (const node of await page.locator('[data-business]').all())
    await expect(node).toHaveText('Test Business');
  for (const node of await page.locator('[data-monogram]').all())
    await expect(node).toHaveText('TB');
  await expect(page.locator('h1')).toHaveText('Test Business');
  await expect(page.locator('.contact-line')).toHaveText(
    'Test Business · Wedding flowers · Broughty Ferry',
  );
  await expect(page.locator('[data-phone]').first()).toHaveText('01382 000000');
  await expect(page.locator('#contact [data-call]')).toHaveAttribute('href', 'tel:+441382000000');
  await expect(page.locator('#contact [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/441382000000',
  );
  await expect(page).toHaveTitle('Test Business' + w.titleSuffix);
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
      'LETTER09',
    );
  expect(await page.locator('body').innerText()).not.toContain('LETTER09');
  for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
    await expect(page.locator(`[data-capture="${hook}"]`)).toHaveCount(1);
  await expect(page.locator('.badge')).toHaveText(w.badge);
  expect(await visibleText(page, '[data-sample-review] .review-tag')).toEqual(
    Array(3).fill('Example review'),
  );
  expect(await visibleText(page, '.tile-tag')).toEqual(Array(6).fill('Example'));
  expect(await visibleText(page, '.tile figcaption')).toEqual(
    presets.florist.gallery.map((tile) => `Example ${tile.label}`),
  );
  // Three packages per type plus the demo's price line, each wrapped for capture.
  expect(await page.locator('[data-sample-price]').count()).toBe(supplierTypes.length * 3 + 1);
  await page.waitForTimeout(5100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  for (const [selector, title, value] of [
    ['[data-directions]', 'Directions preview', 'Broughty Ferry'],
    ['.meet [data-social="instagram"]', 'Instagram preview', '@yourbusiness'],
    ['.meet [data-social="pinterest"]', 'Pinterest preview', 'Your mood boards'],
    ['.site-footer [data-social="instagram"]', 'Instagram preview', '@yourbusiness'],
    ['.site-footer [data-social="pinterest"]', 'Pinterest preview', 'Your mood boards'],
    ['[data-fairs]', 'Wedding fairs preview', 'Your next wedding fair here'],
  ]) {
    const trigger = page.locator(selector);
    await trigger.click();
    await expect(page.locator('#contact-dialog-title')).toHaveText(title);
    await expect(page.locator('.contact-preview-value')).toHaveText(value);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
  expect(
    requests.filter((url) => /Test|Business|Broughty|01382|LETTER09|florist/i.test(url)),
  ).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

for (const type of supplierTypes) {
  test(`?type=${type} shows only that supplier's copy, artwork and packages`, async ({ page }) => {
    const p = presets[type];
    await page.goto(`${route}?name=Rose%20%26%20Thistle&type=${type}`);
    await expect(page.locator('html')).toHaveAttribute('data-type', type);
    await expect(page.locator('.hero .eyebrow [data-type-label]')).toHaveText(p.label);
    expect(await visibleText(page, '.tagline > span')).toEqual([p.hero.tagline]);
    expect(await visibleText(page, '.story-steps h3')).toEqual(p.scene.steps.map(([h]) => h));
    expect(await visibleText(page, '.timeline-step h3')).toEqual(p.process.map(([h]) => h));
    expect(await visibleText(page, '.package-card h3')).toEqual(p.packages.map((x) => x.name));
    expect(await visibleText(page, '.package-price')).toEqual(
      p.packages.map((x) => `Example · from ${x.price}`),
    );
    expect(await visibleText(page, '.tile figcaption')).toHaveLength(6);
    expect(await visibleText(page, '.faq-list summary')).toEqual(p.faqs.map(([q]) => q));
    expect(await visibleText(page, '.review-card h3')).toEqual(p.reviews.map((r) => r.name));
    await expect(page.locator(`[data-story="${type}"]`)).toBeVisible();
    await expect(page.locator('[data-story]:visible')).toHaveCount(1);
    await expect(page.locator('.allergen-note')).toBeVisible({ visible: type === 'cakes' });
    // Placeholder Instagram and Pinterest links, with icons, in Meet us and the footer.
    for (const area of ['.meet', '.site-footer']) {
      const links = page.locator(`${area} .social-links a`);
      expect(await visibleText(page, `${area} .social-links a`)).toEqual([
        'Instagram',
        'Pinterest',
      ]);
      for (const link of await links.all()) {
        await expect(link).toHaveAttribute('href', '#contact');
        await expect(link.locator('.social-icon svg')).toBeVisible();
      }
      await expect(page.locator(`${area} .social-note`)).toHaveText(
        'Your Instagram and Pinterest go here',
      );
      await expect(page.locator(`${area} .social-note`)).toBeVisible();
    }
    // Every package's button opens the demo with that package chosen.
    for (const item of p.packages) {
      const trigger = page.locator(`[data-package="${item.id}"]`);
      await trigger.click();
      await page.getByRole('button', { name: 'Next: your day' }).click();
      await expect(page.locator('[data-package-label]')).toHaveText(p.demo.packageLabel);
      await expect(page.locator('#day-package')).toHaveValue(item.id);
      await expect(page.locator('#day-price')).toHaveText(`Example · from ${item.price}`);
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
  });
}

test('unknown and unsafe types fall back to the photographer copy, shown as given', async ({
  page,
}) => {
  await page.goto(`${route}?type=Videographer`);
  await expect(page.locator('html')).toHaveAttribute('data-type', 'photographer');
  await expect(page.locator('.hero .eyebrow [data-type-label]')).toHaveText('Videographer');
  await page.goto(`${route}?type=${encodeURIComponent('<img src=x onerror=alert(1)>')}`);
  await expect(page.locator('.hero .eyebrow [data-type-label]')).toHaveText(
    '<img src=x onerror=alert(1)>',
  );
  await expect(page.locator('[data-type-label] img')).toHaveCount(0);
  await page.goto(`${route}?type=${'B'.repeat(60)}`);
  await expect(page.locator('.hero .eyebrow [data-type-label]')).toHaveText('B'.repeat(40));
  await page.goto(`${route}?type=%20%20`);
  await expect(page.locator('.hero .eyebrow [data-type-label]')).toHaveText(
    presets.photographer.label,
  );
  await page.goto(`${route}?type=Cake%20Maker`);
  await expect(page.locator('html')).toHaveAttribute('data-type', 'cakes');
  await expect(page.locator('.hero .eyebrow [data-type-label]')).toHaveText('Wedding cakes');
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
  await expect(page.locator('h1')).toHaveText(w.name);
  await expect(page.locator('[data-monogram]').first()).toHaveText(w.monogram);
  await expect(page.locator('[data-hero-area]')).toHaveText(w.area);
  await expect(page.locator('[data-phone]').first()).toHaveText('Your number here');
  await expect(page.locator('#contact [data-call]')).toHaveAttribute('href', '#contact');
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await expect(page.locator('#name-dialog')).toBeVisible({ timeout: 6500 });
  await expect(page.getByLabel('Your business name', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  const call = page.locator('#contact [data-call]');
  await call.click();
  await expect(page.locator('.contact-preview-value')).toHaveText('Your number here');
  await page.keyboard.press('Escape');
  await expect(call).toBeFocused();
  await page.goto(`${route}?area=Dundee&ref=LETTER09`);
  await page.evaluate(() => scrollTo(0, 250));
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel('Your business name', { exact: true }).fill('  ');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('#name-error')).toBeVisible();
  await page.getByLabel('Your business name', { exact: true }).fill('Petal & Stem');
  await page.getByLabel('What do you do?').selectOption('florist');
  await page.getByRole('button', { name: 'Preview my website' }).click();
  await expect(page.locator('[data-edit]')).toBeFocused();
  expect([...new URL(page.url()).searchParams]).toEqual([
    ['area', 'Dundee'],
    ['ref', 'LETTER09'],
    ['name', 'Petal & Stem'],
    ['type', 'florist'],
  ]);
  await expect(page.locator('html')).toHaveAttribute('data-type', 'florist');
  expect(await visibleText(page, '.package-card h3')).toEqual(
    presets.florist.packages.map((x) => x.name),
  );
  await expect(page).toHaveTitle('Petal & Stem' + w.titleSuffix);
  await expect(page.locator('[data-monogram]').first()).toHaveText('PS');
  await page.locator('[data-edit]').click();
  await expect(page.getByLabel('What do you do?')).toHaveValue('florist');
  await page.getByRole('button', { name: 'Explore the sample / restore default' }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  await expect(page.locator('h1')).toHaveText(w.name);
  await page.evaluate(() => {
    history.pushState(null, '', '?name=History%20Name&type=cakes');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('h1')).toHaveText('History Name');
  await expect(page.locator('html')).toHaveAttribute('data-type', 'cakes');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText(w.name);
  await expect(page.locator('html')).toHaveAttribute('data-type', 'florist');
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('History Name');
});

for (const width of [375, 390]) {
  test(`dialog eyebrows clear the close button at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(personalised);
    await page.locator('.mobile-contact [data-book]').click();
    const eyebrow = page.locator('#date-dialog > .eyebrow');
    await expect(eyebrow).toHaveText('EXAMPLE AVAILABILITY · NOTHING IS SENT');
    const text = await eyebrow.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].map((r) => ({
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      }));
    });
    const close = (await page.locator('#date-dialog [data-close]').boundingBox())!;
    for (const line of text)
      expect(
        line.right <= close.x - 8 || line.top >= close.y + close.height || line.bottom <= close.y,
      ).toBe(true);
  });
}

test('the sample calendar marks booked dates, moves months and never blocks', async ({ page }) => {
  await page.goto(personalised);
  await page.locator('.hero [data-book]').click();
  await expect(page.locator('#cal-month')).toHaveText('June 2027');
  await expect(page.locator('#date-status')).toHaveText(
    'Saturday 12 June 2027 · available (example)',
  );
  await expect(page.locator('[data-date="2027-06-12"]')).toHaveAttribute('aria-pressed', 'true');
  const booked = page.locator('[data-date="2027-06-19"]');
  await expect(booked).toHaveAttribute('aria-label', 'Saturday 19 June 2027, example: booked');
  await booked.click({ force: true });
  await expect(page.locator('#date-status')).toContainText('example: booked');
  await expect(page.locator('[data-date="2027-06-12"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('#cal-month')).toHaveText('July 2027');
  await page.locator('[data-date="2027-07-17"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-date="2027-07-18"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#date-status')).toHaveText(
    'Sunday 18 July 2027 · available (example)',
  );
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('#cal-month')).toHaveText('September 2027');
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next: your day' }).click();
  await page.getByRole('button', { name: 'Check availability' }).click();
  await expect(page.locator('#date-summary')).toHaveText(
    `Sunday 18 July 2027 · Wedding · ${presets.photographer.packages[0].name} · ${w.flow.defaultGuests}`,
  );
  await page.getByRole('button', { name: 'Check another date' }).click();
  await expect(page.locator('#cal-month')).toHaveText('June 2027');
});

for (const [index, width] of [320, 390, 768, 1440].entries()) {
  const type = supplierTypes[index % 3];
  test(`date demo, layout, scroll and reduced motion at ${width}px (${type})`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${personalised}&type=${type}`);
    await page.addStyleTag({ content: noBar });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390) {
      const bar = (await page.locator('.mobile-contact').boundingBox())!.y;
      for (const selector of ['h1', '.hero-copy .eyebrow', '.hero .button', '.tagline']) {
        const box = (await page.locator(selector).boundingBox())!;
        expect(box.y + box.height).toBeLessThan(bar);
      }
    }
    for (const link of await page.locator('[data-book]').all()) {
      if (!(await link.isVisible())) continue;
      await link.click();
      await expect(page.locator('#date-dialog')).toBeVisible();
      await expect(page.locator('#date-form h3')).toBeFocused();
      await page.getByRole('button', { name: 'Next: your day' }).click();
      await expect(page.locator('#day-form h3')).toBeFocused();
      await expect(page.locator('#day-package option')).toHaveText(
        presets[type].packages.map((x) => x.name),
      );
      await page.getByRole('button', { name: 'Check availability' }).click();
      await expect(page.locator('#date-final')).toContainText(
        'This is where couples would check availability and send an enquiry on your finished website.',
      );
      await expect(page.locator('#date-final')).toContainText('Demo only — nothing is sent.');
      await expect(page.locator('[data-final-title]')).toHaveText(presets[type].demo.finalTitle);
      await expect(page.locator('#date-summary')).toHaveText(
        `Saturday 12 June 2027 · Wedding · ${presets[type].packages[0].name} · ${w.flow.defaultGuests}`,
      );
      await expect(page.locator('.checked-name')).toHaveText('Test Business');
      await expect(page.locator('#date-final [data-brief-link]')).toContainText(
        'Want this for Test Business? Talk to FinTaxTech',
      );
      await page.keyboard.press('Escape');
      await expect(link).toBeFocused();
    }
    const stage = page.locator('.story-stage');
    const progress = () =>
      stage.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue('--p')));
    const top = await page
      .locator(`[data-story="${type}"]`)
      .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo({ top: y - innerHeight, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(0);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
    await expect.poll(progress).toBe(1);
    await expect(page.locator('.story-steps li').nth(2)).toHaveClass(/is-current/);
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
    await page.waitForTimeout(800);
    expect(
      (
        await new AxeBuilder({ page })
          .exclude('astro-dev-toolbar')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (info.project.name === 'chromium')
      await page.screenshot({ path: info.outputPath(`wedding-${type}-${width}.png`) });
  });
}

for (const type of supplierTypes) {
  test(`every scroll scene runs in order above the contact bar on a 375 × 812 phone (${type})`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${route}?name=Sarah%27s%20Studio&area=Dundee&ref=L-TEST&type=${type}`);
    await page.addStyleTag({ content: noBar });
    await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
    if (type === 'florist') await expect(page.locator('.hero-art')).toHaveClass(/is-live/);
    const scenes = {
      story: `[data-story="${type}"]`,
      gallery: `.tile[data-only="${type}"]`,
      packages: `[data-packages="${type}"]`,
      timeline: '[data-timeline]',
    };
    const barTop = (await page.locator('.mobile-contact').boundingBox())!.y;
    const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const log: Record<string, [number, number]>[] = [];
    for (let y = 0; y <= height; y += 20) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
      log.push(
        await page.evaluate((scenes) => {
          const state = (window as any).weddingMotion.scenes;
          return Object.fromEntries(
            Object.entries(scenes).map(([key, selector]) => [
              key,
              [state[key], document.querySelector(selector)!.getBoundingClientRect().top],
            ]),
          );
        }, scenes),
      );
    }
    let previousStart = -1;
    for (const key of Object.keys(scenes)) {
      const values = log.map((row) => row[key][0]);
      for (let i = 1; i < values.length; i++)
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      const start = values.findIndex((value) => value > 0);
      const end = values.findIndex((value) => value >= 1);
      expect(start, key).toBeGreaterThan(-1);
      expect(end, key).toBeGreaterThan(start);
      expect(log[start][key][1], key).toBeLessThan(barTop);
      expect(start, key).toBeGreaterThan(previousStart);
      expect((end - start) * 20, key).toBeGreaterThanOrEqual(240);
      previousStart = start;
    }
    info.attachments.push({
      name: `scenes-${type}.json`,
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(log)),
    });
    // Timeline dots are all reached and every line segment drawn by the bottom.
    await expect(page.locator('.timeline-step.is-reached')).toHaveCount(4);
    if (type === 'florist') {
      await expect(page.locator('.hero-art')).not.toHaveClass(/is-live/);
      expect(
        await page
          .locator('[data-only="florist"] .petals i')
          .first()
          .evaluate((node) => node.getAnimations().map((a) => a.playState)),
      ).toEqual(['paused']);
    }
    // The final screen's delight: falling sprinkles/petals, or a developing print.
    await page.locator('.mobile-contact [data-book]').click();
    await page.getByRole('button', { name: 'Next: your day' }).click();
    await page.getByRole('button', { name: 'Check availability' }).click();
    await expect(page.locator('.checked-card')).toBeVisible();
    const delight = await page.evaluate(() => ({
      pieces: [...document.querySelectorAll('.confetti i')].filter((n) => n.getAnimations().length)
        .length,
      develop: document.querySelector('.develop')!.getAnimations().length,
    }));
    expect(delight).toEqual(
      type === 'photographer' ? { pieces: 0, develop: 1 } : { pieces: 24, develop: 0 },
    );
    // Calendar highlights filled when step 1 opened.
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator('html')).not.toHaveClass(/reveal-ready/);
    await expect
      .poll(() => page.evaluate(() => (window as any).weddingMotion.scenes))
      .toEqual({ story: 1, gallery: 1, packages: 1, timeline: 1 });
    expect(
      await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      ),
    ).toBe(0);
    await expect(page.locator('.hero-art')).not.toHaveClass(/is-live/);
  });
}

for (const type of supplierTypes) {
  test(`letter link on a 375 × 812 phone (${type}): instant hero, continuous scroll, tap-through`, async ({
    browser,
  }, info) => {
    const link = `${letter}&type=${type}`;
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(link, { waitUntil: 'commit' });
    await page.waitForSelector('.hero .button', { state: 'attached' });
    await page.waitForTimeout(Math.max(0, 300 - (Date.now() - start)));
    await page.screenshot({ path: info.outputPath(`letter-${type}-300ms.png`) });
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
    for (const agency of await page.locator('[data-agency-link]').all())
      expect(
        new URL((await agency.getAttribute('href'))!, page.url()).searchParams.get('ref'),
      ).toBe('L-TEST');
    await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
    const top = await page
      .locator(`[data-story="${type}"]`)
      .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    const log: [number, number][] = [];
    for (let y = top - 900, i = 0; y < top + 200; y += 8 + ((i++ * 13) % 33)) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(24);
      log.push([y, await page.evaluate(() => (window as any).weddingMotion.progress)]);
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
      name: `scroll-progress-${type}.json`,
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
    await page.getByRole('button', { name: 'Next: your day' }).click();
    await page.getByRole('button', { name: 'Check availability' }).click();
    await expect(page.locator('#date-final')).toContainText('Demo only — nothing is sent.');
    await expect(page.locator('#date-final [data-brief-link]')).toContainText(
      "Want this for Jay's Cuts & Co?",
    );
    expect(
      new URL(
        (await page.locator('#date-final [data-brief-link]').getAttribute('href'))!,
        page.url(),
      ).searchParams.get('ref'),
    ).toBe('L-TEST');
    expect(
      await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
    ).toEqual([[], []]);
    await context.close();
    const offline = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const still = await offline.newPage();
    await still.goto(link);
    await expect(still.locator('h1')).toBeVisible();
    await expect(still.locator('.hero .button')).toBeVisible();
    await expect(still.locator('.story-steps li')).toHaveCount(3);
    await expect(still.locator('.timeline-step')).toHaveCount(4);
    await expect(still.locator('noscript a')).toHaveAttribute('href', '/contact/');
    await still.screenshot({ path: info.outputPath(`letter-${type}-no-js.png`) });
    await offline.close();
  });
}
