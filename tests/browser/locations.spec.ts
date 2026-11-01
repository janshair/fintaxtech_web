import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { locations } from '../../src/content/locations';
import { selectorCopy, ui } from '../../src/content/site';

for (const location of locations) {
  test(`${location.slug}: complete static HTML, truthful metadata, sitemap and conversion links`, async ({
    browser,
    request,
  }) => {
    const path = `/locations/${location.slug}/`;
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(location.h1);
    expect(html).not.toContain('http-equiv="refresh"');
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('h1')).toHaveText(location.h1);
    await expect(page.locator('body > header')).toHaveCount(1);
    await expect(page.locator('body > footer')).toHaveCount(1);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', location.canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      location.canonical,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      location.description,
    );
    await expect(page.locator('meta[name=robots]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: location.sectionTitle })).toBeVisible();
    const links = page.getByRole('link', { name: ui.start, exact: true });
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const link of await links.all())
      await expect(link).toHaveAttribute('href', `/start/?location=${location.slug}`);
    await expect(page.locator('footer a[href^="/locations/"]')).toHaveCount(0);
    const llms = await request.get('/llms.txt');
    expect(llms.status()).toBe(200);
    expect(await llms.text()).toContain(`[${location.name}](${location.canonical})`);
    const graph = await page.locator('script[type="application/ld+json"]').textContent();
    expect(
      JSON.parse(graph!)['@graph'].find((node: any) => node['@type'] === 'Service').areaServed.name,
    ).toBe(location.name);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain(`<loc>${location.canonical}</loc>`);
    expect(sitemap).not.toContain('location=');
    await context.close();
  });
}

test('approved location personalises start without changing its canonical or accepting raw values', async ({
  page,
}) => {
  for (const location of locations) {
    await page.goto(`/start/?location=${location.slug}`);
    await expect(page.locator('h1')).toHaveText(location.welcomeHeading);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://fintaxtech.co.uk/start/',
    );
    // The ordinary service selector still enters the questionnaire.
    await page.locator('#start-choose .service-card').first().click();
    await expect(page).toHaveURL(/\/enquiry\/\?service=branding/);
  }
  for (const value of ['unknown', '__proto__', '<img src=x onerror=alert(1)>']) {
    await page.goto(`/start/?location=${encodeURIComponent(value)}`);
    await expect(page.locator('h1')).toHaveText(selectorCopy.title);
    await expect(page.locator('main')).not.toContainText(value);
  }
  await page.goto('/start/');
  await expect(page.locator('h1')).toHaveText(selectorCopy.title);
});

for (const theme of ['light', 'dark']) {
  test(`location pages remain accessible and responsive in ${theme} with reduced motion`, async ({
    page,
  }, info) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const location of locations) {
        await page.goto(`/locations/${location.slug}/`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await expect(page.locator('.hero-process')).toHaveAttribute(
          'data-motion-state',
          'finished',
        );
        const summary = page.locator('summary').first();
        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(summary.locator('..')).toHaveAttribute('open', '');
        await page.screenshot({
          path: info.outputPath(`${location.slug}-${width}-${theme}.png`),
          fullPage: true,
        });
      }
    }
  });
}
