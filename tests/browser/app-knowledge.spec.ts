import { test, expect } from '@playwright/test';
import { appKnowledge } from '../../src/content/app-knowledge';

for (const app of appKnowledge) {
  test(`${app.name}: static HTML answers match the linked text summary`, async ({
    browser,
    request,
  }) => {
    const response = await request.get(app.llmsRoute);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    const text = await response.text();
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(app.route);
    await expect(page.locator('link[rel=describedby]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk${app.llmsRoute}`,
    );
    const section = page.locator('.app-questions');
    for (const [question, answer] of app.questions) {
      const summary = section.locator('summary').filter({ hasText: question });
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(summary.locator('..').locator('p')).toHaveText(answer);
      await expect(summary.locator('..').locator('p')).toBeVisible();
      expect(text).toContain(answer);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(section.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      app.privacyRoute,
    );
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk${app.route}`,
    );
    await context.close();
  });
}
