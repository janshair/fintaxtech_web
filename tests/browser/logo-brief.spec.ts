import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { logoBriefSections as sections } from '../../src/content/logo-brief';

const route = '/client/logo-brief/';
const secret = 'LOCAL-ONLY-BRIEF-7492';
const image = async () => ({
  name: 'private-reference-7492.png',
  mimeType: 'image/png',
  buffer: await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#d8dce3' } })
    .png()
    .toBuffer(),
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(route);
});
async function begin(page: Page) {
  await page.getByRole('button', { name: 'Begin logo brief' }).click();
}
async function fillSection(page: Page, index: number) {
  for (const field of sections[index].fields) {
    const wrap = page.locator(`#field-${field.id}`);
    if (!(await wrap.count())) continue;
    if (field.type === 'single' || field.type === 'multi') {
      if (!(await wrap.locator('input:checked').count()))
        await wrap.locator('input').first().check();
    } else if (['text', 'long', 'date'].includes(field.type)) {
      if (!field.optional && !(await page.locator(`#${field.id}`).inputValue()))
        await page.locator(`#${field.id}`).fill(field.type === 'date' ? '2026-12-31' : secret);
    } else if (field.type === 'confirm') await page.locator(`#${field.id}`).check();
    else if (field.type === 'images') {
      if (!(await page.locator('.brief-reference').count()))
        await page.locator('#reference-upload').setInputFiles(await image());
      await expect(page.getByRole('status')).toContainText('updated');
      for (const input of await page.locator('[id^="explanation-"]').all())
        if (!(await input.inputValue()))
          await input.fill('I like the balanced proportions and readable lettering.');
    }
  }
}
async function advanceTo(page: Page, target: number) {
  while (true) {
    const current =
      Number(
        (await page.getByRole('progressbar').getAttribute('aria-label'))!.match(
          /Section (\d+)/,
        )![1],
      ) - 1;
    if (current >= target) break;
    await fillSection(page, current);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
}

test('private route is static, unlinked, noindex/nofollow and absent from feeds', async ({
  page,
  request,
}) => {
  expect((await request.get(route)).status()).toBe(200);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://fintaxtech.co.uk/client/logo-brief/',
  );
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(
    page.locator('header a[href*="logo-brief"], footer a[href*="logo-brief"]'),
  ).toHaveCount(0);
  for (const path of ['/sitemap.xml', '/rss.xml', '/blog/'])
    expect(await (await request.get(path)).text()).not.toContain(route);
  expect(await page.locator('main').innerText()).toContain('not a quote request');
  expect(await page.locator('main').innerText()).not.toMatch(
    /£|budget|source-file|revision rounds/i,
  );
  await expect(page.locator('input[type=password]')).toHaveCount(0);
});

