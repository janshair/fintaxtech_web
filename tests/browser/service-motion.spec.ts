import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { services, serviceCopy } from '../../src/content/services';
import { serviceMotion } from '../../src/content/service-motion';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});

for (const service of services) {
  test(`${service.id}: approved copy, SEO, once-only motion, pause and keyboard CTA`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/services/${service.id}/`);
    await expect(page.locator('h1')).toHaveText(service.title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.service-heading-copy .lead')).toHaveText(
      service.intro ?? service.description,
    );
    for (const copy of [
      ...service.capabilities,
      service.suits,
      service.boundary,
      service.ownership,
    ]) {
      await expect(page.locator('main')).toContainText(copy);
    }
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk/services/${service.id}/`,
    );
    await expect(page.locator('meta[name=robots]')).toHaveCount(0);
    await expect(page.locator('[data-home-motion]')).toHaveCount(2);
    const hero = page.locator('[data-service-hero]');
    const flow = page.locator('[data-service-outcome]');
    await expect(hero).toHaveAccessibleName(serviceMotion[service.id].heroLabel);
    await expect(flow).toHaveAccessibleName(serviceMotion[service.id].outcomeLabel);
    await expect(flow.locator('li')).toHaveText(serviceMotion[service.id].steps);
    await hero.scrollIntoViewIfNeeded();
    await expect(hero).toHaveAttribute('data-motion-state', 'running');
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );
    await expect(hero).toHaveAttribute('data-motion-state', 'paused');
    const times = await hero.evaluate(async (node) => {
      const animations = node.getAnimations({ subtree: true });
      // CSS pause takes effect on the next animation frame; await that transition
      // before measuring elapsed time instead of sampling a pending pause.
      await Promise.all(animations.map((animation) => animation.ready));
      return animations.map((animation) => animation.currentTime);
    });
    await page.waitForTimeout(100);
    expect(
      await hero.evaluate((node) =>
        node.getAnimations({ subtree: true }).map((a) => a.currentTime),
      ),
    ).toEqual(times);
    for (const scene of [hero, flow]) {
      await scene.scrollIntoViewIfNeeded();
      const initial = await scene.boundingBox();
      await expect(scene).toHaveAttribute('data-motion-state', 'finished');
      const final = await scene.boundingBox();
      expect(final?.width).toBe(initial?.width);
      expect(final?.height).toBe(initial?.height);
      expect(await scene.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
    }
    await hero.scrollIntoViewIfNeeded();
    await expect(hero).toHaveAttribute('data-motion-state', 'finished');
    const cta = page
      .locator('.service-heading-copy')
      .getByRole('link', { name: serviceCopy.lead, exact: true });
    await cta.focus();
    await expect(cta).toBeFocused();
    await cta.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/enquiry/\\?service=${service.id}`));
    expect(errors).toEqual([]);
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`${service.id}: accessible responsive visuals at ${width}px in both themes`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/services/${service.id}/`);
      await page.evaluate(() => document.fonts.ready);
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        const hero = page.locator('[data-service-hero]');
        for (const scene of [hero, page.locator('[data-service-outcome]')]) {
          await expect(scene).toHaveAttribute('data-motion-state', 'finished');
          expect(await scene.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(
            0,
          );
          await scene.scrollIntoViewIfNeeded();
          const box = await scene.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        }
        if (width < 1024) {
          const copy = await page.locator('.service-heading-copy').boundingBox();
          const art = await hero.boundingBox();
          expect(art!.y).toBeGreaterThan(copy!.y + copy!.height);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const audit = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(audit.violations).toEqual([]);
        if (testInfo.project.name === 'chromium') {
          await page
            .locator('.service-page-hero')
            .screenshot({ path: testInfo.outputPath(`hero-${service.id}-${width}-${theme}.png`) });
          await page.locator('[data-service-outcome]').screenshot({
            path: testInfo.outputPath(`outcome-${service.id}-${width}-${theme}.png`),
          });
        }
      }
    });
  }
}

test('all service diagrams remain complete without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const service of services) {
    await page.goto(`http://localhost:4323/services/${service.id}/`);
    await expect(page.locator('[data-service-hero]')).toHaveAccessibleName(
      serviceMotion[service.id].heroLabel,
    );
    await expect(page.locator('[data-service-hero] [data-motion-end]')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-service-outcome] li')).toHaveText(
      serviceMotion[service.id].steps,
    );
    await expect(page.locator('.outcome-link').first()).toHaveCSS('transform', 'none');
  }
  await context.close();
});
