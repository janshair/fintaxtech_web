import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { barberDemo } from '../../src/content/barber-demo';
import { toTemplateBriefData } from '../../src/lib/client-brief/template-brief';
import {
  barberAnswers as a,
  barberHours,
  barberReview,
  barberServices,
  completeTemplateBrief,
} from '../fixtures/template-brief';
import { mockWebsiteDelivery } from './website-delivery-helper';

const route = '/client/website-brief/templates/';
// Entered values that must never leave the page except in the deliberate Slack submission.
const secrets = ['Jay', 'Kirkcaldy', '01592', 'jayscuts', 'Sam T', 'Clipper fade', '1F3A5F'];

// One driver, two input methods: pointer (fill/click) or keyboard only (Tab, arrows, Space, Enter).
function driver(page: Page, keyboard: boolean, tabKey: string) {
  // Tab enters a radio group once, so a group is reached by its name.
  async function tabTo(target: Locator, group?: string) {
    for (let i = 0; i < 300; i++) {
      const reached = group
        ? await page.evaluate(
            (name) => (document.activeElement as HTMLInputElement).name === name,
            group,
          )
        : await target.evaluate((el) => el === document.activeElement).catch(() => false);
      if (reached) return;
      await page.keyboard.press(tabKey);
    }
    throw new Error('Could not reach the control with the keyboard');
  }
  return {
    async text(target: Locator, value: string) {
      if (!keyboard) return target.fill(value);
      await tabTo(target);
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.insertText(value);
    },
    async choose(target: Locator) {
      if (!keyboard) return target.check();
      await tabTo(target, (await target.getAttribute('name'))!);
      for (let i = 0; i < 12 && !(await target.isChecked()); i++) {
        const focused = await target.evaluate((el) => el === document.activeElement);
        await page.keyboard.press(focused ? 'Space' : 'ArrowDown');
      }
      await expect(target).toBeChecked();
    },
    async check(target: Locator) {
      if (!keyboard) return target.check();
      await tabTo(target);
      await page.keyboard.press('Space');
      await expect(target).toBeChecked();
    },
    async press(target: Locator) {
      if (!keyboard) return target.click();
      await tabTo(target);
      await page.keyboard.press('Enter');
    },
  };
}

async function completeBrief(page: Page, keyboard: boolean, tabKey: string) {
  const d = driver(page, keyboard, tabKey);
  const field = (id: string) => page.locator(`#field-${id}`);
  const option = (id: string, label: string) => field(id).getByLabel(label, { exact: true });
  const next = async () => {
    await d.press(page.getByRole('button', { name: /^(Next|Review brief)$/ }));
  };
  const own = (id: string) => d.choose(option(id, 'I’ll enter my own'));
  const sample = (id: string) => d.choose(option(id, 'Use the template’s sample for now'));
  const noOverflow = async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  async function rows(
    id: string,
    add: string,
    values: Record<string, string>[],
    radios = ['status', 'stars'],
  ) {
    for (const row of values) {
      await d.press(field(id).getByRole('button', { name: add, exact: true }));
      const item = field(id).locator('.brief-row').last();
      for (const [key, value] of Object.entries(row)) {
        const input = item.locator(`input[id$="-${key}"], textarea[id$="-${key}"]`);
        if (radios.includes(key)) await d.choose(item.getByLabel(value, { exact: true }));
        else await d.text(input, value);
      }
    }
  }

  await d.choose(page.getByRole('radio', { name: 'The Brass Standard' }));
  await expect(page.getByRole('radio', { name: 'The Fold Atelier (Coming soon)' })).toBeDisabled();
  await noOverflow();
  await next();

  await expect(page.getByRole('heading', { name: 'Your business' })).toBeFocused();
  await d.text(page.locator('#businessName'), a.businessName);
  await d.text(page.locator('#businessArea'), a.businessArea);
  await own('heroSource');
  await d.text(page.locator('#heroLine'), a.heroLine);
  await sample('introSource');
  await next();

  await own('barberServicesSource');
  await rows('barberServices', 'Add a service', barberServices);
  await d.choose(option('barberBooking', 'Online booking link'));
  await noOverflow();
  await next();

  await d.choose(option('barberRitualSource', 'Keep the template’s steps'));
  await own('barberLookbookSource');
  await rows('barberLookbook', 'Add a style', [{ label: 'Skin fade' }, { label: 'Crop' }]);
  await next();

  await d.text(page.locator('#contactPhone'), a.phone);
  await d.choose(option('whatsapp', 'Same as my phone number'));
  await d.text(page.locator('#contactEmail'), a.email);
  await d.choose(option('addressChoice', 'Show my address'));
  await d.text(page.locator('#address'), a.address);
  await next();

  await own('hoursSource');
  await rows('hours', 'Add a line', barberHours);
  await noOverflow();
  await next();

  await d.text(page.locator('#instagram'), a.instagram);
  await d.text(page.locator('#bookingLink'), a.booking);
  await d.choose(option('googleProfile', 'I need one'));
  await next();

  await d.choose(option('colours', 'Choose my own colours'));
  await expect(page.locator('#brandColour-picker')).toHaveAttribute('type', 'color');
  await d.text(page.locator('#brandColour'), a.brand);
  await expect(page.locator('#brandColour-picker')).toHaveValue(a.brand.toLowerCase());
  await d.text(page.locator('#accentColour'), a.accent);
  await d.choose(option('logo', 'Use my monogram for now'));
  await noOverflow();
  await next();

  await d.choose(option('hasReviews', 'Yes, I have real reviews to add'));
  await rows('reviews', 'Add a review', [barberReview]);
  await d.check(page.getByLabel('I have permission to use these reviews on my website.'));
  await d.choose(option('hasQualifications', 'No — leave this out'));
  await next();

  await d.check(option('files', 'Logo'));
  await d.check(option('files', 'Gallery / work photos (up to 6)'));
  await next();

  await d.check(page.getByLabel('These details are accurate and I approve them for my website.'));
  await next();
  await expect(page.getByRole('heading', { name: 'Review your template brief' })).toBeFocused();
  await noOverflow();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
});

