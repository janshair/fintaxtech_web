import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { home, company, ui } from '../../src/content/site';
import { services, serviceVisuals } from '../../src/content/services';
import { featuredWork } from '../../src/content/work';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});

test('homepage explains all services, keeps the CTAs and presents genuine work', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(home.title);
  await expect(page.locator('.hero .eyebrow')).toHaveText(company.tagline);
  await expect(page.locator('.hero .lead')).toHaveText(home.intro);
  await expect(page.locator('.hero').getByRole('link', { name: ui.choose })).toHaveAttribute(
    'href',
    '#choose',
  );
  await expect(page.locator('.hero').getByRole('link', { name: ui.how })).toHaveAttribute(
    'href',
    '/how-it-works/',
  );
  await expect(page.locator('.steps li')).toHaveText([
    'Choose what you need',
    'Answer straightforward questions',
    'Receive a clear proposal',
  ]);
  for (const service of services) {
    const card = page.locator(`.service-card[href="/services/${service.id}/"]`);
    await expect(card.locator('p')).toHaveText(service.description);
    await expect(card.getByRole('img')).toHaveAccessibleName(serviceVisuals[service.id]);
    expect(await card.locator('svg').getAttribute('viewBox')).toBe('0 0 240 160');
  }
  const work = page.locator('.home-work');
  await expect(work.locator('.project-preview')).toHaveCount(2);
  await expect(work.locator('blockquote')).toHaveText(featuredWork.feedback.quote);
  await expect(work.locator('figcaption')).toContainText(featuredWork.feedback.attribution);
  await expect(work.locator('a[href="/metoni/"]')).toHaveCount(1);
  await expect(work.locator('a[href="/selected-work/"]')).toHaveCount(2);
  for (const img of await work.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute('alt', /\S/);
    expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0);
    await expect
      .poll(() => img.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);
  }
});

for (const width of [320, 390, 768, 1440]) {
  test(`homepage clarity, images and accessibility at ${width}px in both themes`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await page.locator('.home-work').scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page
            .locator('.home-work img')
            .evaluateAll((images) => images.every((img) => (img as HTMLImageElement).complete)),
        )
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      if (testInfo.project.name === 'chromium') {
        await page.screenshot({
          path: testInfo.outputPath(`homepage-${width}-${theme}.png`),
          fullPage: true,
        });
        await page
          .locator('.home-work')
          .screenshot({ path: testInfo.outputPath(`work-${width}-${theme}.png`) });
      }
    }
  });
}
