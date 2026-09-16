import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mobileAppBriefSections as sections } from '../../src/content/mobile-app-brief';

const route = '/client/mobile-app-brief/';
const secret = 'LOCAL-MOBILE-DETAIL-7392';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(route);
});
async function begin(page: Page) {
  await page.getByRole('button', { name: 'Begin mobile app brief' }).click();
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'Next', exact: true }).click();
}
async function advanceTo(page: Page, title: string) {
  for (let i = 0; i < 16; i++) {
    const current = await page.locator('[data-brief-form] h2').innerText();
    if (current === title) return;
    for (const field of sections.find((s) => s.title === current)!.fields) {
      const wrap = page.locator(`#field-${field.id}`);
      if (!(await wrap.count())) continue;
      if (field.type === 'single' || field.type === 'multi') {
        if (!(await wrap.locator('input:checked').count()))
          await wrap.locator('input').first().check();
      } else if (['text', 'urls', 'date'].includes(field.type) && !field.optional) {
        const input = page.locator(`#${field.id}`);
        if (!(await input.inputValue()))
          await input.fill(
            field.type === 'urls'
              ? 'https://private-client.example/app'
              : field.type === 'date'
                ? '2026-12-31'
                : secret,
          );
      }
    }
    await next(page);
  }
  throw new Error(`Did not reach ${title}`);
}
async function addFeature(page: Page, index: number, name = `Custom capability ${index + 1}`) {
  await page.getByRole('button', { name: 'Add custom feature', exact: true }).click();
  await page.getByLabel('Feature name', { exact: true }).nth(index).fill(name);
  await page.getByLabel('What should it do?', { exact: true }).nth(index).fill(secret);
  await page
    .locator('#field-customFeatures > .brief-row')
    .nth(index)
    .getByLabel('Later', { exact: true })
    .check();
}

test('unlinked static route is noindex with no payment gate, analytics, password or upload controls', async ({
  page,
  request,
}) => {
  expect((await request.get(route)).status()).toBe(200);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://fintaxtech.co.uk/client/mobile-app-brief/',
  );
  await expect(page.locator('h1')).toHaveText('Mobile App Production Brief');
  await expect(
    page.locator('header a[href*="mobile-app-brief"], footer a[href*="mobile-app-brief"]'),
  ).toHaveCount(0);
  for (const path of ['/sitemap.xml', '/rss.xml', '/', '/start/', '/blog/'])
    expect(await (await request.get(path)).text()).not.toContain(route);
  await expect(page.getByText('Anyone with its link can open it.', { exact: false })).toBeVisible();
  await expect(
    page.getByText('Refreshing or closing clears the brief.', { exact: false }),
  ).toBeVisible();
  await begin(page);
  await expect(page.locator('input[type=password], input[type=file]')).toHaveCount(0);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
});

test('keyboard, Other details, task maximum and device choices work without contradictory answers', async ({
  page,
}) => {
  await begin(page);
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('New app', { exact: true }).focus();
  await page.keyboard.press('Space');
  await next(page);
  await page.getByLabel('Other', { exact: true }).check();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Please specify').fill('Volunteers');
  await next(page);
  for (const name of ['Book', 'Buy/pay', 'Browse content'])
    await page.getByLabel(name, { exact: true }).check();
  await page.getByLabel('Communicate', { exact: true }).click();
  await expect(page.getByLabel('Communicate', { exact: true })).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText('3 of 3');
  await next(page);
  await page.getByLabel('Both', { exact: true }).check();
  await page.getByLabel('Tablets too', { exact: true }).check();
  await page
    .locator('#field-devices')
    .getByLabel('FinTaxTech to recommend', { exact: true })
    .check();
  await expect(page.locator('#field-tablets')).toHaveCount(0);
  await page.getByLabel('iPhone', { exact: true }).check();
  await expect(page.getByLabel('Tablets too', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Both', { exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Book', { exact: true })).toBeChecked();
});

test('repeatable features validate, enforce ten rows, edit/remove, and work on narrow screens in both themes', async ({
  page,
}, info) => {
  await begin(page);
  await advanceTo(page, 'Features and first-release priorities');
  await page.locator('#field-features').getByLabel('Search', { exact: true }).check();
  await page.locator('#field-essentialFeatures').getByLabel('Search', { exact: true }).check();
  await page.getByLabel('Other', { exact: true }).check();
  await expect(page.getByLabel('Please specify')).toHaveCount(0);
  await next(page);
  await expect(page.getByRole('alert')).toContainText('at least one');
  await page.getByRole('button', { name: 'Add custom feature', exact: true }).click();
  await expect(page.getByLabel('Feature name', { exact: true })).toBeFocused();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Feature name', { exact: true }).fill('Routing rules');
  await page.getByLabel('What should it do?', { exact: true }).fill(secret);
  await page.getByLabel('Yes', { exact: true }).check();
  await addFeature(page, 1, '  ROUTING rules ');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('unique name');
  await page.getByLabel('Feature name', { exact: true }).nth(1).fill('Search');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('listed feature');
  await page.getByLabel('Feature name', { exact: true }).nth(1).fill('Delivery instructions');
  for (let i = 2; i < 10; i++) await addFeature(page, i);
  await expect(page.getByRole('button', { name: 'Add custom feature' })).toBeDisabled();
  await page.getByRole('button', { name: 'Remove custom feature 10', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add custom feature' })).toBeEnabled();
  for (let i = 9; i > 2; i--)
    await page.getByRole('button', { name: `Remove custom feature ${i}`, exact: true }).click();
  for (const [width, theme] of [
    [320, 'light'],
    [390, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    if (theme === 'dark') await page.locator('#theme-toggle').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`features-${width}-${theme}.png`),
      fullPage: true,
    });
  }
  await next(page);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Feature name', { exact: true }).first()).toHaveValue(
    'Routing rules',
  );
  await page.locator('#field-features').getByLabel('Search', { exact: true }).uncheck();
  await expect(page.locator('#field-essentialFeatures')).toHaveCount(0);
  await page.getByLabel('Other', { exact: true }).uncheck();
  await page.getByLabel('Other', { exact: true }).check();
  await expect(page.getByLabel('Feature name', { exact: true })).toHaveCount(0);
});

