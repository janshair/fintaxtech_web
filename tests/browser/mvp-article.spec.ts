import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { blogCopy } from '../../src/content/blog';

const path = '/blog/mvp-vs-full-mobile-app/';
const canonical = `https://fintaxtech.co.uk${path}`;
const title = 'MVP vs Full Mobile App: What Should Your Business Build First?';
const seoTitle = 'MVP vs Full Mobile App: What Should You Build First? | FinTaxTech';
const description =
  'Learn whether your business should begin with an MVP or a fuller mobile app, what the first release must include, and which features can wait.';
const alts = [
  'A focused mobile app beside a broader app containing multiple feature modules',
  'Five connected steps representing the core journey, surrounded by six optional ideas',
];

for (const theme of ['light', 'dark']) {
  test(`MVP article is accessible and responsive in ${theme}`, async ({ page }, testInfo) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto('/blog/');
      const card = page.locator('.article-card').getByRole('link', { name: title, exact: true });
      await expect(card).toHaveCount(1);
      await card.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(path);
      await expect(page).toHaveTitle(seoTitle);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(page.locator('.article-meta')).toContainText('Published 10 September 2026');
      await expect(page.locator('.article-meta')).toContainText('By FinTaxTech Ltd.');
      await expect(page.locator('meta[name=description]')).toHaveAttribute('content', description);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', canonical);
      await expect(page.locator('meta[name=robots]')).toHaveCount(0);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', seoTitle);
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
        'content',
        alts[0],
      );
      const imageURL = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(imageURL).toMatch(
        /^https:\/\/fintaxtech.co.uk\/_astro\/mvp-vs-full-mobile-app-hero.*\.webp$/,
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        imageURL!,
      );
      await expect(page.locator('.blog-article img')).toHaveCount(2);
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
      }
      const table = page.getByRole('region', { name: blogCopy.table });
      await expect(table.getByRole('columnheader', { name: blogCopy.tableRowHeading })).toHaveCount(
        1,
      );
      await expect(table.getByRole('row')).toHaveCount(5);
      await table.scrollIntoViewIfNeeded();
      await table.focus();
      await expect(table).toBeFocused();
      await expect(table).toBeInViewport({ ratio: 0.5 });
      if (width < 768) {
        await page.keyboard.press('ArrowRight', { delay: 100 });
        await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (testInfo.project.name === 'chromium') {
        await page.screenshot({
          path: `docs/blog-preview/mvp-${width}-${theme}.png`,
          fullPage: true,
        });
        await table.screenshot({ path: `docs/blog-preview/mvp-table-${width}-${theme}.png` });
        await page
          .locator('.article-heading')
          .screenshot({ path: `docs/blog-preview/mvp-hero-${width}-${theme}.png` });
      }
    }
    const body = page.locator('.article-body');
    for (const [name, destination] of [
      ['mobile app requirements checklist', '/blog/mobile-app-requirements-checklist/'],
      [
        'Native vs Flutter vs Kotlin Multiplatform',
        '/blog/native-vs-flutter-vs-kotlin-multiplatform/',
      ],
      ['Plan your mobile app with FinTaxTech →', '/start/'],
    ]) {
      await body.getByRole('link', { name, exact: true }).first().click();
      await expect(page).toHaveURL(destination);
      await page.goBack();
    }
    await page.locator('.final-cta a').click();
    await expect(page).toHaveURL('/start/');
    await page.goto('/');
    await page.getByRole('link', { name: blogCopy.all }).click();
    await expect(
      page.locator('.article-card').getByRole('link', { name: title, exact: true }),
    ).toHaveCount(1);
  });
}

test('MVP article, table, checklist and schema are static and discoverable', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto(`http://localhost:4323${path}`))?.status()).toBe(200);
  await expect(page.locator('.article-body h2')).toHaveCount(11);
  await expect(page.getByRole('table')).toHaveCount(1);
  await expect(page.locator('.article-body input[type=checkbox]')).toHaveCount(10);
  await expect(
    page.getByRole('checkbox', {
      name: 'Would a real user get real value from just that journey?',
      exact: true,
    }),
  ).toBeDisabled();
  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  )['@graph'];
  expect(graph.find((node: any) => node['@type'] === 'BlogPosting')).toMatchObject({
    headline: title,
    description,
    datePublished: '2026-09-10T00:00:00.000Z',
    author: { '@id': 'https://fintaxtech.co.uk/#organization' },
    url: canonical,
  });
  expect(
    graph.find((node: any) => node['@type'] === 'BreadcrumbList').itemListElement.at(-1),
  ).toMatchObject({ name: title, item: canonical });
  await context.close();
  for (const [url, element] of [
    ['/sitemap.xml', 'loc'],
    ['/rss.xml', 'link'],
  ]) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect((await response.text()).split(`<${element}>${canonical}</${element}>`).length - 1).toBe(
      1,
    );
  }
});
