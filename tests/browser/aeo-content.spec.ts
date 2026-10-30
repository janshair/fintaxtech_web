import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});

for (const width of [390, 1440]) {
  test(`service answers are readable, keyboard accessible and lead to relevant guidance at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const examples = [
      ['branding', 'How are concepts and revisions agreed?', 'consolidated feedback list'],
      ['websites', 'Is website copy included?', 'approved Website Content File'],
      ['mobile-apps', 'Can my app work without an internet connection?', 'synchronisation'],
      ['ai-automation', 'Will a person still need to review the results?', 'exception handling'],
    ];
    for (const [service, question, answer] of examples) {
      await page.goto(`/services/${service}/`);
      const summary = page.locator('summary').filter({ hasText: question });
      await summary.focus();
      await page.keyboard.press('Enter');
      const details = summary.locator('..');
      await expect(details).toHaveAttribute('open', '');
      await expect(details.locator('p')).toBeVisible();
      await expect(details).toContainText(answer);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    await page.getByRole('link', { name: 'How project scope and pricing are agreed' }).click();
    await expect(
      page.getByRole('heading', { name: 'What determines the price of AI automation?' }),
    ).toBeVisible();
    await expect(page.locator('main')).toContainText('do not commission work');
  });
}

test('published project evidence and the article answer are available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/selected-work/');
  await expect(page.getByRole('heading', { name: 'What did FinTaxTech deliver?' })).toBeVisible();
  await expect(page.locator('main')).toContainText('not a measurement of enquiry growth or sales');
  await page.goto('/blog/does-your-app-need-to-work-offline/');
  await expect(page.locator('.article-body > p').first()).toContainText(
    'Your app needs offline support when',
  );
  await expect(page.locator('.article-meta')).toContainText('2026');
  await context.close();
});