test('sensitive scope notice, systems, assets, separate developer accounts and deadline branching', async ({
  page,
  context,
}) => {
  await begin(page);
  await advanceTo(page, 'Information the app will handle');
  await page.getByLabel('Health or other sensitive information', { exact: true }).check();
  await expect(page.locator('#field-information .notice')).toContainText(
    'scope and privacy review',
  );
  await page.getByLabel('None', { exact: true }).check();
  await expect(
    page.getByLabel('Health or other sensitive information', { exact: true }),
  ).not.toBeChecked();
  await next(page);
  await page.getByLabel('Yes', { exact: true }).check();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('at least one');
  await page.getByRole('button', { name: 'Add system', exact: true }).click();
  await page.getByLabel('System name', { exact: true }).fill('Scheduling system');
  await page
    .getByLabel('Purpose of the connection', { exact: true })
    .fill('Read available appointments.');
  await page.getByRole('button', { name: 'Add system', exact: true }).click();
  await page.getByLabel('System name', { exact: true }).nth(1).fill('Business records');
  await page.getByLabel('Purpose of the connection', { exact: true }).nth(1).fill('Sync work');
  await page.getByRole('button', { name: 'Remove system 2', exact: true }).click();
  await page.getByLabel('No', { exact: true }).check();
  await page.getByLabel('Yes', { exact: true }).check();
  await expect(page.getByLabel('System name', { exact: true })).toHaveCount(0);
  await page.getByLabel('No', { exact: true }).check();
  await advanceTo(page, 'Your existing assets');
  await page.getByLabel('Photos', { exact: true }).check();
  await page.getByLabel('None', { exact: true }).check();
  await expect(page.getByLabel('Photos', { exact: true })).not.toBeChecked();
  const popup = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Open the separate logo brief in a new tab' }).click();
  const tab = await popup;
  await tab.waitForLoadState();
  expect(tab.url()).toContain('/client/logo-brief/');
  await tab.close();
  await next(page);
  await page.locator('#field-appleAccount').getByLabel('Yes', { exact: true }).check();
  await page.locator('#field-googleAccount').getByLabel('No', { exact: true }).check();
  await expect(
    page.locator('#field-appleAccount').getByLabel('Yes', { exact: true }),
  ).toBeChecked();
  await advanceTo(page, 'Your deadline');
  await page.getByLabel('Yes', { exact: true }).check();
  await page.getByLabel('Deadline date', { exact: true }).fill('2026-12-31');
  await page.getByLabel('Reason for the deadline', { exact: true }).fill('Launch');
  await page.getByLabel('No fixed date', { exact: true }).check();
  await expect(page.locator('#deadlineDate')).toHaveCount(0);
});

test('review, editing and PDF download stay local, include priorities and clear after refresh', async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
  await begin(page);
  await page.getByLabel('Complete redesign', { exact: true }).check();
  await page
    .locator('#appLinks')
    .fill('https://private-client.example/app\nhttps://private-client.example/android');
  await advanceTo(page, 'Features and first-release priorities');
  await page.locator('#field-features').getByLabel('Booking', { exact: true }).check();
  await page.locator('#field-essentialFeatures').getByLabel('Booking', { exact: true }).check();
  await page.getByLabel('Other', { exact: true }).check();
  await addFeature(page, 0, 'Routing rules');
  await advanceTo(page, 'Connections to other systems');
  await page.getByLabel('Yes', { exact: true }).check();
  await page.getByRole('button', { name: 'Add system', exact: true }).click();
  await page.getByLabel('System name', { exact: true }).fill('Scheduling system');
  await page.getByLabel('Purpose of the connection', { exact: true }).fill(secret);
  await advanceTo(page, 'Anything else');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).toContainText('Routing rules');
  await expect(page.locator('.brief-review')).toContainText('Needed in first release?: Later');
  await expect(page.locator('.brief-review')).toContainText('Scheduling system');
  await expect(
    page.getByText('This brief does not alter the written proposal', { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('review-desktop-light.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#theme-toggle').click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('review-mobile-dark.png'), fullPage: true });
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await downloading;
  expect(pdf.suggestedFilename()).toBe('FinTaxTech-mobile-app-production-brief.pdf');
  await pdf.saveAs(info.outputPath('mobile-brief.pdf'));
  await expect(page.getByRole('status')).toContainText('Nothing has been sent');
  await expect(page.getByRole('link', { name: 'Open email' })).toHaveAttribute(
    'href',
    'mailto:ask@fintaxtech.co.uk',
  );
  await expect(page.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa.me\/\d+$/,
  );
  await page.getByRole('button', { name: 'Edit answers: Your app project', exact: true }).click();
  await page.getByLabel('New app', { exact: true }).check();
  await advanceTo(page, 'Anything else');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).not.toContainText('private-client.example');
  await expect(page.locator('.brief-review')).toContainText('Routing rules');
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
