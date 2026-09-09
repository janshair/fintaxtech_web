import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { services } from '../../src/content/services';
import { selectorCopy } from '../../src/content/site';
for (const theme of ['light', 'dark'] as const) {
  test(`indexable sales page and noindex journey in ${theme}`, async ({
    page,
    request,
    browser,
  }) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    const response = await request.get('/start/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toMatch(/<meta[^>]+name="robots"[^>]+noindex/);
    await page.goto('/start/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(selectorCopy.title);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://fintaxtech.co.uk/start/',
    );
    await expect(page.locator('meta[name=robots]')).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap.match(/<loc>https:\/\/fintaxtech.co.uk\/start\/<\/loc>/g)).toHaveLength(1);
    expect(sitemap).not.toContain('/enquiry/');
    expect(sitemap).not.toContain('/promo/');
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(
      schema['@graph'].find((n: any) => n['@type'] === 'BreadcrumbList').itemListElement.at(-1)
        .item,
    ).toBe('https://fintaxtech.co.uk/start/');
    for (const service of services) {
      await page.goto('/start/');
      await page.locator(`[data-start-service="${service.id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/enquiry/\\?service=${service.id}`));
      await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
      await expect(page.locator('#questionnaire h1')).toHaveText(service.name);
    }
    await page.goto('/start/?service=branding&stage=2&brief=short');
    await expect(page).toHaveURL('/enquiry/?service=branding&stage=2&brief=short');
    const raw = await request.get('/enquiry/?service=websites');
    expect(await raw.text()).toContain('name="robots" content="noindex,follow"');
    const context = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await context.newPage();
    await staticPage.goto('http://localhost:4323/start/');
    await expect(staticPage.locator('h1')).toHaveText(selectorCopy.title);
    await expect(staticPage.locator('.service-card')).toHaveCount(4);
    await expect(
      staticPage.getByText(/Review your answers and generate a private enquiry PDF/),
    ).toBeVisible();
    await expect(staticPage.locator('#questionnaire')).toHaveCount(0);
    await context.close();
  });
}
