import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('branding design image grid validates, preserves Back and review edits, and downloads a PDF', async ({
  page,
}, info) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.route('https://api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, body: '{"success":true}' }),
  );
  await page.goto('/enquiry/?service=branding');
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  const heading = page.locator('#questionnaire h1');
  const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(heading).toHaveText('Which items are required?');
  await expect(page.getByRole('progressbar')).toHaveAttribute('max', '5');
  await page.getByLabel('Logo', { exact: true }).check();
  await next();
  await expect(heading).toHaveText('Choose desired design');
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '2');
  await expect(page.locator('.choice-illustrated')).toHaveCount(17);
  await expect(page.locator('.choice-credit')).toHaveCount(17);
  await expect(page.locator('#active-question input[type=radio]')).toHaveCount(19);
  await expect(page.locator('.choices-followup .choice')).toHaveCount(2);
  await expect
    .poll(() =>
      page
        .locator('.choice-illustrated img')
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true);
  await next();
  await expect(heading).toHaveText('Choose desired design');
  await expect(page.getByRole('alert')).not.toBeEmpty();
  for (const width of [1280, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      const first = page.locator('.choice-illustrated').first();
      const image = await first.locator('img').boundingBox();
      const title = await first.locator('.choice-title').boundingBox();
      expect(image!.y + image!.height).toBeLessThanOrEqual(title!.y);
      await page.screenshot({
        path: info.outputPath(`design-grid-${width}-${theme}.png`),
        fullPage: true,
      });
    }
  }
  await page.getByLabel('Minimalism', { exact: true }).check();
  await page.getByLabel('Minimalism', { exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Maximalism', { exact: true })).toBeChecked();
  for (const style of [
    'Flat design',
    'Geometric',
    'Retro / Vintage',
    'Hand-drawn / Organic',
    'Typographic',
    'Illustrative / Mascot',
    'Luxury / Elegant',
    'Abstract',
    'Not sure — help me choose',
    'Other — share a reference later',
  ]) {
    await page.getByLabel(style, { exact: true }).check();
    await expect(page.getByLabel(style, { exact: true })).toBeChecked();
    await expect(page.locator('#active-question input[type=radio]:checked')).toHaveCount(1);
  }
  await expect(
    page.locator('#active-question textarea, #active-question input:not([type=radio])'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Logo', { exact: true })).toBeChecked();
  await next();
  await expect(page.getByLabel('Other — share a reference later', { exact: true })).toBeChecked();
  await next();
  await page.getByLabel('New business', { exact: true }).check();
  await next();
  await page.getByLabel('Email', { exact: true }).check();
  await page.getByLabel('Email address', { exact: true }).fill('branding@example.com');
  await next();
  await next();
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  await expect(page.locator('#questionnaire')).toContainText('Other — share a reference later');
  await expect(
    page.getByRole('button', { name: 'Edit: What do you need?', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit: Choose desired design', exact: true }).click();
  await expect(page.getByLabel('Other — share a reference later', { exact: true })).toBeChecked();
  await page.getByLabel('Not sure — help me choose', { exact: true }).check();
  await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
  await expect(page.locator('#questionnaire')).toContainText('Not sure — help me choose');
  await expect(page.locator('#questionnaire')).not.toContainText('Other — share a reference later');
  await page.getByRole('button', { name: 'Edit: Choose desired design', exact: true }).click();
  await expect(page.getByLabel('Not sure — help me choose', { exact: true })).toBeChecked();
  await page.getByLabel('Retro / Vintage', { exact: true }).check();
  await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
  await expect(page.locator('#questionnaire')).toContainText('Retro / Vintage');
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  await expect(heading).toHaveText('Your project enquiry PDF is ready');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('FinTaxTech-project-enquiry.pdf');
  await download.saveAs(info.outputPath('branding-design.pdf'));
  expect(await download.failure()).toBeNull();
});
