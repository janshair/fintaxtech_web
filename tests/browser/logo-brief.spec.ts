import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { createWebsiteBriefAPI } from '../../src/server/website-brief-api';
import { logoBriefSections as sections } from '../../src/content/logo-brief';

const sectionIndex = (id: string) =>
  sections.findIndex((section) => section.fields.some((field) => field.id === id));
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
        await wrap.locator('input').first().click();
    } else if (['text', 'long', 'date'].includes(field.type)) {
      if (!field.optional && !(await page.locator(`#${field.id}`).inputValue()))
        await page.locator(`#${field.id}`).fill(field.type === 'date' ? '2026-12-31' : secret);
    } else if (field.type === 'confirm') await page.locator(`#${field.id}`).click();
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

test('shortened sections, exact name, Other, maximum and shared design cards preserve answers', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await begin(page);
  await expect(page.getByRole('progressbar')).toHaveAttribute('max', '7');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#error-project')).toContainText('Complete');
  await page.getByLabel('New brand', { exact: true }).focus();
  await page.keyboard.press('Space');
  await page.getByLabel('Trading name', { exact: true }).fill('Studio MiXeD');
  await page.getByLabel('I confirm the exact spelling and capitalisation: Studio MiXeD').click();
  await page.getByLabel('Trading name', { exact: true }).fill('Studio MIXED');
  await expect(page.locator('#nameConfirmed')).not.toBeChecked();
  await expect(page.locator('#field-legalDifferent, #field-legal')).toHaveCount(0);
  await page.getByLabel('Must appear with logo', { exact: true }).check();
  await page.locator('#taglineText').fill('A temporary tagline');
  await page.getByLabel('No tagline', { exact: true }).check();
  await expect(page.locator('#taglineText')).toHaveCount(0);
  await page.getByLabel('Must appear with logo', { exact: true }).check();
  await expect(page.locator('#taglineText')).toHaveValue('');
  await page.getByLabel('No tagline', { exact: true }).check();
  await advanceTo(page, sectionIndex('service1'));
  await page.locator('#service1').fill('Useful customer services and original online content.');
  await page.locator('#field-customers').getByLabel('Other', { exact: true }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Please specify').fill('Online viewers');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Please specify')).toHaveValue('Online viewers');
  await expect(page.locator('#service1')).toHaveValue(
    'Useful customer services and original online content.',
  );
  await advanceTo(page, sectionIndex('personality'));
  for (const name of ['Professional', 'Trustworthy', 'Friendly', 'Modern', 'Established'])
    await page.getByLabel(name, { exact: true }).check();
  await page.getByLabel('Creative', { exact: true }).click();
  await expect(page.getByLabel('Creative', { exact: true })).not.toBeChecked();
  await expect(page.getByRole('alert')).toContainText('no more than 5');
  await expect(page.getByRole('status')).toContainText('5 of 5');
  await advanceTo(page, sectionIndex('designStyle'));
  const designs = page.locator('#field-designStyle');
  await expect(designs.locator('.choice-illustrated img')).toHaveCount(17);
  await expect(designs.locator('input[type=radio]')).toHaveCount(19);
  await expect(designs.locator('.choice-credit')).toHaveCount(17);
  await expect
    .poll(() =>
      designs
        .locator('img')
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true);
  await designs.getByLabel('Not sure — help me choose', { exact: true }).check();
  await designs.getByLabel('Other — share a reference later', { exact: true }).check();
  await expect(designs.locator('input:not([type=radio]), textarea')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('#field-personality input:checked')).toHaveCount(5);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    designs.getByLabel('Other — share a reference later', { exact: true }),
  ).toBeChecked();
  await designs.getByLabel('Retro / Vintage', { exact: true }).check();
  await expect(page.locator('#field-format .brief-examples img')).toHaveCount(4);
  const ideas = page.locator('#welcomeIdeas');
  const priority = page.locator('#field-welcomeIdeasPriority');
  await expect(ideas).toHaveJSProperty('tagName', 'TEXTAREA');
  await expect(priority).toHaveCount(0);
  await ideas.fill('   ');
  await expect(priority).toHaveCount(0);
  await ideas.fill('');
  await ideas.pressSequentially('Explore a circular symbol based on the initials.');
  await expect(ideas).toBeFocused();
  await expect(ideas).toHaveValue('Explore a circular symbol based on the initials.');
  await expect(priority.locator('input')).toHaveCount(4);
  await expect(priority.locator('input:checked')).toHaveCount(0);
  await page.getByLabel('Designer to recommend', { exact: true }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Complete');
  await priority
    .getByLabel('This is a core idea and should appear in most concepts', { exact: true })
    .check();
  await ideas.fill('   ');
  await expect(priority).toHaveCount(0);
  await expect(ideas).toBeFocused();
  await ideas.fill('Explore a circular symbol based on the initials.');
  await expect(priority.locator('input:checked')).toHaveCount(0);
  await priority.getByLabel('Please explore it in at least one concept', { exact: true }).check();
  await page.locator('#avoidSymbols').fill('No sharp angles or bright gradients.');
  await expect(page.locator('#field-avoid')).toHaveCount(0);
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`designs-${width}-${theme}.png`),
        fullPage: true,
      });
    }
  }
  await advanceTo(page, sectionIndex('anything'));
  await fillSection(page, sectionIndex('anything'));
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).toContainText('Retro / Vintage');
  await expect(page.locator('.brief-review')).toContainText('No sharp angles or bright gradients.');
  await expect(page.locator('.brief-review')).not.toContainText('Brand voice');
  await expect(page.locator('.brief-review')).not.toContainText('Future services?');
});

