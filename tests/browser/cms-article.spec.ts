import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { blogCopy } from '../../src/content/blog';

const route = '/blog/does-your-website-need-a-cms/';
const canonical = `https://fintaxtech.co.uk${route}`;
const title =
  'Does Your Business Website Need a CMS? Static, Headless and Managed Options Explained';
const description =
  'Compare static websites, traditional CMS platforms and headless CMS options to choose the right content-management approach for your business.';
const alts = [
  'Three structured content documents flowing into a finished business website',
  'Content moving from an editor through a build process into three static pages',
];
const references = [
  'https://wordpress.org/documentation/article/plugins-themes-auto-updates/',
  'https://docs.astro.build/en/guides/cms/',
  'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  'https://developers.google.com/search/docs/appearance/page-experience',
];

for (const theme of ['light', 'dark']) {
  test(`CMS article images, comparison and links work in ${theme}`, async ({ page }, testInfo) => {
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
      }
      const table = page.getByRole('region', { name: blogCopy.table });
      await expect(table.getByRole('row')).toHaveCount(9);
      await expect(table.getByRole('columnheader')).toHaveCount(4);
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
        await table.screenshot({ path: `docs/blog-preview/cms-table-${width}-${theme}.png` });
        await page
          .locator('.article-heading')
          .screenshot({ path: `docs/blog-preview/cms-hero-${width}-${theme}.png` });
        await page
          .locator('.article-body img')
          .screenshot({ path: `docs/blog-preview/cms-body-image-${width}-${theme}.png` });
      }
    }
    await page
      .locator('.article-body')
      .getByRole('link', {
        name: 'Website vs Web Application: What Does Your Business Actually Need?',
        exact: true,
      })
      .click();
    await expect(page).toHaveURL('/blog/website-vs-web-application/');
    await page.goBack();
    await page
      .getByRole('link', { name: 'Plan your website with FinTaxTech →', exact: true })
      .click();
    await expect(page).toHaveURL('/start/');
    await page.goBack();
    await page.locator('.final-cta a').click();
    await expect(page).toHaveURL('/start/');
  });
}

test('CMS article publishes complete static HTML, metadata and feeds', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto(`http://localhost:4323${route}`))?.status()).toBe(200);
  await expect(page).toHaveTitle('Does Your Business Website Need a CMS? | FinTaxTech');
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.article-body h2')).toHaveCount(15);
  await expect(page.locator('.article-body input[type=checkbox]:disabled')).toHaveCount(11);
  await expect(page.locator('.article-meta')).toContainText('Published 11 September 2026');
  await expect(page.locator('.article-meta')).toContainText('By FinTaxTech Ltd.');
  await expect(page.locator('.article-body')).toContainText(
    'The editor manages content, the build process produces the site, and visitors receive finished static pages.',
  );
  await expect(page.locator('.article-body')).toContainText(
    'pushing it to main triggers validation and a static build',
  );
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
    /^https:\/\/fintaxtech.co.uk\/_astro\/does-your-website-need-a-cms-hero.*\.webp$/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', social!);
  for (const href of references)
    await expect(page.locator(`.article-body a[href="${href}"]`)).toHaveCount(1);
  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  )['@graph'];
  expect(graph.find((node: any) => node['@type'] === 'BlogPosting')).toMatchObject({
    headline: title,
    description,
    datePublished: '2026-09-11T00:00:00.000Z',
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
