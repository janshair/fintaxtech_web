import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { company } from '../../src/content/site';

const title = 'FinTaxTech Project Assistant';
const invitationTitle = 'Need help finding the right service?';
const sessionKey = 'ftt:project-assistant-invitation';
const localKey = 'ftt:project-assistant-dismissed-until';
const week = 7 * 24 * 60 * 60 * 1000;
const start = new Date('2026-01-01T12:00:00Z').getTime();
const launcher = (page: Page) => page.getByRole('button', { name: 'Get Started', exact: true });
const invitation = (page: Page) => page.getByRole('button', { name: invitationTitle, exact: true });
const panel = (page: Page) => page.getByRole('dialog', { name: title });

async function freezeClock(page: Page, time = start) {
  await page.clock.install({ time: time - 60_000 });
  await page.clock.pauseAt(time);
}

test('invites once after ten seconds across navigation and returns keyboard focus', async ({
  page,
  browserName,
}) => {
  await freezeClock(page);
  await page.goto('/');
  await expect(launcher(page)).toBeVisible();
  await page.clock.fastForward(5000);
  await page.goto('/work/');
  await expect(launcher(page)).toBeVisible();
  await page.clock.fastForward(4999);
  await expect(invitation(page)).toBeHidden();
  await launcher(page).focus();
  await page.clock.fastForward(1);
  await expect(invitation(page)).toBeVisible();
  await expect(panel(page)).toBeHidden();
  await expect(launcher(page)).toBeFocused();
  await expect(page.locator('[data-assistant-announcement]')).toHaveText(
    `${invitationTitle} I can point you in the right direction.`,
  );

  await invitation(page).focus();
  await page.keyboard.press('Enter');
  await expect(
    panel(page).getByRole('heading', { name: 'What would you like help with?' }),
  ).toBeFocused();
  // WebKit on macOS uses Option+Tab to include buttons in sequential navigation.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  const pricing = panel(page).getByRole('button', { name: 'Get a price estimate' });
  await expect(pricing).toBeFocused();
  expect(await pricing.evaluate((button) => getComputedStyle(button).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(
    panel(page).getByRole('heading', { name: 'Which service are you interested in?' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(invitation(page)).toBeFocused();
  await expect(page.evaluate((key) => sessionStorage.getItem(key), sessionKey)).resolves.toBe(
    'handled',
  );
  await expect(page.evaluate((key) => localStorage.getItem(key), localKey)).resolves.toBeNull();
  await page.reload();
  await expect(launcher(page)).toBeVisible();
  await page.clock.fastForward(11_000);
  await expect(invitation(page)).toBeHidden();
});

test('dismissal suppresses new tabs for seven days while manual opening stays available', async ({
  page,
  context,
}) => {
  await freezeClock(page);
  await page.goto('/work/');
  await expect(launcher(page)).toBeVisible();
  await page.clock.fastForward(10_000);
  await page.getByRole('button', { name: 'Dismiss Project Assistant invitation' }).click();
  await expect(invitation(page)).toBeHidden();
  const expires = start + 10_000 + week;
  expect(await page.evaluate((key) => localStorage.getItem(key), localKey)).toBe(String(expires));
  expect(
    await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]),
  ).toEqual([[localKey], [sessionKey]]);

  const before = await context.newPage();
  await freezeClock(before, expires - 10_001);
  await before.goto('/work/');
  await expect(launcher(before)).toBeVisible();
  await before.clock.fastForward(10_000);
  await expect(invitation(before)).toBeHidden();
  await launcher(before).click();
  await expect(panel(before)).toBeVisible();
  await panel(before).getByRole('button', { name: 'Close' }).click();
  await expect(launcher(before)).toBeFocused();
  await before.close();

  const after = await context.newPage();
  await freezeClock(after, expires - 10_000);
  await after.goto('/work/');
  await expect(launcher(after)).toBeVisible();
  await after.clock.fastForward(10_000);
  await expect(invitation(after)).toBeVisible();
  await after.close();
});

test('suppresses the automatic invitation throughout questionnaire and estimate routes', async ({
  page,
}) => {
  await freezeClock(page);
  for (const path of [
    '/start/',
    '/enquiry/?route=help',
    '/client/logo-brief/',
    '/client/website-brief/',
    '/client/website-brief/templates/',
    '/client/mobile-app-brief/',
    '/client/prompt-brief/',
    '/estimate/website/',
    '/estimate/mobile/usd/',
  ]) {
    await page.goto(path);
    await expect(launcher(page)).toBeVisible();
    await page.clock.fastForward(11_000);
    await expect(invitation(page)).toHaveCount(0);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), sessionKey)).toBeNull();
  }
  await page.goto('/work/');
  await expect(launcher(page)).toBeVisible();
  await page.clock.fastForward(10_000);
  await expect(invitation(page)).toBeVisible();
});

