import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { blogCopy } from '../../src/content/blog';
const route = '/blog/native-vs-flutter-vs-kotlin-multiplatform/';
const title = 'Native vs Flutter vs Kotlin Multiplatform for Business Apps';

for (const theme of ['light', 'dark']) {
  test(`blog navigation, article and responsive table in ${theme}`, async ({ page }, testInfo) => {
    await page.addInitScript((value) => {
      localStorage.setItem('ftt:theme', value);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/blog/');
      await expect(page.locator('h1')).toHaveText(blogCopy.title);
      await expect(page.locator('.article-meta time').locator('..')).toHaveText(
        'Published 9 September 2026',
      );
      await expect(page.locator('.article-card img')).toBeVisible();
      await expect(
        page.locator('footer').getByRole('link', { name: 'Blog', exact: true }),
      ).toHaveCount(1);
      const menu = page.getByRole('button', { name: 'Menu', exact: true });
      if (await menu.isVisible()) await menu.click();
      await expect(
        page
          .getByRole('navigation', { name: 'Main navigation' })
          .getByRole('link', { name: 'Blog', exact: true }),
      ).toBeVisible();
      if (await menu.isVisible()) await menu.click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (testInfo.project.name === 'chromium')
        await page.screenshot({
          path: `docs/blog-preview/index-${width}-${theme}.png`,
          fullPage: true,
        });
      const card = page.locator('.article-card').getByRole('link', { name: title });
      await card.focus();
      await expect(card).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(route);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.article-meta')).toContainText('9 September 2026');
      await expect(page.locator('.article-meta')).toContainText('FinTaxTech');
      await expect(page.locator('.article-meta time').locator('..')).toHaveText(
        'Published 9 September 2026',
      );
      const images = page.locator('.blog-article img');
      await expect(images).toHaveCount(2);
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toBeVisible();
        await expect
          .poll(() =>
            img.evaluate(
              (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
            ),
          )
          .toBe(true);
        await expect(img).toHaveAttribute('alt', /.+/);
      }
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://fintaxtech.co.uk${route}`,
      );
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const table = page.getByRole('region', { name: blogCopy.table });
      // Each word in the consideration labels must occupy one line, even on a narrow viewport.
      expect(
        await table.locator('tr > :first-child').evaluateAll((cells) => {
          return cells.every((cell) => {
            const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
            let textNode;
            while ((textNode = walker.nextNode())) {
              for (const word of (textNode.textContent ?? '').matchAll(/\S+/g)) {
                const range = document.createRange();
                range.setStart(textNode, word.index!);
                range.setEnd(textNode, word.index! + word[0].length);
                if (range.getClientRects().length > 1) return false;
              }
            }
            return true;
          });
        }),
      ).toBe(true);
      // Finish scrolling the long article before sending a key to its table (WebKit ignores keys during that scroll).
      await table.scrollIntoViewIfNeeded();
      await table.focus();
      await expect(table).toBeFocused();
      await expect(table).toBeInViewport({ ratio: 0.5 });
      if (width < 768) {
        await page.keyboard.press('ArrowRight', { delay: 100 });
        await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (testInfo.project.name === 'chromium') {
        await page.screenshot({
          path: `docs/blog-preview/article-${width}-${theme}.png`,
          fullPage: true,
        });
        await table.screenshot({ path: `docs/blog-preview/table-${width}-${theme}.png` });
      }
    }
    await page.getByRole('link', { name: blogCopy.mobileCTA.label, exact: true }).click();
    await expect(page).toHaveURL('/enquiry/?service=mobile-apps');
    await expect(page.locator('#questionnaire h1')).toHaveText('Mobile App Development');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: blogCopy.latest })).toBeVisible();
    await page.locator('.article-card').getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(route);
    await page
      .locator('.article-footer')
      .getByRole('link', { name: 'Mobile App Development', exact: true })
      .click();
    await expect(page).toHaveURL('/services/mobile-apps/');
  });
}

test('blog HTML, sitemap and RSS work without JavaScript', async ({ browser, page, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  for (const path of ['/blog/', route]) {
    expect((await staticPage.goto(`http://localhost:4323${path}`))?.status()).toBe(200);
    await expect(staticPage.locator('h1')).toHaveCount(1);
    await expect(staticPage.locator('meta[name="robots"]')).toHaveCount(0);
  }
  await expect(staticPage.getByRole('table')).toBeVisible();
  await expect(
    staticPage.getByRole('heading', { name: 'Questions to answer before choosing' }),
  ).toBeVisible();
  await context.close();
  await page.goto('/blog/');
  const parseXML = async (path: string, selector: string) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    return page.evaluate(
      ({ xml, selector }) => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
        return [...doc.querySelectorAll(selector)].map((item) => item.textContent);
      },
      { xml: await response.text(), selector },
    );
  };
  const links = await parseXML('/rss.xml', 'item > link');
  expect(links).toContain(`https://fintaxtech.co.uk${route}`);
  expect(links.length).toBe(new Set(links).size);
  expect(await parseXML('/rss.xml', 'item > pubDate')).toContain('Wed, 09 Sep 2026 00:00:00 GMT');
  const sitemap = await parseXML('/sitemap.xml', 'loc');
  expect(sitemap.filter((url) => url === `https://fintaxtech.co.uk${route}`)).toHaveLength(1);
  expect(sitemap).toContain('https://fintaxtech.co.uk/blog/');
  expect(sitemap).not.toContain('https://fintaxtech.co.uk/promo/');
  expect(sitemap).not.toContain('https://fintaxtech.co.uk/enquiry/');
});
