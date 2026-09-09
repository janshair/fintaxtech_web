import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const route = '/blog/mobile-app-requirements-checklist/';
const canonical = `https://fintaxtech.co.uk${route}`;
const title = 'Mobile App Requirements Checklist: What to Prepare Before Development';
const seoTitle = 'Mobile App Requirements Checklist | FinTaxTech';
const description =
  'Define your app’s users, platforms, essential features, data, integrations, ownership and ongoing support before requesting a development quotation.';
const alts = [
  'A mobile phone beside a completed project-planning checklist',
  'Three selected features for version one beside seven ideas reserved for later',
  'Seven completed items and four remaining items in a project checklist',
];

for (const theme of ['light', 'dark']) {
  test(`checklist article images, links and shared components in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 950 });
      expect([200, 304]).toContain((await page.goto('/blog/'))?.status());
      const card = page.locator('.article-card').getByRole('link', { name: title, exact: true });
      await expect(card).toHaveCount(1);
      await card.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(route);
      await expect(page).toHaveTitle(seoTitle);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(page.locator('.article-meta')).toContainText('Published 9 September 2026');
      await expect(page.locator('.article-meta')).toContainText('By FinTaxTech Ltd.');
      await expect(page.locator('meta[name=description]')).toHaveAttribute('content', description);
      await expect(page.locator('meta[name=robots]')).toHaveCount(0);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', canonical);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', seoTitle);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
        'content',
        alts[0],
      );
      const imageURL = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(imageURL).toMatch(
        /^https:\/\/fintaxtech.co.uk\/_astro\/mobile-app-requirements-hero.*\.webp$/,
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        imageURL!,
      );
      await expect(page.locator('.blog-article img')).toHaveCount(3);
      for (const alt of alts) {
        const image = page.getByRole('img', { name: alt, exact: true });
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
          )
          .toBe(true);
        await image.evaluate((img: HTMLImageElement) => img.decode());
        await expect(image).toBeVisible();
        expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('body > header')).toHaveCount(1);
      await expect(page.locator('body > footer')).toHaveCount(1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (testInfo.project.name === 'chromium') {
        await page.screenshot({
          path: `docs/blog-preview/checklist-${width}-${theme}.png`,
          fullPage: true,
        });
        await page
          .locator('.article-heading')
          .screenshot({ path: `docs/blog-preview/checklist-hero-${width}-${theme}.png` });
      }
    }
    const related = page
      .locator('.article-body')
      .getByRole('link', { name: /Native vs Flutter vs Kotlin Multiplatform/ });
    await related.click();
    await expect(page).toHaveURL('/blog/native-vs-flutter-vs-kotlin-multiplatform/');
    await page.goBack();
    await page
      .locator('.article-body')
      .getByRole('link', { name: 'Plan your mobile app with FinTaxTech →' })
      .click();
    await expect(page).toHaveURL('/start/');
    await page.goBack();
    await page.locator('.final-cta a').click();
    await expect(page).toHaveURL('/start/');
    await page.goto('/');
    await expect(
      page.locator('.article-card').getByRole('link', { name: title, exact: true }),
    ).toHaveCount(1);
  });
}

test('checklist content and metadata are present in static HTML and feeds', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto(`http://localhost:4323${route}`))?.status()).toBe(200);
  await expect(page.locator('.article-body h2')).toHaveCount(14);
  await expect(page.locator('.article-body input[type=checkbox]')).toHaveCount(33);
  await expect(
    page.getByRole('checkbox', {
      name: 'The problem, in one sentence, with no features in it',
      exact: true,
    }),
  ).toBeDisabled();
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()!)[
    '@graph'
  ];
  expect(graph.find((node: any) => node['@type'] === 'BlogPosting')).toMatchObject({
    headline: title,
    description,
    datePublished: '2026-09-09T00:00:00.000Z',
    author: { '@id': 'https://fintaxtech.co.uk/#organization' },
    url: canonical,
  });
  expect(
    graph.find((node: any) => node['@type'] === 'BreadcrumbList').itemListElement.at(-1),
  ).toMatchObject({ name: title, item: canonical });
  await context.close();
  for (const [path, element] of [
    ['/sitemap.xml', 'loc'],
    ['/rss.xml', 'link'],
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml.split(`<${element}>${canonical}</${element}>`).length - 1).toBe(1);
  }
});
