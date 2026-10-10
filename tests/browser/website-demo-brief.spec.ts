import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { websiteDemoBriefSections as sections } from '../../src/content/website-demo-brief';
import { completeWebsiteDemoBrief } from '../fixtures/website-demo-brief';
import { mockWebsiteDelivery } from './website-delivery-helper';

const route = '/client/website-demo-brief/';
const secret = 'LOCAL-DEMO-DETAIL-9361';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
  await mockWebsiteDelivery(page);
  await page.goto(route);
});
async function next(page: Page) {
  await page.getByRole('button', { name: 'Next', exact: true }).click();
}
async function fillSection(page: Page, position: number) {
  const state = completeWebsiteDemoBrief();
  for (const field of sections[position].fields) {
    const wrap = page.locator(`#field-${field.id}`);
    if (!(await wrap.count())) continue;
    if (field.type === 'rows') {
      for (const row of state.rows[field.id] ?? []) {
        await wrap.getByRole('button', { name: field.repeat!.add, exact: true }).click();
        for (const part of field.repeat!.fields.filter((part) => !part.when))
          await wrap.getByLabel(part.label, { exact: true }).last().fill(row.values[part.key]);
      }
    } else if (field.type === 'single' || field.type === 'multi') {
      const answer = state.answers[field.id];
      for (const value of Array.isArray(answer) ? answer : [String(answer)])
        await wrap.getByLabel(value, { exact: true }).click();
    } else if (typeof state.answers[field.id] === 'string') {
      await page.locator(`#${field.id}`).fill(String(state.answers[field.id]));
    }
  }
}

test('demo route, required references, row limits and keyboard controls work on mobile', async ({
  page,
  request,
}, info) => {
  expect((await request.get(route)).status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Free Website Demo Brief');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://fintaxtech.co.uk${route}`,
  );
  await expect(page.locator('.lead')).toContainText('does not include a full production website');
  for (const path of ['/sitemap.xml', '/rss.xml', '/', '/start/'])
    expect(await (await request.get(path)).text()).not.toContain(route);
  await page.getByRole('button', { name: 'Begin demo brief' }).click();
  await next(page);
  await expect(page.locator('#trading')).toBeFocused();
  await fillSection(page, 0);
  await next(page);
  await fillSection(page, 1);
  await page.locator('#field-goals').getByLabel('Other', { exact: true }).focus();
  await page.keyboard.press('Space');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.locator('#goalsOther').fill('HIDDEN-DEMO-GOAL');
  await page.locator('#field-goals').getByLabel('Enquiries', { exact: true }).click();
  await expect(page.locator('#goalsOther')).toHaveCount(0);
  await next(page);
  await expect(page.locator('[data-brief-form] h2')).toBeFocused();
  await page.getByLabel('Request a quote', { exact: true }).click();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('at least one');
  const references = page.locator('#field-referenceWebsites');
  await references.getByRole('button', { name: 'Add reference website', exact: true }).click();
  await expect(page.getByLabel('Reference website URL', { exact: true })).toBeFocused();
  await page.getByLabel('Reference website URL', { exact: true }).fill('reference.example');
  await page.keyboard.press('Tab');
  await expect(
    page.getByLabel('What do you like about this website?', { exact: true }),
  ).toBeFocused();
  await page
    .getByLabel('What do you like about this website?', { exact: true })
    .fill('Readable typography');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('http:// or https://');
  await page.getByLabel('Reference website URL', { exact: true }).fill('https://reference.example');
  await page.getByLabel('What do you like about this website?', { exact: true }).fill('');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page
    .getByLabel('What do you like about this website?', { exact: true })
    .fill('Readable typography');
  for (let i = 1; i < 3; i++) {
    await references.getByRole('button', { name: 'Add reference website', exact: true }).click();
    await page
      .getByLabel('Reference website URL', { exact: true })
      .nth(i)
      .fill(`https://reference.example/${i}`);
    await page
      .getByLabel('What do you like about this website?', { exact: true })
      .nth(i)
      .fill('Calm colours and clear navigation');
  }
  await expect(
    page.getByRole('button', { name: 'Add reference website', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Remove reference website 3', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Add reference website', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Add reference website', exact: true }),
  ).toBeEnabled();
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath('demo-references-mobile-light.png'),
    fullPage: true,
  });
  await page.locator('#theme-toggle').click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath('demo-references-mobile-dark.png'),
    fullPage: true,
  });
  await expect(page.locator('input[type=file], input[type=password]')).toHaveCount(0);
  await page.getByLabel('Request a quote', { exact: true }).click();
  await next(page);
  await page.locator('#field-assets').getByLabel('None', { exact: true }).click();
  await page
    .locator('#field-provisionalAssets')
    .getByLabel('Please ask me first', { exact: true })
    .click();
  await next(page);
  await page.locator('#approverName').fill('Jamie');
  await page.locator('#success').fill('Clear visitor action');
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).not.toContainText('HIDDEN-DEMO-GOAL');
});

