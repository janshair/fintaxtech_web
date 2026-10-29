import { enquirySettled } from './enquiry-settled';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const email = 'enquiry.client+test@example.com';
const phone = '+44 7700 900123';
async function continueToContact(page: Page) {
  for (let i = 0; i < 8; i++) {
    if ((await page.locator('#questionnaire h1').textContent()) === 'How should we contact you?')
      return;
    await page
      .locator('#active-question input[type=radio], #active-question input[type=checkbox]')
      .first()
      .check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await enquirySettled(page);
  }
  throw new Error('The short enquiry did not reach its contact question');
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.route('https://api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, body: '{"success":true}' }),
  );
});
for (const service of ['branding', 'websites', 'mobile-apps', 'ai-automation'])
  test(`${service}: inline Email and WhatsApp validate, survive Back, and reach review and PDF`, async ({
    page,
  }, info) => {
    await page.goto(`/enquiry/?service=${service}`);
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    const total = service === 'mobile-apps' ? 6 : 5;
    await expect(page.getByRole('progressbar')).toHaveAttribute('max', String(total));
    await continueToContact(page);
    const root = page.locator('#questionnaire');
    const next = async () => {
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await enquirySettled(page);
    };
    const back = async () => {
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await enquirySettled(page);
    };
    const heading = root.locator('h1');
    await expect(root.locator('input[type=radio]')).toHaveCount(2);
    await expect(page.getByLabel('Zoom call', { exact: true })).toHaveCount(0);
    await expect(root.locator('input[type=email], input[type=tel]')).toHaveCount(0);
    await page.getByLabel('Email', { exact: true }).check();
    const emailInput = page.getByLabel('Email address', { exact: true });
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(root.locator('.field input[type=email]')).toHaveCount(1);
    await next();
    await expect(heading).toHaveText('How should we contact you?');
    await expect(page.getByRole('alert')).toContainText('valid email address');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await emailInput.fill('invalid-address');
    await emailInput.press('Enter');
    await expect(heading).toHaveText('How should we contact you?');
    await emailInput.fill(email);
    await back();
    await next();
    await expect(emailInput).toHaveValue(email);

    await page.getByLabel('WhatsApp', { exact: true }).check();
    await expect(emailInput).toHaveCount(0);
    const whatsappInput = page.getByLabel('WhatsApp number', { exact: true });
    await expect(whatsappInput).toHaveAttribute('type', 'tel');
    await expect(whatsappInput).toHaveValue('');
    await whatsappInput.fill('12345');
    await next();
    await expect(heading).toHaveText('How should we contact you?');
    await expect(page.getByRole('alert')).toContainText(
      'valid UK or international WhatsApp number',
    );
    await whatsappInput.fill(phone);
    if (service === 'branding') {
      await expect(root.locator('.enquiry-conditional')).toHaveAttribute('data-settled', 'true');
      const choices = await root.locator('.choices').boundingBox();
      const field = await root.locator('.quiz-contact .field').boundingBox();
      expect(field!.y).toBeGreaterThan(choices!.y + choices!.height);
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        await page.setViewportSize({ width: 320, height: 780 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({ path: info.outputPath(`contact-${theme}.png`), fullPage: true });
      }
    }
    await next();
    await expect(heading).toHaveText('Anything else we should know?');
    await back();
    await expect(whatsappInput).toHaveValue(phone);
    await page.getByLabel('Email', { exact: true }).check();
    await expect(emailInput).toHaveValue('');
    await emailInput.fill(email);
    await next();
    await next();
    await expect(heading).toHaveText('Your contact details');
    await expect(root.getByLabel('Email address', { exact: true })).toHaveCount(0);
    await expect(root.getByLabel('Telephone or WhatsApp', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Review answers', exact: true }).click();
    await expect(root).toContainText(email);
    await expect(root).not.toContainText(phone);
    await page
      .getByRole('button', { name: 'Edit: How should we contact you?', exact: true })
      .click();
    await expect(emailInput).toHaveValue(email);
    await page.getByLabel('WhatsApp', { exact: true }).check();
    if (service === 'branding') {
      await whatsappInput.fill('12345');
      await back();
      await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
      await expect(heading).toHaveText('How should we contact you?');
      await expect(whatsappInput).toHaveValue('12345');
      await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText(
        'valid UK or international WhatsApp number',
      );
    }
    await whatsappInput.fill('07700 900123');
    await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
    await expect(root).toContainText('WhatsApp number');
    await expect(root).toContainText('07700 900123');
    await expect(root).not.toContainText(email);
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    await expect(heading).toHaveText('Your project enquiry PDF is ready');
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    const file = await downloading;
    expect(file.suggestedFilename()).toBe(
      service === 'ai-automation'
        ? 'FinTaxTech-ai-automation-enquiry.pdf'
        : 'FinTaxTech-project-enquiry.pdf',
    );
    await file.saveAs(info.outputPath(`${service}-contact.pdf`));
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['ftt:consent']);
  });
