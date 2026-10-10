import type { Page } from '@playwright/test';
import { createWebsiteBriefAPI } from '../../src/server/website-brief-api';

// Isolated UI tests intercept API requests and run the core handler with Slack mocked.
// Actual dev/preview HTTP routing is covered separately in website-delivery-http.spec.ts.
export async function mockWebsiteDelivery(page: Page) {
  const messages: { text: string }[] = [];
  const submissions: Record<string, unknown>[] = [];
  const handle = createWebsiteBriefAPI({
    origin: 'http://localhost:4323',
    webhook: 'https://hooks.slack.com/services/TEST_ONLY',
    fetcher: async (_url, init) => {
      messages.push(JSON.parse(String(init!.body)));
      return new Response('ok');
    },
    pause: async () => {},
  });
  await page.route('https://hooks.slack.com/**', (route) => route.abort());
  await page.route('**/api/website-brief/**', async (route) => {
    const incoming = route.request();
    if (incoming.url().endsWith('/website-brief/'))
      submissions.push(JSON.parse(incoming.postData()!));
    const response = await handle(
      new Request(incoming.url(), {
        method: incoming.method(),
        headers: incoming.headers(),
        body: incoming.postData(),
      }),
      '192.0.2.1',
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    });
  });
  return { messages, submissions };
}
