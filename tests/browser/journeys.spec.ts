import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('consent')) return;
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
});
async function begin(page, service = 'websites', extra = '') {
  await page.goto(`/start/?service=${service}${extra}`);
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
}
async function complete(page) {
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('heading', { name: 'Your contact details', exact: true }).isVisible())
      break;
    const options = page.locator(
      '#questionnaire input[type=radio],#questionnaire input[type=checkbox]',
    );
    if (await options.count()) await options.first().check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
}
test('all services create local PDFs without sending answers', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const outgoing: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:4323')) outgoing.push(r.url());
  });
  for (const service of ['branding', 'websites', 'mobile-apps', 'prompt-services']) {
    await begin(page, service);
    await complete(page);
    await expect(
      page.getByRole('checkbox', { name: 'Protect my PDF with a password' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Your project enquiry PDF is ready' }),
    ).toBeVisible({ timeout: 30000 });
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    const file = await download;
    await file.saveAs(testInfo.outputPath(`${service}.pdf`));
    expect(
      await page.getByRole('link', { name: 'Continue by email' }).getAttribute('href'),
    ).toContain('ask@fintaxtech.co.uk');
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['ftt:consent']);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  }
  expect(outgoing).toEqual([]);
});
test('required validation and no-assets separate tab preserve website answers', async ({
  page,
  context,
}) => {
  await begin(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Choose an answer');
  for (let i = 0; i < 4; i++) {
    await page.locator('#questionnaire input').first().check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await page.getByLabel('No assets', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const popup = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Open branding questions in a new tab' }).click();
  const tab = await popup;
  await tab.waitForLoadState();
  expect(tab.url()).toContain('service=branding');
  expect(tab.url()).not.toMatch(/answer|promo|No%20assets/);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('No assets', { exact: true })).toBeChecked();
  await tab.close();
});
test('stage two conditional changes remove stale review answers', async ({ page }) => {
  await begin(page, 'websites', '&stage=2');
  await page.getByLabel('Complete redesign and rebuild', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await complete(page);
  await expect(
    page
      .locator('.review-row')
      .filter({ hasText: 'For a redesign, what happens to the current site?' }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Edit: Is this website a new build or a complete redesign and rebuild?',
      exact: true,
    })
    .click();
  await page.getByLabel('New business website', { exact: true }).check();
  await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
  await expect(
    page
      .locator('.review-row')
      .filter({ hasText: 'For a redesign, what happens to the current site?' }),
  ).toHaveCount(0);
});
test('closed promo, sitemap and static fallbacks', async ({ page, request }) => {
  await page.goto('/promo/');
  await expect(page.getByRole('heading', { name: 'This promotion has closed' })).toBeVisible();
  expect(await page.locator('meta[name=robots]').getAttribute('content')).toContain('noindex');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/promo');
  await page.evaluate(() => sessionStorage.setItem('ftt:promo-intent', 'yes'));
  await page.goto('/start/');
  await expect(
    page.getByRole('heading', { name: 'What would you like FinTaxTech to help you create?' }),
  ).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('£999');
});
test('desktop and mobile themes, keyboard and accessibility', async ({ page }, testInfo) => {
  await mkdir('docs/visual-checks', { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      if (testInfo.project.name === 'chromium')
        await page.screenshot({
          path: `docs/visual-checks/home-${width}-${theme}.png`,
          fullPage: true,
        });
    }
  }
  await begin(page);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await expect(page.locator('#questionnaire h1')).toBeFocused();
  await page.keyboard.press(testInfo.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
  await page.keyboard.press('Space');
  await expect(page.locator('#questionnaire input').first()).toBeChecked();
});
test('consent rejects by default and remains changeable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('ftt:consent'));
  await page.reload();
  await expect(page.locator('#consent-banner')).toBeVisible();
  await page.locator('#consent-banner').getByRole('button', { name: 'Manage cookies' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Optional analytics' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.locator('#consent-banner')).toBeHidden();
  await page.locator('footer').getByRole('button', { name: 'Manage cookies' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
test('marketing navigation works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4323/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'What does your business need next?',
  );
  await page.goto('http://localhost:4323/start/');
  await expect(page.locator('.service-card')).toHaveCount(4);
  await page.goto('http://localhost:4323/enquiry/');
  await expect(page.locator('#quiz-fallback')).toBeVisible();
  await context.close();
});

for (const service of ['branding', 'websites', 'mobile-apps', 'prompt-services']) {
  test(`detailed ${service} brief produces a PDF`, async ({ page }, testInfo) => {
    await begin(page, service, '&stage=2');
    await complete(page);
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Your project enquiry PDF is ready' }),
    ).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    await (await download).saveAs(testInfo.outputPath(`${service}-detailed.pdf`));
  });
}

test('partial PDF and generation failure preserve the readable review', async ({ page }) => {
  await begin(page);
  await page.getByLabel('New business website', { exact: true }).check();
  await page.getByRole('button', { name: 'Save PDF for later' }).click();
  await expect(page.getByRole('heading', { name: 'Save an unfinished summary' })).toBeVisible();
  await expect(page.locator('.review-row')).toHaveCount(2);
  await page.route('**/fonts/DejaVuSans.ttf', (route) => route.abort());
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The PDF could not be created');
  await expect(page.locator('.review-row').first()).toContainText('New business website');
  await page.unroute('**/fonts/DejaVuSans.ttf');
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your project enquiry PDF is ready' }),
  ).toBeVisible();
});

test('mobile questionnaire layout and menu support small landscape screens', async ({
  page,
}, testInfo) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
    await begin(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'chromium')
      await page.screenshot({
        path: `docs/visual-checks/question-${viewport.width}.png`,
        fullPage: true,
      });
  }
});
