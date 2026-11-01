import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { allTemplates } from '../../src/content/templates';
import { templateBriefSections } from '../../src/content/template-brief';
import { createBriefRules, isVisible } from '../../src/lib/client-brief/rules';
import { hourStatuses, weekDays } from '../../src/lib/client-brief/formats';
import { toTemplateBriefData } from '../../src/lib/client-brief/template-brief';
import { completeTemplateBrief, templateIds } from '../fixtures/template-brief';
import { mockWebsiteDelivery } from './website-delivery-helper';
import type { BriefField, BriefState } from '../../src/lib/client-brief/types';

const route = '/client/website-brief/templates/';
const rules = createBriefRules(templateBriefSections);
const demoQuery = 'name=Jay%27s%20Cuts%20%26%20Co&area=Kirkcaldy&phone=07526%20699217&ref=L-TEST';
// 24-hour time inputs, as a UK customer sees them.
test.use({ locale: 'en-GB', timezoneId: 'Europe/London' });

// One driver, two input methods: pointer (fill/click) or keyboard only (Tab, arrows, Space, Enter).
function driver(page: Page, keyboard: boolean, tabKey: string) {
  // Tab enters a radio group once, so a group is reached by its name.
  async function tabTo(target: Locator, group?: string) {
    for (let i = 0; i < 400; i++) {
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
    async time(target: Locator, value: string) {
      if (!keyboard) return target.fill(value);
      await tabTo(target);
      // WebKit moves from hours to minutes on ":"; Chromium and Firefox move after two digits.
      await page.keyboard.type(tabKey === 'Alt+Tab' ? value : value.replace(':', ''));
      await expect(target).toHaveValue(value);
    },
    async choose(target: Locator) {
      if (!keyboard) return target.check();
      await tabTo(target, (await target.getAttribute('name'))!);
      for (let i = 0; i < 20 && !(await target.isChecked()); i++) {
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
type Driver = ReturnType<typeof driver>;
const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

async function fillHours(page: Page, d: Driver, days: Record<string, string>[]) {
  async function setDay(index: number, day: Record<string, string>) {
    const id = `hours-${weekDays[index].toLowerCase()}`;
    await d.choose(page.locator(`#${id}-status-${hourStatuses.indexOf(day.status as never)}`));
    if (day.status === 'Open') {
      await d.time(page.locator(`#${id}-opens`), day.opens);
      await d.time(page.locator(`#${id}-closes`), day.closes);
    }
    if (day.note) await d.text(page.locator(`#${id}-note`), day.note);
  }
  // Monday, then "Copy Monday to Tuesday–Friday", then only the days that differ.
  await setDay(0, days[0]);
  await d.press(page.locator('#hours-copy-weekdays'));
  for (let index = 1; index < 7; index++) {
    const copied = index <= 4 ? days[0] : {};
    if (JSON.stringify(days[index]) !== JSON.stringify(copied)) await setDay(index, days[index]);
  }
}

// Fills one visible field from the fixture, the way a customer would.
async function fillField(page: Page, d: Driver, field: BriefField, state: BriefState) {
  const wrap = page.locator(`#field-${field.id}`);
  const answer = state.answers[field.id];
  if (field.id === 'templateChoice')
    return d.choose(page.getByRole('radio', { name: String(answer), exact: true }));
  if (field.type === 'hours')
    return fillHours(
      page,
      d,
      state.rows.hours.map((row) => row.values),
    );
  if (field.type === 'single') return d.choose(wrap.getByLabel(String(answer), { exact: true }));
  if (field.type === 'multi') {
    for (const value of answer as string[]) await d.check(wrap.getByLabel(value, { exact: true }));
    if ((answer as string[]).includes('Other'))
      await d.text(page.locator(`#${field.id}Other`), String(state.answers[`${field.id}Other`]));
    return;
  }
  if (field.type === 'confirm') return d.check(page.locator(`#${field.id}`));
  if (field.type === 'rows') {
    for (const row of state.rows[field.id] ?? []) {
      await d.press(wrap.getByRole('button', { name: field.repeat!.add, exact: true }));
      const item = wrap.locator('.brief-row').last();
      for (const part of field.repeat!.fields) {
        const value = row.values[part.key];
        if (value === undefined || !isVisible(part, row.values)) continue;
        if (part.type === 'single') await d.choose(item.getByLabel(value, { exact: true }));
        else
          await d.text(
            item.locator(`input[id$="-${part.key}"], textarea[id$="-${part.key}"]`),
            value,
          );
      }
    }
    return;
  }
  if (typeof answer === 'string') await d.text(page.locator(`#${field.id}`), answer);
}

async function completeBrief(page: Page, d: Driver, state: BriefState) {
  const sections = rules.visibleSections(state.answers);
  for (const [index, section] of sections.entries()) {
    await expect(page.getByRole('heading', { level: 2, name: section.title })).toBeFocused();
    for (const field of section.fields)
      if (isVisible(field, state.answers) && field.type !== 'hidden')
        await fillField(page, d, field, state);
    await noOverflow(page);
    const last = index === sections.length - 1;
    await d.press(page.getByRole('button', { name: last ? 'Review brief' : 'Next', exact: true }));
  }
  await expect(page.getByRole('heading', { name: 'Review your template brief' })).toBeFocused();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'accepted'));
  page.on('dialog', (dialog) => dialog.accept());
});

const runs = [
  ...templateIds.map((id) => ({ id, keyboard: false })),
  { id: 'barber-01', keyboard: true },
  { id: 'wedding-09', keyboard: true },
];
for (const { id, keyboard } of runs) {
  test(`${id}: complete the brief ${keyboard ? 'with the keyboard only' : 'at 390px'} and download the .txt`, async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    if (!keyboard) await page.setViewportSize({ width: 390, height: 844 });
    const d = driver(page, keyboard, info.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
    const state = completeTemplateBrief(id);
    const errors: string[] = [];
    const leaks: string[] = [];
    // Entered values must never leave the page, except in the deliberate Slack submission.
    const secrets = [
      String(state.answers.businessName),
      String(state.answers.contactEmail),
      '01382 000000',
      '79 Yarrow',
    ];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('request', (outgoing) => {
      if (outgoing.url().includes('/api/website-brief/')) return;
      const sent = decodeURIComponent(outgoing.url()) + (outgoing.postData() ?? '');
      for (const secret of secrets) if (sent.includes(secret)) leaks.push(outgoing.url());
    });
    const { messages, submissions } = await mockWebsiteDelivery(page);
    await page.goto(`${route}?template=${id}`);
    await d.press(page.getByRole('button', { name: 'Begin template brief' }));
    await expect(
      page.getByRole('radio', { name: String(state.answers.templateChoice), exact: true }),
    ).toBeChecked();
    if (!keyboard && id === 'barber-01') {
      const axe = await new AxeBuilder({ page }).include('.client-brief').analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
    }
    await completeBrief(page, d, state);
    await expect(page.locator('.brief-check')).toContainText('exactly as you typed them');
    await expect(page.locator('.brief-review')).toContainText(String(state.answers.businessName));

    const download = page.waitForEvent('download');
    await d.press(page.getByRole('button', { name: 'Download .txt' }));
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      new RegExp(`^FinTaxTech-template-brief-${id}-[a-z0-9-]+\\.txt$`),
    );
    const bytes = await readFile((await file.path())!);
    expect(bytes.includes(13)).toBe(false);
    const text = bytes.toString('utf8');
    expect(text.split('\n').slice(0, 4)).toEqual([
      'FINTAXTECH TEMPLATE BRIEF',
      `Template: ${id} (${allTemplates.find((t) => t.id === id)!.name})`,
      `Business: ${state.answers.businessName} · Dundee`,
      'Reference: none',
    ]);
    const json = text
      .split('BEGIN TEMPLATE DATA (do not edit below this line)\n')[1]
      .split('\nEND TEMPLATE DATA')[0];
    delete state.answers.ref;
    expect(JSON.parse(json)).toEqual(toTemplateBriefData(state));
    if (!keyboard && info.project.name === 'chromium') {
      await writeFile(info.outputPath(`${id}.txt`), text);
      if (id === 'barber-01')
        await page.screenshot({ path: info.outputPath('review.png'), fullPage: true });
    }
    await expect(page.locator('.brief-status')).toContainText('Reviewed answers delivered');
    expect(submissions).toHaveLength(1);
    expect(messages.map((m) => m.text).join('\n')).toContain('BEGIN TEMPLATE DATA');
    expect(leaks).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const template of allTemplates) {
  test(`${template.id}: the demo’s final link opens the brief pre-filled`, async ({ page }) => {
    const extra =
      template.id === 'consultant-07'
        ? '&role=Bookkeeper'
        : template.id === 'wedding-09'
          ? '&type=florist'
          : '';
    await page.goto(`${template.route}?${demoQuery}${extra}`);
    const link = page.locator('[data-brief-link]').first();
    await expect(link).toHaveAttribute(
      'href',
      new RegExp(`^/client/website-brief/templates/\\?template=${template.id}&`),
    );
    const href = (await link.getAttribute('href'))!;
    const query = new URL(href, 'http://localhost').searchParams;
    expect(Object.fromEntries(query)).toMatchObject({
      template: template.id,
      name: "Jay's Cuts & Co",
      area: 'Kirkcaldy',
      ref: 'L-TEST',
      ...(extra.includes('role') ? { role: 'Bookkeeper' } : {}),
      ...(extra.includes('type') ? { type: 'florist' } : {}),
    });
    expect(query.get('phone')?.replace(/\s/g, '')).toBe('07526699217');
    await expect(page.locator('.brief-contact, .booking-contact').first()).toHaveAttribute(
      'href',
      /^(http:\/\/localhost:\d+)?\/contact\/(\?ref=L-TEST)?$/,
    );
    await page.goto(href);
    await page.getByRole('button', { name: 'Begin template brief' }).click();
    await expect(page.getByRole('radio', { name: template.name, exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('#businessName')).toHaveValue("Jay's Cuts & Co");
    await expect(page.locator('#businessArea')).toHaveValue('Kirkcaldy');
  });
}

test('old per-template links redirect to the single route and keep their values', async ({
  page,
}) => {
  for (const id of ['barber-01', 'gym-06']) {
    await page.goto(`${route}${id}/?name=Rose%20%26%20Thistle&ref=L-TEST`);
    await page.waitForURL((url) => url.pathname === route);
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
      template: id,
      name: 'Rose & Thistle',
      ref: 'L-TEST',
    });
    await page.getByRole('button', { name: 'Begin template brief' }).click();
    await expect(
      page.getByRole('radio', { name: allTemplates.find((t) => t.id === id)!.name }),
    ).toBeChecked();
  }
  await page.goto(`${route}?template=nope`);
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await expect(page.locator('#field-templateChoice input:checked')).toHaveCount(0);
});

test('hours shortcuts, closing-time check, tidying and reloading clears answers', async ({
  page,
}) => {
  await page.goto(`${route}?template=barber-01&name=Jay%27s%20Cuts`);
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#businessName')).toHaveValue("Jay's Cuts");
  await page.locator('#businessArea').fill('  Dundee   West ');
  await page.locator('#businessArea').blur();
  await expect(page.locator('#businessArea')).toHaveValue('Dundee West');
  for (const id of ['heroSource', 'introSource'])
    await page.locator(`#field-${id}`).getByLabel('Use the template’s sample for now').check();
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
  await page.locator('#contactPhone').fill('01382 000000');
  await page.getByLabel('No WhatsApp', { exact: true }).check();
  await page.locator('#contactEmail').fill('a@b.example');
  // Without a public address, the towns or areas served become required.
  await expect(page.locator('#field-serviceArea legend small')).toHaveText('Optional');
  await page.getByLabel('Service area only — no public address', { exact: true }).check();
  await expect(page.locator('#field-serviceArea legend small')).toHaveText('Required');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#error-serviceArea')).toBeVisible();
  await page.getByLabel('Show my address', { exact: true }).check();
  await expect(page.locator('#field-serviceArea legend small')).toHaveText('Optional');
  await page.locator('#street').fill('79 Yarrow Terrace');
  await page.locator('#town').fill('Dundee');
  await page.locator('#postcode').fill('dd2  4dx');
  await page.locator('#postcode').blur();
  await expect(page.locator('#postcode')).toHaveValue('DD2 4DX');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('#field-hoursSource').getByLabel('I’ll enter my own').check();
  await expect(page.locator('.brief-day')).toHaveCount(7);
  await expect(page.locator('.brief-day legend')).toHaveText([...weekDays]);
  await page.locator('#hours-monday-status-0').check();
  await page.locator('#hours-monday-opens').fill('18:00');
  await page.locator('#hours-monday-closes').fill('09:00');
  await page.getByRole('button', { name: 'Same every day' }).click();
  for (const day of weekDays) {
    await expect(page.locator(`#hours-${day.toLowerCase()}-status-0`)).toBeChecked();
    await expect(page.locator(`#hours-${day.toLowerCase()}-closes`)).toHaveValue('09:00');
  }
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#error-hours')).toContainText(
    'Closing time must be after opening time',
  );
  await page.locator('#hours-monday-opens').fill('09:00');
  await page.locator('#hours-monday-closes').fill('17:00');
  await page.getByRole('button', { name: 'Same every day' }).click();
  await page.locator('#hours-saturday-opens').fill('20:00');
  await page.locator('#hours-saturday-closes').fill('02:00');
  await page.locator('#hours-saturday-overnight').check();
  await page.locator('#hours-sunday-status-1').check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Online' })).toBeFocused();
  // Typed answers live only in page memory: reloading keeps the link's values and clears the rest.
  await page.reload();
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#businessName')).toHaveValue("Jay's Cuts");
  await expect(page.locator('#businessArea')).toHaveValue('');
  expect(await page.evaluate(() => [Object.keys(sessionStorage), document.cookie])).toEqual([
    [],
    '',
  ]);
});

test('picker and hours grid screenshots on a phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'One set of review screenshots.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.getByRole('button', { name: 'Begin template brief' }).click();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('picker.png'), fullPage: true });
  const state = completeTemplateBrief('barber-01');
  const d = driver(page, false, 'Tab');
  await page.getByRole('radio', { name: 'The Brass Standard' }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  for (const section of rules.visibleSections(state.answers).slice(1)) {
    if (section.title === 'Opening hours') {
      await page.locator('#field-hoursSource').getByLabel('I’ll enter my own').check();
      await fillHours(
        page,
        d,
        state.rows.hours.map((row) => row.values),
      );
      await noOverflow(page);
      await page.locator('#field-hours').screenshot({ path: info.outputPath('hours.png') });
      return;
    }
    for (const field of section.fields)
      if (isVisible(field, state.answers) && field.type !== 'hidden')
        await fillField(page, d, field, state);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
});
