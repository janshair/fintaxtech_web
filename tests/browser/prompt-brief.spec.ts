import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  promptBriefSections as sections,
  promptBriefCopy as c,
} from '../../src/content/prompt-brief';
import { completePromptBrief } from '../fixtures/prompt-brief';

const route = c.route;
const secret = 'LOCAL-CONTENT-DETAIL-7392';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(route);
});
const begin = (page: Page) => page.getByRole('button', { name: c.begin, exact: true }).click();
const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
async function advanceTo(page: Page, title: string) {
  const { answers } = completePromptBrief();
  for (let i = 0; i < sections.length; i++) {
    const current = await page.locator('[data-brief-form] h2').innerText();
    if (current === title) return;
    for (const field of sections.find((s) => s.title === current)!.fields) {
      const wrap = page.locator(`#field-${field.id}`);
      if (!(await wrap.count())) continue;
      if (field.type === 'single' || field.type === 'multi') {
        if (!(await wrap.locator('input:checked').count())) {
          const value = answers[field.id];
          for (const option of Array.isArray(value) ? value : [String(value)])
            await wrap.getByLabel(option, { exact: true }).check();
        }
        const detail = wrap.getByLabel('Please specify', { exact: true });
        if (await detail.count()) await detail.fill(secret);
      } else if (!field.optional) {
        const input = page.locator(`#${field.id}`);
        if (!(await input.inputValue())) await input.fill(String(answers[field.id]));
      }
    }
    await expect(page.locator('input[type=file], input[type=password]')).toHaveCount(0);
    await next(page);
  }
  throw new Error(`Did not reach ${title}`);
}

test('static route is unlisted, noindex/nofollow and excluded from analytics even after consent', async ({
  page,
  request,
}) => {
  const response = await request.get(route);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(c.privacy);
  await expect(page.locator('h1')).toHaveText(c.title);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://fintaxtech.co.uk${route}`,
  );
  await expect(page.locator('body > header')).toHaveCount(1);
  await expect(page.locator('body > footer')).toHaveCount(1);
  await expect(
    page.locator('header a[href*="prompt-brief"], footer a[href*="prompt-brief"]'),
  ).toHaveCount(0);
  for (const path of [
    '/sitemap.xml',
    '/rss.xml',
    '/',
    '/start/',
    '/blog/',
    '/services/prompt-services/',
  ]) {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(await res.text()).not.toContain(route);
  }
  await expect(page.getByText(c.access, { exact: true })).toBeVisible();
  await expect(page.getByText(c.workflow, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
});

test('keyboard validation, Other and tone limit work in responsive light and dark layouts', async ({
  page,
}, info) => {
  await begin(page);
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Other', { exact: true }).focus();
  await page.keyboard.press('Space');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Please specify').fill(secret);
  await page.getByLabel('Other', { exact: true }).uncheck();
  await page.getByLabel('Other', { exact: true }).check();
  await expect(page.getByLabel('Please specify')).toHaveValue('');
  await page.getByLabel('Please specify').fill(secret);
  await next(page);
  await expect(page.locator('[data-brief-form] h2')).toBeFocused();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Please specify')).toHaveValue(secret);
  await advanceTo(page, 'Your preferred tone');
  for (const tone of ['Professional', 'Friendly', 'Concise'])
    await page.getByLabel(tone, { exact: true }).check();
  await page.getByLabel('Technical', { exact: true }).click();
  await expect(page.getByLabel('Technical', { exact: true })).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText('3 of 3');
  await page.getByLabel('FinTaxTech to recommend', { exact: true }).check();
  await expect(page.getByLabel('Professional', { exact: true })).not.toBeChecked();
  for (const [width, theme] of [
    [320, 'light'],
    [390, 'dark'],
    [1280, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    if (theme === 'dark' && width === 390) await page.locator('#theme-toggle').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`tone-${width}-${theme}.png`), fullPage: true });
  }
});

test('conditional language/deadline, review editing, PDF and source sharing stay local', async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
  await begin(page);
  await advanceTo(page, 'Language');
  await page.getByLabel('Another language', { exact: true }).check();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Which language?', { exact: true }).fill('French');
  await advanceTo(page, 'Your deadline');
  await page.getByLabel('Yes', { exact: true }).check();
  await next(page);
  await expect(page.getByRole('alert')).toHaveCount(2);
  await page.getByLabel('Deadline date', { exact: true }).fill('2026-12-31');
  await page.getByLabel('Reason for the deadline', { exact: true }).fill('Launch date');
  await page.getByLabel('No fixed date', { exact: true }).check();
  await expect(page.locator('#deadlineDate')).toHaveCount(0);
  await page.getByLabel('Yes', { exact: true }).check();
  await expect(page.locator('#deadlineDate')).toHaveValue('');
  await advanceTo(page, 'Anything else');
  await page.getByLabel('Anything else we should know?', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  const review = page.locator('.brief-review');
  for (const value of [
    secret,
    'French',
    '31',
    'public availability does not automatically grant reuse rights',
    'accuracy, scope and privacy review',
    'Group providing one consolidated decision',
  ])
    await expect(review).toContainText(value);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#theme-toggle').click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('review-mobile-dark.png'), fullPage: true });
  await page.getByRole('button', { name: 'Edit answers: Language', exact: true }).click();
  await page.getByLabel('UK English', { exact: true }).check();
  await expect(page.locator('#languageDetail')).toHaveCount(0);
  await advanceTo(page, 'Anything else');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(review).not.toContainText('French');
  await expect(review).toContainText(secret);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await downloading;
  expect(pdf.suggestedFilename()).toBe(c.pdfFilename);
  await pdf.saveAs(info.outputPath(c.pdfFilename));
  await expect(page.getByRole('status')).toContainText('Nothing has been sent');
  await expect(page.getByRole('link', { name: 'Open email', exact: true })).toHaveAttribute(
    'href',
    'mailto:ask@fintaxtech.co.uk',
  );
  await expect(page.getByRole('link', { name: 'Open WhatsApp', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\/wa.me\/\d+$/,
  );
  expect(requests.join('\n')).not.toContain(secret);
  expect(
    requests.every(
      (r) =>
        r.startsWith('GET http://localhost:4323/') ||
        r.startsWith('GET blob:http://localhost:4323/'),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual([
    'ftt:consent',
    'ftt:theme',
  ]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
  await page.reload();
  await begin(page);
  await expect(page.locator('[data-brief-form] input:checked')).toHaveCount(0);
  await expect(page.getByLabel('Please specify')).toHaveCount(0);
});
