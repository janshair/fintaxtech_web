import { test, expect } from '@playwright/test';
import { legacyRedirects } from '../../src/content/legacy-redirects';

for (const redirect of legacyRedirects) {
  test(`${redirect.route} forwards to the replacement and preserves suffix and history`, async ({
    page,
  }) => {
    const suffix = '?utm_source=old-link&tag=a&tag=b&encoded=%2F%26#details';
    await page.goto('/about/');
    expect((await page.goto(redirect.route + suffix))?.status()).toBe(200);
    await expect(page).toHaveURL(redirect.destination + suffix);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://fintaxtech.co.uk' + redirect.destination,
    );
    await expect(page.locator('[data-static-redirect]')).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL('/about/');
  });

  test(`${redirect.route} has a crawlable fallback and is excluded from the sitemap`, async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    expect((await page.goto('http://localhost:4323' + redirect.route))?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(redirect.title);
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://fintaxtech.co.uk' + redirect.destination,
    );
    const link = page.getByRole('link', { name: redirect.label, exact: true });
    await expect(link).toHaveAttribute('href', redirect.destination);
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('http://localhost:4323' + redirect.destination);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain(`<loc>https://fintaxtech.co.uk${redirect.route}</loc>`);
    expect(sitemap).toContain(`<loc>https://fintaxtech.co.uk${redirect.destination}</loc>`);
    await context.close();
  });
}