test('all demo answers reach review, Slack and local PDF, remain editable and clear on refresh', async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`),
  );
  await page.getByRole('button', { name: 'Begin demo brief' }).click();
  for (let i = 0; i < sections.length; i++) {
    await fillSection(page, i);
    if (i === 0) await page.locator('#trading').fill(secret);
    if (i < sections.length - 1) await next(page);
  }
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  expect(requests.join('\n')).not.toContain(secret);
  expect(requests.join('\n')).not.toContain('reference.example');
  const state = completeWebsiteDemoBrief();
  for (const [id, value] of Object.entries(state.answers)) {
    if (id === 'prioritySource') continue; // Supplied services replace this internal choice.
    const displayed =
      id === 'provisionalAssets'
        ? 'Provisional styling permitted; placeholder imagery not permitted.'
        : value;
    for (const part of Array.isArray(displayed) ? displayed : [String(displayed)])
      await expect(page.locator('.brief-review')).toContainText(id === 'trading' ? secret : part);
  }
  await expect(page.locator('.brief-review')).not.toContainText('I will list up to three');
  await expect(page.locator('.brief-review')).not.toContainText('Provisional styling only');
  await expect(page.locator('.brief-review')).toContainText('Priority services / products');
  await expect(page.locator('.brief-review')).toContainText(
    '1. Garden planning and design consultations',
  );
  await expect(page.locator('.brief-review')).not.toContainText(
    'Service or product and short description',
  );
  await expect(page.locator('.brief-review')).toContainText('https://reference.example/gardens');
  await expect(page.locator('.brief-review')).toContainText('spacious layout, green colours');
  await page.screenshot({ path: info.outputPath('demo-review-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#theme-toggle').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await downloading;
  expect(pdf.suggestedFilename()).toBe('FinTaxTech-free-website-demo-brief.pdf');
  await pdf.saveAs(info.outputPath('demo.pdf'));
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech through Slack');
  await expect(page.getByRole('status')).toContainText('PDF download has been requested');
  await expect(page.getByRole('link', { name: 'Open email', exact: true })).toHaveAttribute(
    'href',
    'mailto:ask@fintaxtech.co.uk',
  );
  await expect(page.getByRole('link', { name: 'Open WhatsApp', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\/wa.me\/\d+$/,
  );
  await page
    .getByRole('button', { name: 'Edit answers: References and design direction', exact: true })
    .click();
  await expect(page.getByLabel('Reference website URL', { exact: true })).toHaveValue(
    'https://reference.example/gardens',
  );
  await expect(
    page.getByLabel('What do you like about this website?', { exact: true }),
  ).toHaveValue(state.rows.referenceWebsites[0].values.explanation);
  const submissions = requests.filter((request) =>
    request.startsWith('POST http://localhost:4323/api/website-brief/ '),
  );
  expect(submissions).toHaveLength(1);
  expect(submissions[0]).toContain(secret);
  expect(submissions[0]).toContain('reference.example');
  expect(
    requests.every(
      (request) =>
        request.startsWith('GET http://localhost:4323/') ||
        request.startsWith('GET blob:http://localhost:4323/') ||
        request.startsWith('POST http://localhost:4323/api/website-brief/'),
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
  await page.getByRole('button', { name: 'Begin demo brief' }).click();
  await expect(page.locator('#trading')).toHaveValue('');
});

test('long pasted service areas are retained, visibly validated and reach review, PDF and Slack intact', async ({
  page,
}, info) => {
  const delivery = await mockWebsiteDelivery(page);
  await page.getByRole('button', { name: 'Begin demo brief' }).click();
  await fillSection(page, 0);
  const input = page.locator('#serviceArea');
  await expect(input).not.toHaveAttribute('maxlength');
  await input.fill('');
  await input.focus();
  const oversized = 'Richmond, Twickenham, '.repeat(100) + 'END OF PASTE';
  await page.keyboard.insertText(oversized);
  await expect(input).toHaveValue(oversized);
  await expect(page.locator('#limit-serviceArea')).toContainText('2000');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('2000');
  await expect(input).toHaveValue(oversized);
  const towns = 'Richmond, Twickenham\n'.repeat(25) + 'LAST TOWN';
  const postcodes = 'TW1, TW2, TW3, TW20\n'.repeat(20) + 'LAST POSTCODE';
  await input.fill(towns);
  await page.locator('#postcodeAreas').fill(postcodes);
  await next(page);
  for (let i = 1; i < sections.length; i++) {
    await fillSection(page, i);
    if (i < sections.length - 1) await next(page);
  }
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  const reviewed = page.locator('.brief-review');
  await expect(reviewed.getByText(towns, { exact: true })).toBeVisible();
  await expect(reviewed.getByText(postcodes, { exact: true })).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  await (await downloading).saveAs(info.outputPath('long-service-areas.pdf'));
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech');
  expect(delivery.submissions[0].answers).toMatchObject({
    serviceArea: towns,
    postcodeAreas: postcodes,
  });
  expect(delivery.messages[0].text).toContain(towns.replaceAll('\n', '\n  '));
  expect(delivery.messages[0].text).toContain(postcodes.replaceAll('\n', '\n  '));
});

test('website sourcing, booking, pricing and explicit permissions validate conditionally on mobile', async ({
  page,
}, info) => {
  const delivery = await mockWebsiteDelivery(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Begin demo brief' }).click();
  await fillSection(page, 0);
  await page.getByLabel('Help me choose from my existing website', { exact: true }).click();
  await page.locator('#existingURL').fill('');
  await next(page);
  await expect(page.locator('#existingURL')).toBeFocused();
  await expect(page.locator('#existingURL')).toHaveAttribute('required', '');
  await page.locator('#existingURL').fill('https://client.example');
  await next(page);
  await expect(page.locator('#field-priorityOfferings')).toHaveCount(0);
  await page.locator('#field-primaryCustomers').getByLabel('Other', { exact: true }).click();
  await page
    .locator('#customerProblem')
    .fill('Reliable repairs without uncertain call-out charges.');
  await page.locator('#field-goals').getByLabel('Bookings', { exact: true }).click();
  await page.locator('#field-action').getByLabel('Enquire', { exact: true }).click();
  await next(page);
  await expect(page.getByRole('alert')).toHaveCount(2);
  await page.locator('#primaryCustomersOther').fill('Property managers');
  await page.getByLabel('Link to an existing booking service', { exact: true }).click();
  await next(page);
  await expect(page.locator('#bookingURL')).toBeFocused();
  await page.locator('#bookingURL').fill('https://booking.example/HIDDEN-BOOKING');
  await page.getByLabel('Appointment enquiry / request', { exact: true }).click();
  await expect(page.locator('#bookingURL')).toHaveCount(0);
  await next(page);
  await page.getByRole('button', { name: 'Add reference website', exact: true }).click();
  await page.getByLabel('Reference website URL', { exact: true }).fill('https://reference.example');
  await page.getByLabel('What do you like about this website?', { exact: true }).fill('Pricing');
  await page.getByLabel('Request a quote', { exact: true }).click();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Another reason', { exact: true }).click();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Other pricing preference', { exact: true }).fill('HIDDEN-PRICING-REASON');
  await page.getByLabel('Visible prices', { exact: true }).click();
  await expect(page.getByLabel('Other pricing preference', { exact: true })).toHaveCount(0);
  await page.getByLabel('I have approved prices to supply', { exact: true }).click();
  await page.locator('#approvedPrices').fill('HIDDEN-APPROVED-PRICES');
  await page.getByLabel('Request a quote', { exact: true }).click();
  await expect(page.locator('#approvedPrices')).toHaveCount(0);
  await next(page);
  await page.locator('#field-assets').getByLabel('Photos', { exact: true }).click();
  await page.locator('#field-assets').getByLabel('None', { exact: true }).click();
  await expect(page.getByLabel('Photos', { exact: true })).not.toBeChecked();
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Complete');
  await page.getByLabel('Please ask me first', { exact: true }).focus();
  await page.keyboard.press('Space');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath('explicit-permissions-mobile.png'),
    fullPage: true,
  });
  await next(page);
  await page.locator('#approverName').fill('Demo Approver');
  await page.locator('#success').fill('Pricing'); // Short answers stay allowed; examples guide the client.
  await page.getByRole('button', { name: 'Review brief', exact: true }).click();
  await expect(page.locator('.brief-review')).not.toContainText('HIDDEN-');
  await expect(page.locator('.brief-review')).toContainText('Visible prices');
  expect(delivery.submissions).toHaveLength(0);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  await (await downloading).saveAs(info.outputPath('conditional-demo.pdf'));
  await expect(page.getByRole('status')).toContainText('delivered to FinTaxTech');
  const message = delivery.messages[0].text;
  expect(message).not.toContain('HIDDEN-');
  expect(message).toContain('What appeals to you about the pricing?');
  expect(message).toContain('Visible prices');
  expect(message).toContain('Customer need:');
  expect(message).toContain('Primary customers:');
  const permitted = message.split('Provisional choices permitted:')[1];
  expect(permitted).toContain('Service suggestions from the supplied website');
  expect(permitted).not.toContain('Provisional styling');
  expect(permitted).not.toContain('Placeholder imagery');
  expect(message).not.toContain('Confirm from the agreed proposal');
  expect(message).not.toContain('Not provided');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