test('conditional fields, exact name, Other, maximum and style exclusivity work with keyboard', async ({
  page,
}, info) => {
  await begin(page);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('New brand', { exact: true }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Trading name', { exact: true }).fill('Studio MiXeD');
  await page.getByLabel('Yes', { exact: true }).check();
  await page.getByLabel('Legal name', { exact: true }).fill('Private Legal Ltd');
  await page.getByLabel('I confirm the exact spelling and capitalisation: Studio MiXeD').check();
  await page.getByLabel('Trading name', { exact: true }).fill('Studio MIXED');
  await expect(page.locator('#nameConfirmed')).not.toBeChecked();
  await page.getByLabel('No', { exact: true }).check();
  await expect(page.locator('#legal')).toHaveCount(0);
  await page.getByLabel('Yes', { exact: true }).check();
  await expect(page.locator('#legal')).toHaveValue('');
  await page.getByLabel('No', { exact: true }).check();
  await advanceTo(page, 3);
  await page.getByLabel('Other', { exact: true }).check();
  await page.locator('#service1').fill('Useful customer service');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Please specify').fill('Distinctive consultancy');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Please specify')).toHaveValue('Distinctive consultancy');
  await advanceTo(page, 6);
  for (const name of ['Professional', 'Trustworthy', 'Friendly', 'Modern', 'Established'])
    await page.getByLabel(name, { exact: true }).check();
  await page.getByLabel('Creative', { exact: true }).click();
  await expect(page.getByLabel('Creative', { exact: true })).not.toBeChecked();
  await expect(page.getByRole('alert')).toContainText('no more than 5');
  await expect(page.getByRole('status')).toContainText('5 of 5');
  await advanceTo(page, 7);
  await expect(page.locator('.brief-examples img')).toHaveCount(4);
  await page.screenshot({ path: info.outputPath('formats-desktop.png'), fullPage: true });
  await advanceTo(page, 8);
  await expect(page.locator('.brief-examples img')).toHaveCount(9);
  await page.getByLabel('Gradients', { exact: true }).check();
  await page.getByLabel('Other', { exact: true }).check();
  await page.getByLabel('Please specify').fill('No sharp angles');
  await page.getByLabel('No preference', { exact: true }).check();
  await expect(page.getByLabel('Gradients', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Please specify')).toHaveCount(0);
  await page.getByLabel('Gradients', { exact: true }).check();
  await expect(page.getByLabel('No preference', { exact: true })).not.toBeChecked();
  await page.setViewportSize({ width: 320, height: 780 });
  await page.locator('#theme-toggle').click();
  await page.screenshot({ path: info.outputPath('styles-mobile-dark.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
});

test('image validation, captions, removal, replacement and competitor limits', async ({ page }) => {
  await begin(page);
  await advanceTo(page, 9);
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Add competitor' }).click();
  await expect(page.getByRole('button', { name: 'Add competitor' })).toBeDisabled();
  for (let i = 5; i > 0; i--)
    await page.getByRole('button', { name: `Remove competitor ${i}`, exact: true }).click();
  await advanceTo(page, 10);
  await page.getByLabel('Yes', { exact: true }).check();
  const upload = page.locator('#reference-upload');
  await upload.setInputFiles({
    name: 'unsafe.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  await expect(page.getByRole('status')).toContainText('not accepted');
  await upload.setInputFiles({
    name: 'oversize.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole('status')).toContainText('5 MB');
  await upload.setInputFiles({
    name: 'corrupt.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71, 0, 0, 0, 0]),
  });
  await expect(page.getByRole('status')).toContainText('could not be read');
  await upload.setInputFiles(await image());
  await expect(page.getByRole('status')).toContainText('updated');
  const preview = page.locator('.brief-reference img');
  expect(
    await preview.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]),
  ).toEqual([1600, 800]);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('What quality do you like, and why?').fill('Strong silhouette');
  await page.getByLabel('Replace reference image 1').setInputFiles(await image());
  await expect(page.getByRole('status')).toContainText('updated');
  await expect(page.getByLabel('What quality do you like, and why?')).toHaveValue(
    'Strong silhouette',
  );
  await page.getByRole('button', { name: 'Remove reference image 1' }).click();
  await expect(preview).toHaveCount(0);
  await upload.setInputFiles(
    Array.from({ length: 6 }, (_, i) => ({
      name: `${i}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from('x'),
    })),
  );
  await expect(page.getByRole('status')).toContainText('up to five');
  await upload.setInputFiles(await image());
  await expect(page.getByRole('status')).toContainText('updated');
  await page.getByLabel('No', { exact: true }).check();
  await page.getByLabel('Yes', { exact: true }).check();
  await expect(preview).toHaveCount(0);
});

test('review and local PDF preserve privacy, render on mobile, and clear on refresh', async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`),
  );
  await begin(page);
  await advanceTo(page, 15);
  await page.locator('#anything').fill('A concise final note.');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your logo brief' })).toBeVisible();
  await expect(page.locator('.brief-review img')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Open email' })).toHaveAttribute(
    'href',
    'mailto:ask@fintaxtech.co.uk',
  );
  await expect(page.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa.me\/\d+$/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath('review-mobile-light.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const file = await downloading;
  expect(file.suggestedFilename()).toBe('FinTaxTech-logo-design-brief.pdf');
  await file.saveAs(info.outputPath('logo-brief.pdf'));
  await expect(page.getByRole('status')).toContainText('Nothing has been sent');
  expect(requests.join('\n')).not.toContain(secret);
  expect(requests.join('\n')).not.toContain('private-reference-7492');
  expect(
    requests.every(
      (request) =>
        request.startsWith('GET http://localhost:4323/') ||
        request.startsWith('GET blob:http://localhost:4323/'),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['ftt:consent']);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
  await page.reload();
  await begin(page);
  await expect(page.locator('input:checked')).toHaveCount(0);
});
