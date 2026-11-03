import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { automotiveDemo as c } from '../../src/content/automotive-demo';
const named = '?name=Tayside%20Motorworks&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER03';
const move = async (page: import('@playwright/test').Page, top: number) => {
  await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), top);
  await page.waitForTimeout(100);
};
for (const width of [320, 375, 390, 768, 1440]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`automotive layout ${width}px ${reducedMotion}, sample and personalised`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      for (const query of ['', named]) {
        await page.goto(c.route + query);
        await page.waitForTimeout(2400);
        await expect(page.locator('.hero-identity [data-business]')).toHaveText(
          query ? 'Tayside Motorworks' : c.name,
        );
        await expect(page.locator('#name-dialog')).not.toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (width === 390) {
          // Both hero actions sit above the fold and the sticky bar.
          const actions = (await page.locator('.hero-actions').boundingBox())!;
          expect(actions.y + actions.height).toBeLessThan(769);
        }
        if (query) {
          const top = await page
            .locator('#workshop')
            .evaluate((node) => node.getBoundingClientRect().top + scrollY);
          for (const offset of [0, 200, 400]) {
            await move(page, top + offset);
            const art = (await page.locator('.workshop-stage').boundingBox())!;
            const text = (await page.locator('.steps').boundingBox())!;
            expect(art.y + art.height).toBeLessThanOrEqual(text.y + 1);
          }
          if (width < 768)
            expect((await page.locator('#workshop').boundingBox())!.height).toBeLessThan(930);
          await page.locator('footer').scrollIntoViewIfNeeded();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          const name = (await page.locator('footer [data-business]').boundingBox())!;
          expect(name.width).toBeGreaterThan(100);
          if (width < 768) expect(name.height).toBeLessThan(30);
        }
      }
      expect(errors).toEqual([]);
    });
  }
}
for (const width of [320, 390, 768, 1440]) {
  test(`automotive safe names, phones and privacy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const requests: import('@playwright/test').Request[] = [];
    page.on('request', (req) => requests.push(req));
    for (const name of [
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
            name,
            area: 'Broughty Ferry',
            phone: '+44 1382 000000',
            ref: 'LETTER03',
          }),
      );
      for (const node of await page.locator('[data-business]').all())
        await expect(node).toHaveText(name.trim() || c.name);
      await expect(page).toHaveTitle((name.trim() || c.name) + c.titleSuffix);
      await expect(page.locator('[data-business] img')).toHaveCount(0);
      await expect(page.locator('#name-dialog')).not.toBeVisible();
      for (const node of await page.locator('[data-phone-text]').all())
        await expect(node).toHaveText('01382 000000');
      for (const node of await page.locator('[data-call]').all())
        await expect(node).toHaveAttribute('href', 'tel:+441382000000');
      for (const node of await page.locator('[data-whatsapp]').all())
        await expect(node).toHaveAttribute('href', 'https://wa.me/441382000000');
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://fintaxtech.co.uk' + c.route,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await page.locator('footer [data-business]').boundingBox())!.width).toBeGreaterThan(
        name === 'The' ? 20 : 100,
      );
    }
    for (const req of requests) {
      if (!req.isNavigationRequest()) {
        expect(req.url()).not.toMatch(/Broughty|1382|LETTER03|Jay/);
        expect(await req.headerValue('referer')).toBeNull();
      }
      expect(req.postData()).toBeNull();
      expect(new URL(req.url()).origin).toBe('http://localhost:4323');
    }
    expect(
      await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
    ).toEqual([[], []]);
  });
}

test('every service fills the free quote form, validates details and sends nothing', async ({
  page,
}) => {
  await page.goto(c.route + named);
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  const form = page.locator('#quote-form');
  const final = page.locator('#quote-final');
  for (const item of c.services.items) {
    await page.locator(`.service-row[data-service=${item.code}]`).click();
    await expect(page.locator('#quote-service')).toHaveValue(item.code);
    await expect(page.locator('#quote-plate')).toBeFocused();
    await page.getByRole('button', { name: c.quote.submit }).click();
    await expect(final).not.toBeVisible();
    for (const field of ['plate', 'name', 'phone'])
      await expect(page.locator(`#quote-${field}`)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#quote-plate')).toBeFocused();
    await page.locator('#quote-form').getByLabel(c.quote.plateLabel).fill('ab12 cde');
    await page.locator('#quote-form').getByLabel(c.quote.nameLabel).fill('Sam');
    await page.locator('#quote-form').getByLabel(c.quote.phoneLabel).fill('12345');
    await page.getByRole('button', { name: c.quote.submit }).click();
    await expect(page.locator('#quote-phone')).toBeFocused();
    await expect(page.locator('#quote-plate-error')).toBeHidden();
    await expect(page.locator('#quote-phone-error')).toHaveText(c.quote.errors.phone);
    await page.locator('#quote-form').getByLabel(c.quote.phoneLabel).fill('07700 900123');
    await page.getByRole('button', { name: c.quote.submit }).click();
    await expect(form).not.toBeVisible();
    await expect(page.locator('#quote-final h3')).toBeFocused();
    await expect(page.locator('#quote-final .demo-result')).toHaveText(c.quote.thanks);
    await expect(page.locator('#quote-summary')).toHaveText(`${item.name} · AB12 CDE`);
    await expect(page.locator('.final-offer')).toHaveText(
      'Want this for Tayside Motorworks? Talk to FinTaxTech',
    );
    // The final offer opens the template brief; /contact/ stays as the secondary link.
    await expect(page.locator('.final-offer')).toHaveAttribute(
      'href',
      '/client/website-brief/templates/?template=automotive-03&name=Tayside+Motorworks&area=Broughty+Ferry&phone=01382+000000&ref=LETTER03',
    );
    await expect(page.locator('#quote-final .brief-contact')).toHaveAttribute(
      'href',
      'http://localhost:4323/contact/?ref=LETTER03',
    );
    expect(page.url()).not.toMatch(/AB12|Sam|07700/);
    await page.getByRole('button', { name: c.quote.again }).click();
    await expect(form).toBeVisible();
    await expect(page.locator('#quote-plate')).toHaveValue('');
    await expect(page.locator('#quote-plate')).toBeFocused();
  }
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[], []]);
});