for (const keyboard of [false, true]) {
  test(`choose barber-01, complete the brief ${keyboard ? 'with the keyboard only' : 'at 390px'} and download the .txt`, async ({
    page,
    request,
  }, info) => {
    test.setTimeout(120_000);
    if (!keyboard) await page.setViewportSize({ width: 390, height: 844 });
    const tabKey = info.project.name === 'webkit' ? 'Alt+Tab' : 'Tab';
    const errors: string[] = [];
    const leaks: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('request', (outgoing) => {
      if (outgoing.url().includes('/api/website-brief/')) return;
      const sent = decodeURIComponent(outgoing.url()) + (outgoing.postData() ?? '');
      for (const secret of secrets) if (sent.includes(secret)) leaks.push(outgoing.url());
    });
    const { messages, submissions } = await mockWebsiteDelivery(page);
    await page.goto(route);
    await expect(page.locator('h1')).toHaveText('Template Website Brief');
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://fintaxtech.co.uk${route}`,
    );
    await expect(page.locator('.notice').first()).toContainText(
      'Refreshing or closing clears your local answers',
    );
    for (const path of ['/sitemap.xml', '/'])
      expect(await (await request.get(path)).text()).not.toContain(route);
    await driver(page, keyboard, tabKey).press(
      page.getByRole('button', { name: 'Begin template brief' }),
    );
    if (!keyboard) {
      const axe = await new AxeBuilder({ page }).include('.client-brief').analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
    }
    await completeBrief(page, keyboard, tabKey);
    const review = page.locator('.brief-review');
    await expect(review).toContainText(a.businessName);
    await expect(review).toContainText('Use the template’s sample for now');
    await expect(review).not.toContainText('L-TEST');

    const download = page.waitForEvent('download');
    await driver(page, keyboard, tabKey).press(page.getByRole('button', { name: 'Download .txt' }));
    const file = await download;
    expect(file.suggestedFilename()).toBe(
      'FinTaxTech-template-brief-barber-01-jay-s-cuts-and-co.txt',
    );
    const text = await readFile((await file.path())!, 'utf8');
    await readFile((await file.path())!).then((bytes) => expect(bytes.includes(13)).toBe(false));
    expect(text.split('\n').slice(0, 4)).toEqual([
      'FINTAXTECH TEMPLATE BRIEF',
      'Template: barber-01 (The Brass Standard)',
      "Business: Jay's Cuts & Co · Kirkcaldy",
      'Reference: none',
    ]);
    expect(text).toContain('== Files to send ==\n[ ] Logo\n[ ] Gallery / work photos (up to 6)\n');
    const json = text
      .split('BEGIN TEMPLATE DATA (do not edit below this line)\n')[1]
      .split('\nEND TEMPLATE DATA')[0];
    const expected = completeTemplateBrief();
    delete expected.answers.ref;
    expect(JSON.parse(json)).toEqual(toTemplateBriefData(expected));
    if (!keyboard && info.project.name === 'chromium')
      await page.screenshot({ path: info.outputPath('review.png'), fullPage: true });
    if (!keyboard && info.project.name === 'chromium')
      await writeFile(info.outputPath('template-brief.txt'), text);

    await expect(page.locator('.brief-status')).toContainText('Reviewed answers delivered');
    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toMatchObject({ kind: 'template' });
    const slack = messages.map((message) => message.text).join('\n');
    expect(slack).toContain('BEGIN TEMPLATE DATA');
    expect(slack).toContain("Business: Jay's Cuts &amp; Co · Kirkcaldy");
    expect(leaks).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('the barber demo’s final link opens the brief pre-filled; reloading clears answers', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    '/templates/website/motion/barber-01/?name=Jay%27s%20Cuts%20%26%20Co&area=Kirkcaldy&phone=07526%20699217&ref=L-TEST',
  );
  await page.evaluate(() =>
    document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close()),
  );
  await page.locator('[data-service]').first().click();
  await page.getByRole('button', { name: 'See the next step' }).click();
  await page.getByRole('button', { name: barberDemo.continueBooking }).click();
  await page
    .getByRole('link', { name: "Want this for Jay's Cuts & Co? Talk to FinTaxTech" })
    .click();
  await expect(page).toHaveURL(/\/client\/website-brief\/templates\/barber-01\/\?/);
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await expect(page.getByRole('radio', { name: 'The Brass Standard' })).toBeChecked();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#businessName')).toHaveValue("Jay's Cuts & Co");
  await expect(page.locator('#businessArea')).toHaveValue('Kirkcaldy');
  await page.locator('#field-heroSource').getByLabel('Use the template’s sample for now').check();
  await page.locator('#field-introSource').getByLabel('Use the template’s sample for now').check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page
    .locator('#field-barberServicesSource')
    .getByLabel('Use the template’s sample for now')
    .check();
  await page.getByLabel('Call to book', { exact: true }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Keep the template’s steps', { exact: true }).check();
  await page
    .locator('#field-barberLookbookSource')
    .getByLabel('Use the template’s sample for now')
    .check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#contactPhone')).toHaveValue('07526 699217');

  // Typed answers live only in page memory: reloading keeps the link's values and clears the rest.
  await page.locator('#contactEmail').fill('hello@jayscuts.example');
  await page.reload();
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await expect(page.getByRole('radio', { name: 'The Brass Standard' })).toBeChecked();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#field-heroSource input:checked')).toHaveCount(0);
  await expect(page.locator('#businessName')).toHaveValue("Jay's Cuts & Co");
  expect(await page.evaluate(() => [Object.keys(sessionStorage), document.cookie])).toEqual([
    [],
    '',
  ]);
  expect(errors).toEqual([]);
});

test('picker and step screenshots', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'One set of review screenshots.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await page.screenshot({ path: info.outputPath('picker.png'), fullPage: true });
  await page.getByRole('radio', { name: 'The Brass Standard' }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('#businessName').fill("Jay's Cuts & Co");
  await page.locator('#businessArea').fill('Kirkcaldy');
  for (const id of ['heroSource', 'introSource'])
    await page.locator(`#field-${id}`).getByLabel('Use the template’s sample for now').check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('#field-barberServicesSource').getByLabel('I’ll enter my own').check();
  await page.getByRole('button', { name: 'Add a service' }).click();
  const row = page.locator('.brief-row').last();
  await row.getByLabel('Service name').fill(barberServices[0].name);
  await row.getByLabel('Short description').fill(barberServices[0].description);
  await row.getByLabel('Duration, like 40 min').fill(barberServices[0].duration);
  await row.getByLabel('Price, like £30 or From £30').fill('30');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#error-barberServices')).toBeVisible();
  await page.screenshot({ path: info.outputPath('barber-step.png'), fullPage: true });
});
