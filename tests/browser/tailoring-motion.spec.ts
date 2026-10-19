import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { tailoringDemo as c } from '../../src/content/tailoring-demo';
const named = '?name=Tayside%20Alterations&area=Broughty%20Ferry&phone=01382%20000000&ref=LETTER02';
const move = async (page: import('@playwright/test').Page, top: number) => {
  await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), top);
  await page.waitForTimeout(80);
};
for (const width of [320, 375, 390, 768, 1440]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`one thread layout ${width}px, ${reducedMotion}, default and personalised`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      for (const query of ['', named]) {
        await page.goto(c.route + query);
        await expect(page.locator('.hero-identity [data-business]')).toHaveText(
          query ? 'Tayside Alterations' : c.name,
        );
        await page.waitForTimeout(2450);
        await expect(page.locator('html')).not.toHaveClass(/load-sequence/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (width === 390) {
          const primary = await page.locator('.hero-copy [data-book]').boundingBox();
          expect(primary!.y + primary!.height).toBeLessThan(769);
        }
        if (query) {
          const position = await page
            .locator('#process')
            .evaluate((node) => node.getBoundingClientRect().top + scrollY);
          await move(page, position);
          const art = (await page.locator('.seam-art').boundingBox())!;
          const text = (await page.locator('.steps').boundingBox())!;
          expect(art.y + art.height).toBeLessThan(text.y);
          if (width < 768) {
            expect((await page.locator('#process').boundingBox())!.height).toBeLessThan(930);
            const bar = (await page.locator('.mobile-actions').boundingBox())!;
            expect(art.y + art.height).toBeLessThan(bar.y);
          }
          await page.locator('footer').scrollIntoViewIfNeeded();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

test('load stitches the literal name; edits replay only that name and all controls stay usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(c.route + named);
  await expect(page.locator('.name-word').first()).toHaveText('Tayside');
  await expect(page.locator('.hero-identity')).toHaveClass(/name-sewing/);
  await page.locator('.hero-copy [data-book]').click();
  await expect(page.locator('#booking-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: c.edit }).click();
  await page.getByLabel(c.nameDialog.label, { exact: true }).fill("Jay's <Tailor> & Co");
  await page.getByRole('button', { name: c.nameDialog.submit }).click();
  await expect(page.locator('.hero-identity')).toHaveClass(/name-sewing/);
  await expect(page.locator('.hero-identity [data-business]')).toHaveText("Jay's <Tailor> & Co");
  await expect(page.locator('.hero-identity tailor')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/load-sequence/);
  expect(new URL(page.url()).searchParams.get('name')).toBe("Jay's <Tailor> & Co");
});

test('four fitting phases, garment transformations, thread finish and single bar entrance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(c.route + named);
  const sceneTop = await page
    .locator('.stitch-stage')
    .evaluate((node) => node.getBoundingClientRect().top + scrollY);
  const scene = page.locator('#process');
  const value = (key: string) =>
    scene.evaluate((node, key) => Number(node.style.getPropertyValue(key)), key);
  await move(page, sceneTop - 844 * 0.83);
  expect(await value('--measure')).toBeLessThan(0.1);
  await move(page, sceneTop - 844 * 0.83 + 844 * 0.64 * 0.35);
  expect(await value('--measure')).toBe(1);
  expect(await value('--pin')).toBeGreaterThan(0.7);
  await move(page, sceneTop - 844 * 0.83 + 844 * 0.64 * 0.9);
  expect(await value('--press')).toBeGreaterThan(0.45);
  await expect(page.locator('.steps li').last()).toHaveClass(/step-current/);
  await expect(page.locator('.mobile-actions')).toHaveClass(/bar-visible/);
  await page.waitForTimeout(650);
  await expect(page.locator('.mobile-actions')).not.toHaveClass(/bar-arrived/);
  await move(page, 0);
  await expect(page.locator('.mobile-actions')).not.toHaveClass(/bar-visible/);
  for (const card of await page.locator('.work figure').all()) {
    const top = await card.evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await move(page, top - 844 * 0.7 + 844 * 0.38 * 0.15);
    await expect(card.locator('[data-work-state]')).toHaveText(c.work.before);
    expect(
      Number(await card.evaluate((node) => node.style.getPropertyValue('--work-progress'))),
    ).toBeLessThan(0.2);
    await move(page, top - 844 * 0.7 + 844 * 0.38 * 0.95);
    await expect(card.locator('[data-work-state]')).toHaveText(c.work.after);
    expect(
      Number(await card.evaluate((node) => node.style.getPropertyValue('--work-progress'))),
    ).toBeGreaterThan(0.9);
  }
  await move(page, await page.evaluate(() => document.body.scrollHeight));
  await expect(page.locator('.agency-offer')).toHaveClass(/thread-finished/);
  await expect(page.locator('.mobile-actions')).not.toHaveClass(/bar-arrived/);
  expect(
    Number(
      await page
        .locator('html')
        .evaluate((node) => node.style.getPropertyValue('--thread-progress')),
    ),
  ).toBeGreaterThan(0.99);
});

test('ambient loops pause offscreen and when hidden; live reduced motion completes everything', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(c.route + named);
  await expect(page.locator('.hero-art')).toHaveClass(/ambient-active/);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.hero-art')).not.toHaveClass(/ambient-active/);
  await expect(page.locator('.jacket')).toHaveCSS('animation-play-state', 'paused');
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.hero-art')).toHaveClass(/ambient-active/);
  await page.locator('#work').scrollIntoViewIfNeeded();
  await expect(page.locator('.hero-art')).not.toHaveClass(/ambient-active/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/motion-ready/);
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
  for (const state of await page.locator('[data-work-state]').all())
    await expect(state).toHaveText(c.work.after);
  const seam = await page.locator('.needle').getAttribute('transform');
  await move(page, 0);
  await expect(page.locator('.needle')).toHaveAttribute('transform', seam!);
  await expect(page.locator('.story-thread path')).toHaveAttribute('d', /^M0/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveClass(/motion-ready/);
});

test('animated fitting remains keyboard accessible and the final tick sends nothing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(c.route + named);
  await page.waitForTimeout(2500);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('.hero-copy [data-book]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#booking-service')).toBeFocused();
  await page.getByRole('button', { name: c.booking.next + ' ↗', exact: true }).click();
  await page.getByRole('button', { name: c.booking.confirm + ' ↗', exact: true }).click();
  await expect(page.locator('.confirmation-thread')).toBeVisible();
  await page.waitForTimeout(800);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hero-copy [data-book]')).toBeFocused();
  expect(requests).toEqual([]);
});
