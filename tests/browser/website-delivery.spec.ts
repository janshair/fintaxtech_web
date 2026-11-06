import { test, expect, type Page } from '@playwright/test';
import { websiteBriefSections as sections } from '../../src/content/website-brief';
import { detailedWebsiteBrief } from '../fixtures/website-brief';
import { mockWebsiteDelivery, reviewWebsite } from './website-delivery-helper';

async function returnToReview(page: Page, from = 0) {
  for (let i = from; i < sections.length - 1; i++)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
}
async function download(page: Page) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  return event;
}
test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  // Test the existing link click handlers without opening external messaging applications.
  await page.addInitScript(() =>
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('a[href^="mailto:"], a[href^="https://wa.me/"]')) event.preventDefault();
    }),
  );
});

test('only final actions submit, unchanged answers send once and reviewed edits send again', async ({
  page,
}) => {
  const mock = await mockWebsiteDelivery(page);
  await page.goto('/client/website-brief/');
  await expect(page.locator('.client-brief > .notice')).toContainText('through Slack');
  await reviewWebsite(page, detailedWebsiteBrief());
  expect(mock.submissions).toHaveLength(0);
  await expect(page.getByText('Continuing with Download PDF', { exact: false })).toBeVisible();
  expect(await page.locator('[data-brief-form] button').allTextContents()).toEqual([
    ...sections.map(() => 'Edit answers'),
    'Back',
    'Download PDF',
  ]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await returnToReview(page, sections.length - 1);
  await page
    .getByRole('button', { name: `Edit answers: ${sections[0].title}`, exact: true })
    .click();
  await returnToReview(page);
  expect(mock.submissions).toHaveLength(0);
  await page.getByRole('link', { name: 'Open email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  await page.getByRole('link', { name: 'Open WhatsApp', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect((await download(page)).suggestedFilename()).toBe('FinTaxTech-website-production-brief.pdf');
  await expect(page.getByRole('status')).toContainText('PDF download has been requested');
  expect(mock.submissions).toHaveLength(1);
  expect(mock.messages).toHaveLength(1);
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('status')).toContainText(String(mock.submissions[0].submissionId));
  expect(mock.messages[0].text).toContain('Brief type: Website Production Brief');
  expect(mock.messages[0].text).toContain('Reference URL:');
  await page
    .getByRole('button', { name: `Edit answers: ${sections[0].title}`, exact: true })
    .click();
  await page.locator('#trading').fill('Changed business name');
  await returnToReview(page);
  expect(mock.messages).toHaveLength(1);
  await page.getByRole('link', { name: 'Open WhatsApp', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  expect(mock.messages).toHaveLength(2);
  expect(mock.submissions[1].submissionId).not.toBe(mock.submissions[0].submissionId);
  expect(mock.messages[1].text).toContain('Changed business name');
});

test('Slack failure leaves PDF and answers available; an existing action safely retries', async ({
  page,
}) => {
  const mock = await mockWebsiteDelivery(page);
  let attempts = 0;
  await page.route('**/api/website-brief/', async (route) => {
    if (++attempts === 1)
      await route.fulfill({
        status: 502,
        json: { status: 'failed', delivered: 0, total: 1, retryable: false },
      });
    else await route.fallback();
  });
  await page.goto('/client/website-brief/');
  await reviewWebsite(page, detailedWebsiteBrief());
  const pdf = await download(page);
  expect(await pdf.failure()).toBeNull();
  await expect(page.getByRole('status')).toContainText('Slack delivery failed');
  await expect(page.getByRole('status')).toContainText('PDF download has been requested');
  await expect(page.locator('.brief-review')).toContainText('Production Orchard Ltd');
  await page.getByRole('link', { name: 'Open email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  expect(attempts).toBe(2);
  expect(mock.messages).toHaveLength(1);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
});

test('a missing endpoint reports unavailable delivery and keeps PDF download working', async ({
  page,
}) => {
  await page.route('**/api/website-brief/**', (route) =>
    route.fulfill({ status: 404, body: '<html>Not found</html>' }),
  );
  await page.goto('/client/website-brief/');
  await reviewWebsite(page, detailedWebsiteBrief());
  expect(await (await download(page)).failure()).toBeNull();
  await expect(page.getByRole('status')).toContainText('Online brief delivery is unavailable');
  await expect(page.getByRole('status')).toContainText('PDF download has been requested');
  await expect(page.locator('.brief-review')).toContainText('Production Orchard Ltd');
});

test('pending Slack delivery does not delay PDF and repeated actions share the pending request', async ({
  page,
}) => {
  const mock = await mockWebsiteDelivery(page);
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => (release = resolve));
  let requests = 0;
  await page.route('**/api/website-brief/', async (route) => {
    requests++;
    await waiting;
    await route.fallback();
  });
  await page.goto('/client/website-brief/');
  await reviewWebsite(page, detailedWebsiteBrief());
  await page.getByRole('link', { name: 'Open email', exact: true }).click();
  await page.getByRole('link', { name: 'Open WhatsApp', exact: true }).click();
  const pdf = await download(page);
  expect(await pdf.failure()).toBeNull();
  await expect(page.getByRole('status')).toContainText('PDF download has been requested');
  await expect(page.getByRole('status')).toContainText('Sending reviewed answers');
  expect(mock.messages).toHaveLength(0);
  expect(requests).toBe(1);
  release();
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  expect(mock.messages).toHaveLength(1);
});

test('a PDF font limitation does not block Slack or clear the reviewed answers', async ({
  page,
}) => {
  const mock = await mockWebsiteDelivery(page);
  await page.goto('/client/website-brief/');
  await reviewWebsite(page, detailedWebsiteBrief());
  await page
    .getByRole('button', { name: `Edit answers: ${sections[0].title}`, exact: true })
    .click();
  await page.locator('#trading').fill('Unsupported font sample 漢字');
  await returnToReview(page);
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('could not be created');
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  await expect(page.locator('.brief-review')).toContainText('Unsupported font sample 漢字');
  expect(mock.messages[0].text).toContain('Unsupported font sample 漢字');
});