test('fixed jobs show prices, repairs only say free quote', async ({ page }) => {
  await page.goto(c.route);
  const rows = page.locator('.service-row');
  await expect(rows.locator('h3')).toHaveText(c.services.items.map((item) => item.name));
  await expect(page.locator('#quote-service option')).toHaveText(
    c.services.items.map((item) => item.name),
  );
  await expect(page.locator('[data-service=mot] .service-price')).toHaveText('£54.85');
  await expect(page.locator('.mot-price strong')).toHaveText('£54.85');
  for (const code of ['brakes', 'clutch', 'timing-belt']) {
    const price = page.locator(`.service-row[data-service=${code}]`);
    await expect(price).toHaveAttribute('data-repair', '');
    await expect(price.locator('.service-price')).toHaveText('Free quote');
    await expect(price).not.toContainText('£');
  }
  for (const row of await page.locator('.service-row[data-repair]').all())
    await expect(row.locator('.service-price')).toHaveText('Free quote');
  await expect(page.locator('main')).not.toContainText(/maintenance package|auto care solution/i);
});

test('MOT section, reminder form, hero buttons and hidden accreditation slots', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(c.route + named);
  await page.locator('[data-hero-mot]').click();
  await expect(page.locator('#mot')).toBeInViewport();
  await expect(page.locator('.mot-approval')).toHaveText(c.mot.approval);
  await expect(page.locator('.mot-retest strong')).toHaveText(c.mot.retest);
  await page.getByRole('button', { name: c.mot.reminder.submit }).click();
  await expect(page.locator('#reminder-plate')).toBeFocused();
  await expect(page.locator('#reminder-thanks')).not.toBeVisible();
  await page.locator('#reminder-plate').fill('AB12CDE');
  await page.locator('#reminder-phone').fill('07700 900123');
  await page.getByRole('button', { name: c.mot.reminder.submit }).click();
  await expect(page.locator('#reminder-thanks .demo-result')).toHaveText(c.mot.reminder.thanks);
  await expect(page.locator('#reminder-thanks .demo-result')).toBeFocused();
  await page.getByRole('button', { name: c.mot.reminder.again }).click();
  await expect(page.locator('#reminder-plate')).toHaveValue('');
  // The MOT button preselects MOT in the quote form.
  await page.locator('.mot-intro [data-service=mot]').click();
  await expect(page.locator('#quote-service')).toHaveValue('mot');
  await page.goto(c.route);
  await page.locator('.hero-actions [data-quote]').click();
  await expect(page.locator('#quote-form')).toBeInViewport();
  // Tapping a link is not the visitor's own scroll, so the name prompt stays closed.
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await expect(page.locator('.trust-grid h3')).toHaveText(c.trust.items.map(([title]) => title));
  await expect(page.locator('.accreditations')).toBeHidden();
  for (const slot of await page.locator('.accreditation-slot').all())
    await expect(slot).toBeHidden();
  await expect(page.locator('.visit-info dl')).toContainText('Saturday');
  await expect(page.locator('.drop-off')).toHaveText(c.visit.dropOff);
});

