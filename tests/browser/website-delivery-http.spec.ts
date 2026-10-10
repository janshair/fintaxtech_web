import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { clientBriefDefinitions } from '../../src/lib/client-brief/definitions';
import type { BriefState } from '../../src/lib/client-brief/types';
import { completeWebsiteDemoBrief } from '../fixtures/website-demo-brief';
import { detailedWebsiteBrief } from '../fixtures/website-brief';

// These tests deliberately do NOT intercept the API. Only the server's outbound Slack
// transport is mocked, by tests/mocks/slack-fetch.mjs in the real dev/preview process.
async function messages(marker: string) {
  const content = await readFile(resolve('test-results/slack-http-mock.jsonl'), 'utf8').catch(
    () => '',
  );
  return content
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const call = JSON.parse(line);
        return call.message.text.includes(marker) ? [call] : [];
      } catch {
        return []; // A parallel worker may still be appending its last line.
      }
    });
}
async function review(page: Page, kind: 'website' | 'websiteDemo', state: BriefState) {
  const definition = clientBriefDefinitions[kind];
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
async function download(page: Page) {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await downloading;
  expect(await pdf.failure()).toBeNull();
  return pdf;
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.addInitScript(() =>
    document.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a[href^="mailto:"], a[href^="https://wa.me/"]'))
        event.preventDefault();
    }),
  );
});

test('real local API: demo failure keeps PDF, final actions retry once and reviewed edits send again', async ({
  page,
}, info) => {
  const marker = `HTTP-MOCK-FAIL-ONCE-${randomUUID()}`;
  const state = completeWebsiteDemoBrief();
  state.answers.trading = marker;
  state.answers.designAvoid = '<!channel> <@U123> *do not format*';
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/website-brief/'))
      apiRequests.push(request.url());
    expect(request.url()).not.toContain('hooks.slack.com');
  });
  await page.goto('/client/website-demo-brief/');
  await review(page, 'websiteDemo', state);
  expect(apiRequests).toEqual([]);
  const downloading = await download(page);
  expect(downloading.suggestedFilename()).toBe('FinTaxTech-free-website-demo-brief.pdf');
  const file = info.outputPath('http-demo.pdf');
  await downloading.saveAs(file);
  expect((await readFile(file)).subarray(0, 4).toString()).toBe('%PDF');
  await expect(page.getByRole('status')).toContainText('Slack delivery failed');
  await expect(page.getByRole('status')).toContainText('PDF download has been requested');
  await expect(page.locator('.brief-review')).toContainText(marker);
  expect(await messages(marker)).toHaveLength(1);
  await page.getByRole('link', { name: 'Open email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  const calls = await messages(marker);
  expect(calls.map((call) => call.status)).toEqual([400, 200]);
  const id = calls[1].message.text.match(/Submission ID: ([a-f0-9-]+)/)[1];
  expect(calls[0].message.text).toContain(`Submission ID: ${id}`);
  expect(calls[1].message.text).toContain('Brief type: Free Website Demo Brief');
  expect(calls[1].message.text).toContain('&lt;!channel&gt; &lt;@U123&gt;');
  expect(calls[1].message.mrkdwn).toBe(false);
  await page.getByRole('link', { name: 'Open WhatsApp', exact: true }).focus();
  await page.keyboard.press('Enter');
  await download(page);
  expect(await messages(marker)).toHaveLength(2);
  expect(apiRequests).toHaveLength(3); // one ticket, the failed attempt and its retry
  const sections = clientBriefDefinitions.websiteDemo.sections;
  await page
    .getByRole('button', { name: `Edit answers: ${sections[0].title}`, exact: true })
    .click();
  const edited = `HTTP-MOCK-EDIT-${randomUUID()}`;
  await page.locator('#trading').fill(edited);
  for (let i = 0; i < sections.length - 1; i++)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  expect(apiRequests).toHaveLength(3);
  await page.getByRole('link', { name: 'Open WhatsApp', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  const changed = await messages(edited);
  expect(changed).toHaveLength(1);
  expect(changed[0].message.text).not.toContain(`Submission ID: ${id}`);
  expect(apiRequests).toHaveLength(5);
});

test('real local API: production PDF completion sends applicable structured answers', async ({
  page,
}, info) => {
  const marker = `HTTP-MOCK-PRODUCTION-${randomUUID()}`;
  const state = detailedWebsiteBrief();
  state.answers.trading = marker;
  await page.goto('/client/website-brief/');
  await review(page, 'website', state);
  const sections = clientBriefDefinitions.website.sections;
  const capabilities = sections.find((section) =>
    section.fields.some((field) => field.id === 'capabilities'),
  )!;
  await page
    .getByRole('button', { name: `Edit answers: ${capabilities.title}`, exact: true })
    .click();
  await page.locator('#paymentProvider').fill('HIDDEN-HTTP-PAYMENT-PROVIDER');
  await page.getByLabel('Online payments', { exact: true }).click();
  for (let i = sections.indexOf(capabilities); i < sections.length - 1; i++)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  expect(await messages(marker)).toEqual([]);
  const pdf = await download(page);
  expect(pdf.suggestedFilename()).toBe('FinTaxTech-website-production-brief.pdf');
  await pdf.saveAs(info.outputPath('http-production.pdf'));
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  const calls = await messages(marker);
  expect(calls).toHaveLength(1);
  expect(calls[0].message.text).toContain('Brief type: Website Production Brief');
  expect(calls[0].message.text).toContain('Microsoft 365');
  expect(calls[0].message.text).toContain('Reference URL:');
  expect(calls[0].message.text).not.toContain('HIDDEN-HTTP-PAYMENT-PROVIDER');
  expect(calls[0].message.text).not.toContain('Hosted checkout for agreed deposits.');
  expect(calls[0].message.text).toContain('does not verify payment or approval');
  expect(calls[0].message.text).toContain('do not automatically expand scope or price');
});
