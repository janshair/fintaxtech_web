import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { blogCopy } from '../../src/content/blog';

const route = '/blog/website-vs-web-application/';
const canonical = `https://fintaxtech.co.uk${route}`;
const title = 'Website vs Web Application: What Does Your Business Actually Need?';
const seoTitle = 'Website vs Web Application: Which Does Your Business Need? | FinTaxTech';
const description =
  'Understand the difference between a business website and a web application, when you need each, and how to choose the right approach.';
const alts = [
  'A content-led business website beside a task-led web application dashboard',
  'A public content website connected to a private application dashboard',
];
const references = [
  [
    'technical requirements for Search',
    'https://developers.google.com/search/docs/essentials/technical',
  ],
  [
    'UK GDPR’s scope',
    'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-what-is-it/who-does-the-uk-gdpr-apply-to/',
  ],
];

for (const theme of ['light', 'dark']) {
  test(`website article images, table and navigation work in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => {
      localStorage.setItem('ftt:theme', value);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto('/blog/');
      const card = page.locator('.article-card').getByRole('link', { name: title, exact: true });
      await card.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
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
        expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(
          0,
        );
      }
      const table = page.getByRole('region', { name: blogCopy.table });
      await expect(table.getByRole('row')).toHaveCount(9);
      await expect(table.getByRole('columnheader', { name: blogCopy.tableRowHeading })).toHaveCount(
        1,
      );
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
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (testInfo.project.name === 'chromium') {
        await table.screenshot({ path: `docs/blog-preview/website-table-${width}-${theme}.png` });
        await page
          .locator('.article-heading')
          .screenshot({ path: `docs/blog-preview/website-hero-${width}-${theme}.png` });
        await page
          .locator('.article-body img')
          .screenshot({ path: `docs/blog-preview/website-body-image-${width}-${theme}.png` });
      }
    }
    await page
      .getByRole('link', { name: 'Plan your website with FinTaxTech →', exact: true })
      .click();
    await expect(page).toHaveURL('/start/');
    await page.goBack();
    await page.locator('.final-cta a').click();
    await expect(page).toHaveURL('/start/');
    await page.goBack();
    await page
      .locator('.article-footer')
      .getByRole('link', { name: 'Website Design and Development' })
      .click();
    await expect(page).toHaveURL('/services/websites/');
    await page.goto('/');
    await expect(
      page.locator('.article-card').first().getByRole('link', { name: title, exact: true }),
    ).toBeVisible();
  });
}

test('website article content, hero dimensions and SEO are present without JavaScript', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto(`http://localhost:4323${route}`))?.status()).toBe(200);
  await expect(page).toHaveTitle(seoTitle);
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.article-body h2')).toHaveCount(14);
  await expect(page.locator('.article-body input[type=checkbox]:disabled')).toHaveCount(10);
  await expect(page.locator('.article-meta')).toContainText('Published 10 September 2026');
  await expect(page.locator('.article-meta')).toContainText('By FinTaxTech Ltd.');
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content', description);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', canonical);
  await expect(page.locator('meta[name=robots]')).toHaveCount(0);
  const hero = page.getByRole('img', { name: alts[0], exact: true });
  await expect(hero).toHaveAttribute('loading', 'eager');
  await expect(hero).toHaveAttribute('width', '1120');
  await expect(hero).toHaveAttribute('height', '630');
  await expect(hero).toHaveAttribute('srcset', /390w.*736w.*1120w/);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alts[0]);
  const social = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(social).toMatch(
    /^https:\/\/fintaxtech.co.uk\/_astro\/website-vs-web-application-hero.*\.webp$/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', social!);
  for (const [name, href] of references)
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
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