test('URL name, area and phone fill the garage details; the map loads only on request', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(c.route + '?name=B%26T%20Autos&area=Dundee&phone=01382%20221621');
  await expect(page).toHaveTitle('B&T Autos' + c.titleSuffix);
  await expect(page.locator('.garage-header [data-business]')).toHaveText('B&T Autos');
  await expect(page.locator('footer [data-business]')).toHaveText('B&T Autos');
  await expect(page.locator('[data-monogram]').first()).toHaveText('BT');
  await expect(page.locator('.hero-identity')).toHaveText('B&T Autos · Dundee');
  await expect(page.locator('.map-area')).toHaveText('Dundee');
  for (const node of await page.locator('[data-phone-text]').all())
    await expect(node).toHaveText('01382 221621');
  for (const node of await page.locator('[data-call]').all())
    await expect(node).toHaveAttribute('href', 'tel:+441382221621');
  for (const node of await page.locator('[data-whatsapp]').all())
    await expect(node).toHaveAttribute('href', 'https://wa.me/441382221621');
  await page.goto(c.route + '?phone=07700%20900123');
  await expect(page.locator('.mobile-actions [data-whatsapp]')).toHaveAttribute(
    'href',
    'https://wa.me/447700900123',
  );
  await expect(page.locator('[data-map-load]')).toBeHidden();
  await page.goto(c.route + '?area=Dundee');
  expect(requests.filter((url) => !url.startsWith('http://localhost:4323'))).toEqual([]);
  await expect(page.locator('.map-frame')).toHaveCount(0);
  await page.getByRole('button', { name: c.visit.showMap }).click();
  await expect(page.locator('.map-frame')).toHaveAttribute(
    'src',
    'https://www.google.com/maps?q=Dundee&output=embed',
  );
  // The sticky bar never covers the end of the page.
  await move(page, await page.evaluate(() => document.body.scrollHeight));
  const bar = (await page.locator('.mobile-actions').boundingBox())!;
  const offer = (await page.locator('.agency-offer').boundingBox())!;
  expect(offer.y + offer.height).toBeLessThanOrEqual(bar.y);
});

