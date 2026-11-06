import { clientBriefDefinitions } from '../../src/lib/client-brief/definitions';
import type { BriefState } from '../../src/lib/client-brief/types';
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

export async function reviewWebsite(page: Page, state: BriefState) {
  const definition = clientBriefDefinitions.website;
  await page.getByRole('button', { name: definition.copy.begin, exact: true }).click();
  for (const [index, section] of definition.sections.entries()) {
    for (const field of section.fields) {
      const wrap = page.locator(`#field-${field.id}`);
      if (!(await wrap.count())) continue;
      const answer = state.answers[field.id];
      if (field.type === 'single' || field.type === 'multi') {
        for (const value of Array.isArray(answer)
          ? answer
          : typeof answer === 'string'
            ? [answer]
            : [])
          await wrap.getByLabel(value, { exact: true }).click();
      } else if (field.type === 'rows') {
        for (const row of state.rows[field.id] ?? []) {
          await wrap.getByRole('button', { name: field.repeat!.add, exact: true }).click();
          for (const part of field.repeat!.fields.filter((part) => !part.when))
            await wrap.getByLabel(part.label, { exact: true }).last().fill(row.values[part.key]);
        }
      } else if (field.type === 'pages') {
        for (const item of state.additionalPages) {
          await page.getByRole('button', { name: 'Add page', exact: true }).click();
          await page.getByLabel('Page name', { exact: true }).last().fill(item.name);
          await page.getByLabel('Purpose (optional)', { exact: true }).last().fill(item.purpose);
        }
      } else if (typeof answer === 'string') await page.locator(`#${field.id}`).fill(answer);
    }
    if (index < definition.sections.length - 1)
      await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
}
