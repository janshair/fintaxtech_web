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
          const primary = (await page.locator('.hero-copy [data-quote]').boundingBox())!;
          expect(primary.y + primary.height).toBeLessThan(769);
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
      await expect(page.locator('[data-phone-text]')).toHaveText('+44 1382 000000');
      await expect(page.locator('[data-call]').first()).toHaveAttribute(
        'href',
        'tel:+441382000000',
      );
      await expect(page.locator('[data-whatsapp]')).toHaveAttribute(
        'href',
        'https://wa.me/441382000000',
      );
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

test('all six services finish the sample quote flow, validate details and send nothing', async ({
  page,
}) => {
  await page.goto(c.route + named);
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  for (const item of c.services.items) {
    const trigger = page.locator(`[data-service=${item.code}]`);
    await trigger.click();
    await expect(page.locator('#quote-service')).toBeFocused();
    await expect(page.locator('#quote-service')).toHaveValue(item.code);
    await page.getByRole('button', { name: c.request.next, exact: false }).click();
    await expect(page.locator('#car-form h3')).toBeFocused();
    await page.getByRole('button', { name: c.request.confirm, exact: false }).click();
    await expect(page.locator('#sample-registration')).toBeFocused();
    await expect(page.locator('#quote-final')).not.toBeVisible();
    await page.getByLabel(c.request.registrationLabel).fill('   ');
    await page.getByLabel(c.request.dayLabel).selectOption('Friday');
    await page.getByRole('button', { name: c.request.confirm, exact: false }).click();
    await expect(page.locator('#quote-final')).not.toBeVisible();
    await page.getByLabel(c.request.registrationLabel).fill('demo 01');
    await page.getByRole('button', { name: c.request.confirm, exact: false }).click();
    await expect(page.locator('#quote-final h3')).toBeFocused();
    await expect(page.locator('#quote-summary')).toHaveText(`${item.name} · DEMO 01 · Friday`);
    await expect(page.locator('.demo-result')).toHaveText(c.request.final);
    await expect(page.locator('.final-offer')).toHaveText(
      'Want this for Tayside Motorworks? Talk to FinTaxTech',
    );
    await expect(page.locator('.final-offer')).toHaveAttribute(
      'href',
      'http://localhost:4323/contact/?ref=LETTER03',
    );
    expect(page.url()).not.toContain('DEMO');
    await page.getByRole('button', { name: c.request.restart }).click();
    await expect(page.locator('#quote-service')).toBeFocused();
    await expect(page.locator('#sample-registration')).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  expect(requests).toEqual([]);
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
  await expect(page.locator('[data-phone-text]')).toHaveText(c.visit.phone);
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
    const sceneTop = await scene.evaluate((node) => node.getBoundingClientRect().top + scrollY);
    const stageTop = await page
      .locator('.workshop-stage')
      .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    const length = width < 768 ? 844 * 0.6 : (await scene.boundingBox())!.height - 844;
    const start = width < 768 ? stageTop - 844 * 0.7 : sceneTop;
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
  await page.getByRole('button', { name: c.request.next, exact: false }).click();
  await page.getByLabel(c.request.registrationLabel).fill('DEMO 01');
  await page.getByLabel(c.request.dayLabel).selectOption('Flexible');
  await page.getByRole('button', { name: c.request.confirm, exact: false }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hero-copy [data-quote]')).toBeFocused();
  await expect(page.locator('#sample-registration')).toHaveValue('');
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