test('delayed prompt, edit, restore, first scroll, invalid inputs and history', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(c.route);
  await page.clock.fastForward(4900);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.clock.fastForward(200);
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.getByLabel(c.nameDialog.label, { exact: true }).fill("Jay's Garage & Co");
  await page.getByRole('button', { name: c.nameDialog.submit }).click();
  expect(new URL(page.url()).searchParams.get('name')).toBe("Jay's Garage & Co");
  await page.clock.fastForward(10000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: c.edit }).click();
  await page.getByRole('button', { name: c.nameDialog.reset }).click();
  expect(new URL(page.url()).searchParams.has('name')).toBe(false);
  await page.clock.fastForward(6000);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
  await page.goto(c.route + '?name=Alpha&area=Dundee');
  await page.goto(c.route + '?name=Beta&area=London');
  await page.goBack();
  await expect(page.locator('.hero-identity')).toHaveText('Alpha · Dundee');
  await page.goForward();
  await expect(page.locator('.hero-identity')).toHaveText('Beta · London');
  await page.goto(c.route + '?name=%20&phone=javascript:alert(1)&area=%20&ref=bad%40ref');
  await expect(page.locator('[data-business]').first()).toHaveText(c.name);
  await expect(page.locator('[data-call]').first()).toHaveAttribute('href', '#contact-details');
  for (const node of await page.locator('[data-phone-text]').all())
    await expect(node).toHaveText(c.visit.phone);
  await expect(page.locator('.agency-contact').first()).toHaveAttribute(
    'href',
    'http://localhost:4323/contact/',
  );
  await page.goto(c.route);
  await page.mouse.wheel(0, 100);
  await expect(page.locator('#name-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.mouse.wheel(0, 100);
  await expect(page.locator('#name-dialog')).not.toBeVisible();
});

for (const width of [390, 1440])
  test(`road story phases, before/after and live reduced motion at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(c.route + named);
    await expect(page.locator('.hero-art')).toHaveClass(/ambient-active/);
    const scene = page.locator('#workshop');
    // The illustration stays in normal flow: its pass starts as its top enters the viewport
    // and finishes when its centre reaches 35% of the viewport height.
    const stage = await page.locator('.workshop-stage > .automotive-art').evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top + scrollY, height: rect.height };
    });
    const length = 844 * 0.65 + stage.height / 2;
    const start = stage.top - 844;
    const value = (key: string) =>
      scene.evaluate((node, key) => Number(node.style.getPropertyValue(key)), key);
    await move(page, start + length * 0.2);
    expect(await value('--scan')).toBeGreaterThan(0.9);
    await expect(page.locator('.steps li').first()).toHaveClass(/step-current/);
    await move(page, start + length * 0.5);
    expect(await value('--tool')).toBeGreaterThan(0.9);
    await expect(page.locator('.steps li').nth(1)).toHaveClass(/step-current/);
    await move(page, start + length * 0.98);
    expect(await value('--check')).toBeGreaterThan(0.85);
    await expect(page.locator('.steps li').last()).toHaveClass(/step-current/);
    await expect(page.locator('.hero-art')).not.toHaveClass(/ambient-active/);
    for (const card of await page.locator('.work figure').all()) {
      const top = await card.evaluate((node) => node.getBoundingClientRect().top + scrollY);
      await move(page, top - 844 * 0.8 + 844 * 0.4 * 0.1);
      await expect(card.locator('[data-work-state]')).toHaveText(c.work.before);
      await move(page, top - 844 * 0.8 + 844 * 0.4 * 0.95);
      await expect(card.locator('[data-work-state]')).toHaveText(c.work.after);
    }
    await move(page, await page.evaluate(() => document.body.scrollHeight));
    expect(
      await page
        .locator('html')
        .evaluate((node) => Number(node.style.getPropertyValue('--road-progress'))),
    ).toBeGreaterThan(0.99);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('html')).not.toHaveClass(/motion-ready/);
    expect(
      await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      ),
    ).toBe(0);
    for (const state of await page.locator('[data-work-state]').all())
      await expect(state).toHaveText(c.work.after);
    await move(page, 0);
    expect(await value('--service-progress')).toBe(1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('html')).toHaveClass(/motion-ready/);
  });

test('accessible page, menu, keyboard quote and no-JavaScript content', async ({
  page,
  browser,
}) => {
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
  await page.locator('.hero-copy [data-quote]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quote-form')).toBeInViewport();
  await page.locator('#quote-form').getByLabel(c.quote.plateLabel).fill('DEMO 01');
  await page.locator('#quote-form').getByLabel(c.quote.nameLabel).fill('Sam');
  await page.locator('#quote-form').getByLabel(c.quote.phoneLabel).fill('01382 000000');
  await page.locator('#quote-form').getByLabel(c.quote.phoneLabel).press('Enter');
  await expect(page.locator('#quote-final h3')).toBeFocused();
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
  await expect(staticPage.locator('.work figure')).toHaveCount(3);
  await context.close();
});