test('image validation, captions, removal, replacement and competitor limits', async ({ page }) => {
  await begin(page);
  await advanceTo(page, sectionIndex('competitors'));
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Add competitor' }).click();
  await expect(page.getByRole('button', { name: 'Add competitor' })).toBeDisabled();
  for (let i = 5; i > 0; i--)
    await page.getByRole('button', { name: `Remove competitor ${i}`, exact: true }).click();
  await advanceTo(page, sectionIndex('references'));
  await page.getByLabel('Yes', { exact: true }).click();
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
  await page
    .getByLabel('What specifically do you like about this reference?')
    .fill('Strong silhouette');
  await page.getByLabel('Replace reference image 1').setInputFiles(await image());
  await expect(page.getByRole('status')).toContainText('updated');
  await expect(page.getByLabel('What specifically do you like about this reference?')).toHaveValue(
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
  await page.getByLabel('No', { exact: true }).click();
  await page.getByLabel('Yes', { exact: true }).click();
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
  await advanceTo(page, sectionIndex('anything'));
  await fillSection(page, sectionIndex('anything'));
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
  await expect(page.getByRole('status')).toContainText('Downloading does not submit');
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

test('redesign fields, logo uses, server validation and explicit submission retry', async ({
  page,
}) => {
  // Isolate ticket/rate state from other browser projects. Exercise the real server
  // handler, with only its outbound Slack transport replaced by a deterministic mock.
  let deliveries = 0;
  const handle = createWebsiteBriefAPI({
    origin: 'http://localhost:4323',
    webhook: 'https://hooks.slack.com/services/TEST_ONLY',
    fetcher: async () =>
      new Response(++deliveries === 1 ? 'invalid_payload' : 'ok', {
        status: deliveries === 1 ? 400 : 200,
      }),
  });
  await page.route('**/api/logo-brief/**', async (route) => {
    const request = route.request();
    const response = await handle(
      new Request(request.url(), {
        method: request.method(),
        headers: request.headers(),
        body: request.postData(),
      }),
      'logo-browser-test',
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    });
  });
  const submissions: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/api/logo-brief/')) submissions.push(request.postData() ?? '');
    expect(request.url()).not.toContain('hooks.slack.com');
  });
  await begin(page);
  await page.getByLabel('Complete redesign', { exact: true }).click();
  await expect(page.locator('#identityProblems')).toBeVisible();
  await expect(page.locator('#identityImprovements')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#error-identityProblems')).toContainText('Complete');
  await expect(page.locator('#error-identityImprovements')).toContainText('Complete');
  await page.locator('#identityProblems').fill('Our existing logo is hard to read on vehicles.');
  await page.getByLabel('Choose current logo').setInputFiles(await image());
  await expect(page.getByRole('status')).toContainText('updated');
  await page.getByLabel('New brand', { exact: true }).click();
  await expect(page.locator('#identityProblems')).toHaveCount(0);
  await expect(page.locator('#identityImprovements')).toHaveCount(0);
  await page.getByLabel('Complete redesign', { exact: true }).click();
  await expect(page.locator('#identityProblems')).toHaveValue('');
  await expect(page.locator('#identityImprovements')).toHaveValue('');
  await page.locator('#identityImprovements').fill('Make it simpler and more modern.');
  await page.locator('#identityProblems').fill('Our existing logo is hard to read on vehicles.');
  await page.getByLabel('Choose current logo').setInputFiles(await image());
  await expect(page.getByRole('status')).toContainText('updated');
  await advanceTo(page, sectionIndex('uses'));
  await page.locator('#field-uses').getByLabel('Signage', { exact: true }).click();
  await page.locator('#field-uses').getByLabel('Vehicles', { exact: true }).click();
  await expect(page.locator('#field-primaryUse')).toHaveCount(0);
  await page.locator('#field-uses').getByLabel('Vehicles', { exact: true }).uncheck();
  await expect(page.locator('#field-uses').getByLabel('Signage', { exact: true })).toBeChecked();
  await advanceTo(page, sectionIndex('anything'));
  await fillSection(page, sectionIndex('anything'));
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  expect(submissions).toHaveLength(0);
  await expect(page.locator('[data-brief-form]')).toContainText('Nothing has been submitted yet');
  await expect(page.locator('.brief-review img')).toHaveCount(2);
  await page.getByRole('button', { name: 'Submit brief', exact: true }).dblclick();
  await expect(page.getByRole('status')).toContainText('could not be submitted');
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  expect(submissions).toHaveLength(1);
  await page.getByRole('button', { name: 'Submit brief', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Brief submitted', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('securely submitted to FinTaxTech');
  expect(submissions).toHaveLength(2);
  expect(JSON.parse(submissions[0]).submissionId).toBe(JSON.parse(submissions[1]).submissionId);
  expect(deliveries).toBe(2);
  const payload = JSON.parse(submissions[0]);
  expect(payload.txt).toContain('[REDESIGN]');
  expect(payload.txt).toContain('Requested improvements:\n  Make it simpler and more modern.');
  expect(payload.txt).not.toContain('Elements to retain:');
  expect(payload.txt).toContain('Logo uses:\n  Signage');
  expect(payload.txt).toContain('Desired design style:\n  Skeuomorphism');
  expect(payload.txt).not.toContain('Most important use:');
  expect(payload.state.images.every((image: { data: string }) => image.data === '')).toBe(true);
  expect(submissions[0]).not.toContain('SLACK_WEBHOOK');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  await downloading;
  await expect(page.getByRole('button', { name: 'Brief submitted', exact: true })).toBeDisabled();
  expect(submissions).toHaveLength(2);
});

test('emoji answers download locally unchanged and repeated PDF failures show one message', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  let submissions = 0;
  await page.route('**/api/logo-brief/**', (route) => {
    submissions++;
    return route.fulfill({ status: 503, body: '{}' });
  });
  const story = 'A fictional film studio.\n🌍 Discover places\n🎥 Film scenes\n🚶‍♂️ Explore on foot';
  await begin(page);
  await page.locator('#brandStory').fill(story);
  await advanceTo(page, sectionIndex('anything'));
  await fillSection(page, sectionIndex('anything'));
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).toContainText(story);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const file = await downloading;
  expect(await file.failure()).toBeNull();
  await file.saveAs(info.outputPath('emoji-logo-brief.pdf'));
  await expect(page.getByRole('status')).toContainText('Downloading does not submit');
  await expect(page.locator('.brief-review')).toContainText(story);
  expect(submissions).toBe(0);

  await page.route('**/fonts/DejaVuSans.ttf', (route) => route.fulfill({ status: 503, body: '' }));
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const error =
    'The PDF could not be created. Your answers are still here. Please try again. If it keeps failing, contact FinTaxTech so we can recover your brief.';
  await expect(page.getByRole('status')).toHaveText(error);
  await page.getByRole('button', { name: 'Submit brief', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(error);
  await expect(page.locator('.brief-review')).toContainText(story);
  expect(submissions).toBe(0);
});
