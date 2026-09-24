import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { pages } from '../../src/content/pages';
import { contactRedirect, ui } from '../../src/content/site';

const cases = [
  '/contact.html',
  '/contact.html?utm_source=business_card&tag=a&tag=b#any-section',
  '/contact.html?any=query',
  '/contact.html#any-section',
  '/contact.html?utm_source=card&tag=a&tag=b&empty=&encoded=%2F%26%3D+%20#part%20one',
  '/contact.html?next=https%3A%2F%2Fexample.com%2F&flag#details',
];

for (const path of cases) {
  test(`Legacy Contact replaces history and preserves the URL suffix: ${path}`, async ({
    page,
  }) => {
    const source = new URL(path, 'http://localhost:4323');
    const requests: URL[] = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest()) requests.push(new URL(request.url()));
    });
    await page.goto('/about/');
    await page.goto(path);
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === '/start/' && url.search === source.search && url.hash === source.hash,
    );
    expect(requests.some((url) => url.pathname === '/start/' && url.search === source.search)).toBe(
      true,
    );
    await expect(page.locator('h1')).toHaveText(
      'What would you like FinTaxTech to help you create?',
    );
    await page.goBack();
    await expect(page).toHaveURL('/about/');
  });
}

test('GitHub Pages directory redirects also preserve query, fragment and history', async ({
  page,
}) => {
  // GitHub Pages adds a slash with an HTTP redirect before serving a directory index.
  // HTTP Location omits the fragment; the browser must carry it into the Contact page.
  // Use a real HTTP response: WebKit does not support mocked 301 responses in route.fulfill.
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, 'http://localhost:4323');
    if (['/contact', '/start'].includes(url.pathname)) {
      response.writeHead(301, { location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    try {
      const upstream = await fetch(url);
      response.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      });
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      response.writeHead(502).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await page.goto(`${origin}/about/`);
    const suffix = '?tag=a&tag=b&x=%2F%26+%20#section%20one';
    await page.goto(`${origin}/contact${suffix}`);
    await expect(page).toHaveURL(`${origin}/contact/${suffix}`);
    await page.goBack();
    await expect(page).toHaveURL(`${origin}/about/`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

for (const path of ['/contact.html'])
  for (const theme of ['light', 'dark'] as const) {
    test(`Contact has an accessible static fallback at ${path} in ${theme} mode`, async ({
      browser,
      request,
    }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        colorScheme: theme,
        viewport: { width: 390, height: 900 },
      });
      const page = await context.newPage();
      expect(
        (await page.goto(`http://localhost:4323${path}?utm_source=card#details`))?.status(),
      ).toBe(200);
      await expect(page.locator('h1')).toHaveText(contactRedirect.title);
      await expect(page.locator('main')).toContainText(contactRedirect.message);
      await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://fintaxtech.co.uk/start/',
      );
      const link = page.locator('#contact-redirect-link');
      await expect(link).toHaveText(ui.start);
      await expect(link).toHaveAttribute('href', '/start/');
      await expect(link).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(link).toHaveAccessibleName(ui.start);
      await link.focus();
      await expect(link).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/start\/$/);
      await expect(page.locator('h1')).toHaveText(
        'What would you like FinTaxTech to help you create?',
      );
      await context.close();
      const sitemap = await request.get('/sitemap.xml');
      expect(sitemap.status()).toBe(200);
      const xml = await sitemap.text();
      expect(xml).not.toContain('/contact.html');
      expect(xml).toContain('<loc>https://fintaxtech.co.uk/contact/</loc>');
    });
  }

for (const path of ['/contact/', '/contact/?utm_source=card&tag=a&tag=b#details']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Contact stays on its own page at ${path} in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: 390, height: 900 });
      const destinations: string[] = [];
      page.on('request', (request) => {
        if (request.isNavigationRequest()) destinations.push(new URL(request.url()).pathname);
      });
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page).toHaveURL(path);
      await expect(page.locator('h1')).toHaveText(pages.contact.title);
      await expect(page.locator('[data-static-redirect]')).toHaveCount(0);
      await expect(page.locator('meta[name=robots][content*=noindex]')).toHaveCount(0);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://fintaxtech.co.uk/contact/',
      );
      await expect(page.getByRole('link', { name: ui.email, exact: true })).toBeVisible();
      expect(destinations).not.toContain('/start/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}
