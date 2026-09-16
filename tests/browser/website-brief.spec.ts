import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { websiteBriefSections as sections } from '../../src/content/website-brief';

const route = '/client/website-brief/';
const secret = 'LOCAL-WEBSITE-DETAIL-5826';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(route);
});
async function begin(page: Page) {
  await page.getByRole('button', { name: 'Begin website brief' }).click();
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'Next', exact: true }).click();
}
async function fillCurrent(page: Page) {
  const title = await page.locator('[data-brief-form] h2').innerText();
  const section = sections.find((s) => s.title === title)!;
  for (const field of section.fields) {
    const wrap = page.locator(`#field-${field.id}`);
    if (!(await wrap.count())) continue;
    if (field.type === 'single' || field.type === 'multi') {
      if (!(await wrap.locator('input:checked').count()))
        await wrap.locator('input').first().check();
    } else if (['text', 'url', 'date'].includes(field.type) && !field.optional) {
      const input = page.locator(`#${field.id}`);
      if (!(await input.inputValue()))
        await input.fill(
          field.type === 'url'
            ? 'https://private-client.example'
            : field.type === 'date'
              ? '2026-12-31'
              : secret,
        );
    }
  }
}
async function advanceTo(page: Page, title: string) {
  for (let i = 0; i < 15; i++) {
    if ((await page.locator('[data-brief-form] h2').innerText()) === title) return;
    await fillCurrent(page);
    await next(page);
  }
  throw new Error(`Did not reach ${title}`);
}

test('static private page has correct metadata and stays out of public navigation and feeds', async ({
  page,
  request,
}) => {
  expect((await request.get(route)).status()).toBe(200);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://fintaxtech.co.uk/client/website-brief/',
  );
  await expect(page.locator('h1')).toHaveText('Website Production Brief');
  await expect(
    page.locator('header a[href*="website-brief"], footer a[href*="website-brief"]'),
  ).toHaveCount(0);
  for (const path of ['/sitemap.xml', '/rss.xml', '/blog/'])
    expect(await (await request.get(path)).text()).not.toContain(route);
  await expect(page.getByText('Anyone with its link can open it.', { exact: false })).toBeVisible();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
});

test('keyboard, goal maximum, Other and conditional geography preserve only applicable answers', async ({
  page,
}) => {
  await begin(page);
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('New website', { exact: true }).focus();
  await page.keyboard.press('Space');
  await next(page);
  await page.getByLabel('Enquiries', { exact: true }).check();
  await page.getByLabel('Credibility', { exact: true }).check();
  await page.getByLabel('Bookings', { exact: true }).click();
  await expect(page.getByLabel('Bookings', { exact: true })).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText('2 of 2');
  await page.getByLabel('Credibility', { exact: true }).uncheck();
  await page.getByLabel('Other', { exact: true }).check();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Please specify').fill('Build a useful reference library');
  await next(page);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Please specify')).toHaveValue('Build a useful reference library');
  await page.getByLabel('Other', { exact: true }).uncheck();
  await expect(page.getByLabel('Please specify')).toHaveCount(0);
  await advanceTo(page, 'Where your customers are');
  await page.getByLabel('Local', { exact: true }).check();
  await page.locator('#localPlaces').fill('Dundee');
  await page.getByLabel('One country', { exact: true }).check();
  await page.locator('#country').fill('United Kingdom');
  await page.getByLabel('International', { exact: true }).check();
  await page.locator('#internationalPlaces').fill('Worldwide');
  await page.getByLabel('Local', { exact: true }).uncheck();
  await expect(page.locator('#localPlaces')).toHaveCount(0);
  await page.getByLabel('Local', { exact: true }).check();
  await expect(page.locator('#localPlaces')).toHaveValue('');
});

