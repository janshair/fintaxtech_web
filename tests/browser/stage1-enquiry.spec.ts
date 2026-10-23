import { test, expect, type Page } from '@playwright/test';

const root = (page: Page) => page.locator('#questionnaire');
const next = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true }).click();
const back = (page: Page) => page.getByRole('button', { name: 'Back', exact: true }).click();
async function progress(page: Page, position: number, total: number) {
  await expect(root(page).getByRole('progressbar')).toHaveAttribute(
    'aria-label',
    `Question ${position} of ${total}`,
  );
}
async function begin(page: Page, service: string) {
  await page.goto(`/enquiry/?service=${service}`);
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
}
async function review(page: Page) {
  await expect(
    root(page).getByRole('heading', { name: 'Your contact details', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  await expect(
    root(page).getByRole('heading', { name: 'Review your requirements', exact: true }),
  ).toBeVisible();
}
async function pdf(page: Page, filename: string) {
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  await expect(
    root(page).getByRole('heading', { name: 'Your project enquiry PDF is ready', exact: true }),
  ).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  expect((await downloading).suggestedFilename()).toBe(filename);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  await page.route('https://api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, body: '{"success":true}' }),
  );
});

test('website Stage 1 has five questions, two goals and preserved answers when moving backwards', async ({
  page,
}) => {
  await begin(page, 'websites');
  await progress(page, 1, 5);
  await page.getByLabel('Complete redesign and rebuild', { exact: true }).check();
  await next(page);
  await expect(root(page).getByRole('heading')).toHaveText(
    'What should the website help the business achieve?',
  );
  await page.getByLabel('Generate enquiries', { exact: true }).check();
  await page.getByLabel('Explain services', { exact: true }).check();
  await page.getByLabel('Sell products', { exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('no more than 2');
  await expect(page.getByLabel('Sell products', { exact: true })).not.toBeChecked();
  await next(page);
  await progress(page, 3, 5);
  await expect(root(page).getByRole('heading')).toHaveText('Which important features are needed?');
  await page.getByLabel('Forms', { exact: true }).check();
  await back(page);
  await expect(page.getByLabel('Generate enquiries', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Explain services', { exact: true })).toBeChecked();
  await back(page);
  await expect(page.getByLabel('Complete redesign and rebuild', { exact: true })).toBeChecked();
  await next(page);
  await next(page);
  await expect(page.getByLabel('Forms', { exact: true })).toBeChecked();
  await next(page);
  await progress(page, 4, 5);
  await expect(root(page).getByRole('heading')).toHaveText('How should we contact you?');
  await page.getByLabel('Email', { exact: true }).check();
  await next(page);
  await progress(page, 5, 5);
  await next(page); // Additional information stays optional.
  await review(page);
  await expect(root(page)).toContainText('Generate enquiries, Explain services');
  await expect(root(page)).toContainText('Forms');
  await expect(root(page)).not.toContainText('How many content pages are expected?');
  await expect(root(page)).not.toContainText('What assets already exist?');
  await pdf(page, 'FinTaxTech-project-enquiry.pdf');
});

test('mobile Stage 1 only asks for Other feature details when selected and preserves text on Back', async ({
  page,
}) => {
  await begin(page, 'mobile-apps');
  await progress(page, 1, 6);
  for (const answer of ['New app', 'Both', 'Customers']) {
    await page.getByLabel(answer, { exact: true }).check();
    await next(page);
  }
  await expect(root(page).getByRole('heading')).toHaveText('What should users be able to do?');
  await page.getByLabel('Other', { exact: true }).check();
  await progress(page, 4, 6); // Total is recalculated as the next question is shown.
  await next(page);
  await progress(page, 5, 8);
  await expect(root(page).getByRole('heading')).toHaveText('Feature name');
  await next(page);
  await expect(page.getByRole('alert')).not.toBeEmpty();
  await page.getByRole('textbox', { name: 'Feature name', exact: true }).fill('Visit planner');
  await next(page);
  await page
    .getByRole('textbox', { name: 'Short feature description', exact: true })
    .fill('Customers can organise upcoming visits.');
  await back(page);
  await expect(page.getByRole('textbox', { name: 'Feature name', exact: true })).toHaveValue(
    'Visit planner',
  );
  await next(page);
  await expect(
    page.getByRole('textbox', { name: 'Short feature description', exact: true }),
  ).toHaveValue('Customers can organise upcoming visits.');
  await next(page);
  await progress(page, 7, 8);
  await page.getByLabel('WhatsApp', { exact: true }).check();
  await next(page);
  await progress(page, 8, 8);
  await next(page);
  await review(page);
  await expect(root(page).locator('.review-row').filter({ hasText: 'Feature name' })).toContainText(
    'Visit planner',
  );
  await expect(
    root(page).locator('.review-row').filter({ hasText: 'Short feature description' }),
  ).toContainText('Customers can organise upcoming visits.');
  // Revisit the unchanged feature selection through review; details remain intact.
  await page
    .getByRole('button', { name: 'Edit: What should users be able to do?', exact: true })
    .click();
  await expect(page.getByLabel('Other', { exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
  await expect(root(page)).toContainText('Visit planner');
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  expect((await downloading).suggestedFilename()).toBe('FinTaxTech-project-enquiry.pdf');
});

test('mobile Not sure hides and removes custom-feature answers from review and PDF generation', async ({
  page,
}) => {
  await begin(page, 'mobile-apps');
  for (const answer of ['New app', 'Not sure', 'Customers']) {
    await page.getByLabel(answer, { exact: true }).check();
    await next(page);
  }
  await page.getByLabel('Other', { exact: true }).check();
  await next(page);
  await page.getByRole('textbox').fill('Old custom feature');
  await next(page);
  await page.getByRole('textbox').fill('Old private explanation');
  await back(page);
  await back(page);
  await page.getByLabel('Not sure', { exact: true }).check();
  await expect(page.getByLabel('Other', { exact: true })).not.toBeChecked();
  await next(page);
  await progress(page, 5, 6);
  await expect(root(page).getByRole('heading')).toHaveText('How should we contact you?');
  await page.getByLabel('Email', { exact: true }).check();
  await next(page);
  await next(page);
  await review(page);
  await expect(root(page)).not.toContainText('Old custom feature');
  await expect(root(page)).not.toContainText('Old private explanation');
  await expect(
    root(page).getByRole('button', { name: 'Edit: Feature name', exact: true }),
  ).toHaveCount(0);
  await pdf(page, 'FinTaxTech-project-enquiry.pdf');
});

test('AI Stage 1 keeps five topics and two outcomes across kinds, with the existing project Other detail', async ({
  page,
}) => {
  await begin(page, 'ai-automation');
  await progress(page, 1, 5);
  await page.getByLabel('Other', { exact: true }).check();
  await next(page);
  await progress(page, 2, 6);
  await page
    .getByRole('textbox', { name: 'What else would you like to automate?', exact: true })
    .fill('Document sorting');
  await next(page);
  await expect(root(page).getByRole('heading')).toHaveText('What result are you hoping for?');
  await page.getByLabel('Save staff time', { exact: true }).check();
  await page.getByLabel('Reduce mistakes', { exact: true }).check();
  await page.getByLabel('Prepare content', { exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('no more than 2');
  await expect(page.getByLabel('Prepare content', { exact: true })).not.toBeChecked();
  await page.getByLabel('Other', { exact: true }).click(); // Limit still applies to Other.
  await expect(page.getByLabel('Other', { exact: true })).not.toBeChecked();
  await page.getByLabel('Reduce mistakes', { exact: true }).uncheck();
  await page.getByLabel('Other', { exact: true }).check();
  await next(page);
  await progress(page, 4, 6);
  await expect(root(page).getByRole('heading')).toHaveText(
    'Does the process involve sensitive information?',
  );
  await back(page);
  await expect(page.getByLabel('Save staff time', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Other', { exact: true })).toBeChecked();
  await next(page);
  await expect(root(page).getByRole('heading')).toHaveText(
    'Does the process involve sensitive information?',
  );
  await page.getByLabel('Not sure', { exact: true }).check();
  await next(page);
  await page.getByLabel('Email', { exact: true }).check();
  await next(page);
  await page.getByRole('textbox').fill('Make handovers easier');
  await next(page);
  await review(page);
  await expect(root(page)).toContainText('Document sorting');
  await expect(root(page)).toContainText('Make handovers easier');
  await expect(root(page)).not.toContainText('What should trigger the workflow?');
  await expect(root(page)).not.toContainText('What type of content is involved?');
  await page
    .getByRole('button', { name: 'Edit: What would you like to automate?', exact: true })
    .click();
  await page.getByLabel('Content or document processing', { exact: true }).check();
  await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
  await expect(root(page)).not.toContainText('Document sorting');
  await expect(root(page)).toContainText('Make handovers easier');
  await expect(root(page)).toContainText('Save staff time, Other');
  await pdf(page, 'FinTaxTech-ai-automation-enquiry.pdf');
});