test('routes each service and published project to an existing destination', async ({
  page,
  request,
}) => {
  const services = [
    ['Branding and graphic design', 'branding', 'branding'],
    ['Website development', 'website', 'websites'],
    ['Mobile app development', 'mobile', 'mobile-apps'],
    ['AI automation', 'ai-automation', 'ai-automation'],
    ['I’m not sure', '', ''],
  ];
  const help = '/enquiry/?route=help';
  const dialog = panel(page);
  const open = (name: string) => dialog.getByRole('button', { name, exact: true }).click();
  const destination = async (name: string | RegExp, href: string) => {
    await expect(dialog.getByRole('link', { name })).toHaveAttribute('href', href);
    if (href.startsWith('/')) expect((await request.get(href)).ok()).toBe(true);
  };
  await page.goto('/');
  await launcher(page).click();
  await open('Get a price estimate');
  for (const [label, route] of services) {
    if (route) await destination(label, `/estimate/${route}/`);
  }
  await open('I’m not sure');
  await expect(dialog.getByText(/Pricing depends on the scope/)).toBeVisible();
  await destination('Continue to the questionnaire', help);
  await destination('Contact page', '/contact/');
  await open('Back');
  await expect(
    dialog.getByRole('heading', { name: 'Which service are you interested in?' }),
  ).toBeFocused();
  await open('Restart');

  await open('View previous work');
  await destination(/^Ask Appliance Repairs/, '/work/client-01/');
  await destination(/^Metoni/, '/metoni/');
  await destination(/^Safos/, '/safos/');
  await destination('View all selected work', '/work/');
  await open('Back');

  await open('Discuss a project');
  for (const [label, , id] of services) {
    await open(label);
    await destination('Continue to the questionnaire', id ? `/enquiry/?service=${id}` : help);
    await destination('Email FinTaxTech', `mailto:${company.email}`);
    await destination('WhatsApp FinTaxTech', `https://wa.me/${company.whatsapp}`);
    await open('Back');
  }
  await open('Restart');
  await open('Something else');
  await expect(dialog.getByText(company.response)).toBeVisible();
  await destination('Contact page', '/contact/');
  await destination(company.email, `mailto:${company.email}`);
  await destination('WhatsApp FinTaxTech', `https://wa.me/${company.whatsapp}`);
  await dialog.getByRole('link', { name: 'Contact page' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test('fits a compact mobile viewport and passes light and dark accessibility scans', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await freezeClock(page);
  await page.goto('/work/');
  await expect(launcher(page)).toBeVisible();
  await page.clock.fastForward(10_000);
  const invite = page.locator('[data-assistant-invitation]');
  const consent = page.locator('#consent-banner');
  await expect(invite).toBeInViewport();
  const inviteBox = (await invite.boundingBox())!;
  const consentBox = (await consent.boundingBox())!;
  expect(inviteBox.y + inviteBox.height).toBeLessThan(consentBox.y);
  expect(inviteBox.x + inviteBox.width).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Reject analytics' }).click();
  await page.clock.resume();

  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch colour theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await launcher(page).click();
    const dialog = panel(page);
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.width).toBe(320);
    expect(box.y + box.height).toBe(600);
    await dialog.getByRole('button', { name: 'View previous work' }).click();
    await expect(dialog.getByRole('link', { name: /^Metoni/ })).toBeVisible();
    await expect
      .poll(() =>
        dialog
          .locator('img')
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      )
      .toBe(true);
    expect(
      (await new AxeBuilder({ page }).include('#project-assistant').analyze()).violations,
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(launcher(page)).toBeFocused();
  }
});