test('additional pages validate names, duplicates and ten-item limit with accessible mobile controls', async ({
  page,
}, info) => {
  await begin(page);
  await advanceTo(page, 'Your website pages');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('at least one');
  await page.getByRole('button', { name: 'Add page', exact: true }).click();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Page name', { exact: true }).fill('Careers');
  await page.getByLabel('Purpose (optional)', { exact: true }).fill('Show open roles.');
  await page.getByRole('button', { name: 'Add page', exact: true }).click();
  await page.getByLabel('Page name', { exact: true }).nth(1).fill('  CAREERS ');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('unique name');
  await page.getByLabel('Page name', { exact: true }).nth(1).fill('Home');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('listed choices');
  await page.getByLabel('Page name', { exact: true }).nth(1).fill('Press');
  for (let i = 2; i < 10; i++) {
    await page.getByRole('button', { name: 'Add page', exact: true }).click();
    await page
      .getByLabel('Page name', { exact: true })
      .nth(i)
      .fill(`Useful page ${i + 1}`);
  }
  await expect(page.getByRole('button', { name: 'Add page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Remove additional page 10', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add page', exact: true })).toBeEnabled();
  for (let i = 9; i > 2; i--)
    await page.getByRole('button', { name: `Remove additional page ${i}`, exact: true }).click();
  await page.setViewportSize({ width: 320, height: 780 });
  await page.screenshot({ path: info.outputPath('pages-mobile-light.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator('#theme-toggle').click();
  await page.screenshot({ path: info.outputPath('pages-mobile-dark.png'), fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await next(page);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Page name', { exact: true }).first()).toHaveValue('Careers');
  await expect(page.getByLabel('Purpose (optional)', { exact: true }).first()).toHaveValue(
    'Show open roles.',
  );
});

test('None is exclusive, branding opens separately, providers and deadlines are conditional', async ({
  page,
  context,
}) => {
  await begin(page);
  await advanceTo(page, 'Your visual assets');
  await page.getByLabel('Photos', { exact: true }).check();
  await page.getByLabel('None', { exact: true }).check();
  await expect(page.getByLabel('Photos', { exact: true })).not.toBeChecked();
  const popup = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Open the separate logo brief in a new tab' }).click();
  const tab = await popup;
  await tab.waitForLoadState();
  expect(tab.url()).toContain('/client/logo-brief/');
  await tab.close();
  await expect(page.getByLabel('None', { exact: true })).toBeChecked();
  await next(page);
  await page.getByLabel('Online payments', { exact: true }).check();
  await expect(page.locator('#field-capabilities .notice')).toContainText('scope review');
  await page.getByLabel('Other', { exact: true }).check();
  await page.getByLabel('Please specify').fill('Customer accounts');
  await page.getByLabel('None', { exact: true }).check();
  await expect(page.getByLabel('Please specify')).toHaveCount(0);
  await page.getByLabel('Enquiry form', { exact: true }).check();
  await expect(page.getByLabel('None', { exact: true })).not.toBeChecked();
  await advanceTo(page, 'Your domain and business email');
  await page.locator('#field-domain').getByLabel('Already owned', { exact: true }).check();
  await page.getByLabel('Domain provider', { exact: true }).fill('Example domain provider');
  await page.locator('#field-email').getByLabel('Already owned', { exact: true }).check();
  await page.getByLabel('Business email provider', { exact: true }).fill('Example email provider');
  await page.locator('#field-domain').getByLabel('Not needed', { exact: true }).check();
  await expect(page.locator('#domainProvider')).toHaveCount(0);
  await expect(page.locator('#emailProvider')).toHaveValue('Example email provider');
  await advanceTo(page, 'Your deadline');
  await page.getByLabel('Yes', { exact: true }).check();
  await page.getByLabel('Deadline date', { exact: true }).fill('2026-12-31');
  await page.getByLabel('Reason for the deadline', { exact: true }).fill('Opening day');
  await page.getByLabel('No fixed date', { exact: true }).check();
  await expect(page.locator('#deadlineDate')).toHaveCount(0);
});

test('redesign review, PDF and editing stay local and exclude stale redesign answers', async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
  await begin(page);
  await page.getByLabel('Complete redesign', { exact: true }).check();
  await page.locator('#existingURL').fill('https://private-client.example');
  await advanceTo(page, 'Your website pages');
  await page.getByLabel('Home', { exact: true }).check();
  await page.getByRole('button', { name: 'Add page', exact: true }).click();
  await page.getByLabel('Page name', { exact: true }).fill('Careers');
  await page.getByLabel('Purpose (optional)', { exact: true }).fill(secret);
  await advanceTo(page, 'What to retain from your existing website');
  await page.getByLabel('Domain', { exact: true }).check();
  await page.getByLabel('Nothing—start again', { exact: true }).check();
  await expect(page.getByLabel('Domain', { exact: true })).not.toBeChecked();
  await advanceTo(page, 'Anything else');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).toContainText('Careers');
  await expect(page.locator('.brief-review')).toContainText('Nothing—start again');
  await page.screenshot({ path: info.outputPath('review-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#theme-toggle').click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await downloading;
  expect(pdf.suggestedFilename()).toBe('FinTaxTech-website-production-brief.pdf');
  await pdf.saveAs(info.outputPath('website-brief.pdf'));
  await expect(page.getByRole('status')).toContainText('Nothing has been sent');
  await expect(page.getByRole('link', { name: 'Open email' })).toHaveAttribute(
    'href',
    'mailto:ask@fintaxtech.co.uk',
  );
  await expect(page.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa.me\/\d+$/,
  );
  await page
    .getByRole('button', { name: 'Edit answers: Your website project', exact: true })
    .click();
  await page.getByLabel('New website', { exact: true }).check();
  await expect(page.locator('#existingURL')).toHaveCount(0);
  await advanceTo(page, 'Anything else');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).not.toContainText('private-client.example');
  await expect(page.locator('.brief-review')).not.toContainText('Retain from the existing website');
  await expect(page.locator('.brief-review')).toContainText('Careers');
  expect(requests.join('\n')).not.toContain(secret);
  expect(requests.join('\n')).not.toContain('private-client.example');
  expect(
    requests.every(
      (r) =>
        r.startsWith('GET http://localhost:4323/') ||
        r.startsWith('GET blob:http://localhost:4323/'),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    'ftt:consent',
    'ftt:theme',
  ]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
  await page.reload();
  await begin(page);
  await expect(page.locator('[data-brief-form] input:checked')).toHaveCount(0);
});
