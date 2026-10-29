import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { questionSets } from '../../src/content/questions';
import { quizCopy } from '../../src/content/questionnaire';
import { services } from '../../src/content/services';

const root = (page: Page) => page.locator('#questionnaire');
async function settled(page: Page) {
  await expect(root(page)).not.toHaveAttribute('data-enquiry-phase', /.+/);
  await expect(root(page)).not.toHaveAttribute('inert');
  await expect(root(page)).not.toHaveAttribute('aria-hidden');
  await expect(root(page)).toHaveCSS('opacity', '1');
  expect(await root(page).evaluate((node) => node.getAnimations().length)).toBe(0);
}
async function begin(page: Page, service: string) {
  await page.goto(`/start/?service=${service}`);
  await expect(page).toHaveURL(new RegExp(`/enquiry/\\?service=${service}`));
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await settled(page);
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await settled(page);
}
async function back(page: Page) {
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await settled(page);
}
async function contact(page: Page) {
  while ((await root(page).locator('h1').textContent()) !== 'How should we contact you?') {
    await root(page).locator('input[type=radio], input[type=checkbox]').first().check();
    await next(page);
  }
}
async function finish(page: Page) {
  await page.getByLabel('Email', { exact: true }).check();
  await expect(page.getByLabel('Email address', { exact: true })).toBeFocused();
  await page.getByLabel('Email address', { exact: true }).fill('motion@example.com');
  await next(page);
  await next(page);
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  await settled(page);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  await page.route('https://api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, body: '{"success":true}' }),
  );
  page.on('dialog', (dialog) => dialog.accept());
});

for (const service of ['branding', 'websites', 'mobile-apps', 'ai-automation'] as const) {
  test(`${service}: Stage 1 directions, progress, rapid clicks, focus, review editing and PDF`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await begin(page, service);
    await expect(root(page)).toHaveClass(/enquiry-motion/);
    await expect(root(page)).toHaveAttribute('data-enquiry-direction', 'rise');
    await expect(root(page).locator('h1')).toBeFocused();
    await expect(page.locator('#enquiry-progress-status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#enquiry-progress-status')).toContainText(
      `Question 1 of ${questionSets[service]['1'].filter((q) => !q.when).length}:`,
    );
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('alert')).not.toBeEmpty();
    await expect(root(page)).not.toHaveAttribute('data-enquiry-phase');
    const firstHeading = await root(page).locator('h1').textContent();
    const answer = root(page).locator('input[type=radio], input[type=checkbox]').first();
    const firstAnswer = await answer.getAttribute('value');
    await answer.focus();
    await page.keyboard.press('Space');
    await expect(answer).toBeChecked();
    const initialRatio = await root(page).locator('.enquiry-progress-fill').getAttribute('style');
    // Dispatch to the same valid control repeatedly, including events after it becomes stale.
    await page
      .getByRole('button', { name: 'Continue', exact: true })
      .evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
        button.click();
      });
    await expect(root(page)).toHaveAttribute('data-enquiry-direction', 'forward');
    await expect(root(page)).toHaveAttribute('inert');
    await expect(root(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(root(page).getByRole('textbox')).toHaveCount(0);
    await expect
      .poll(() => root(page).evaluate((node) => getComputedStyle(node).transform))
      .not.toBe('none');
    const outgoing = await root(page).evaluate((node) => ({
      x: new DOMMatrixReadOnly(getComputedStyle(node).transform).m41,
      screen: node.dataset.enquiryScreen,
    }));
    if (
      outgoing.screen === 'question' &&
      (await root(page).getAttribute('data-enquiry-phase')) === 'out'
    )
      expect(outgoing.x).toBeLessThanOrEqual(0);
    await settled(page);
    await expect(root(page).getByRole('progressbar')).toHaveAttribute('value', '2');
    await expect(root(page).locator('h1')).toBeFocused();
    expect(await root(page).locator('h1').textContent()).not.toBe(firstHeading);
    expect(await root(page).locator('.enquiry-progress-fill').getAttribute('style')).not.toBe(
      initialRatio,
    );
    await back(page);
    await expect(root(page)).toHaveAttribute('data-enquiry-direction', 'back');
    await expect(root(page).locator('h1')).toHaveText(firstHeading!);
    await expect(root(page).locator(`input[value="${firstAnswer}"]`)).toBeChecked();
    await expect(root(page).getByRole('progressbar')).toHaveAttribute('value', '1');
    await contact(page);
    await finish(page);
    await expect(root(page)).toHaveAttribute('data-enquiry-screen', 'review');
    await expect(root(page).locator('h1')).toBeFocused();
    await expect(root(page).locator('.review-row').first()).toHaveCSS('--enquiry-order', '0');
    await page.getByRole('button', { name: `Edit: ${firstHeading}`, exact: true }).click();
    await settled(page);
    await expect(root(page).locator(`input[value="${firstAnswer}"]`)).toBeChecked();
    await page.getByRole('button', { name: 'Review your requirements', exact: true }).click();
    await settled(page);
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    await expect(
      root(page).getByRole('heading', { name: 'Your project enquiry PDF is ready', exact: true }),
    ).toBeVisible();
    await expect(root(page).locator('.enquiry-confirm')).toHaveCount(1);
    await expect(root(page).locator('.enquiry-confirm')).toHaveAttribute('aria-hidden', 'true');
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    expect(await (await downloading).failure()).toBeNull();
  });
}

test('conditional totals update on selection, fields expand/focus and collapse without stale contacts', async ({
  page,
}) => {
  await begin(page, 'mobile-apps');
  for (const value of ['New app', 'Both', 'Customers']) {
    await page.getByLabel(value, { exact: true }).check();
    await next(page);
  }
  await page.getByLabel('Other', { exact: true }).check();
  await expect(root(page).getByRole('progressbar')).toHaveAttribute('max', '8');
  await expect(page.locator('#enquiry-progress-status')).toContainText('Question 4 of 8:');
  await next(page);
  await expect(root(page).locator('h1')).toHaveText('Feature name');
  await expect(root(page).locator('h1')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Feature name', exact: true })).toBeFocused();
  await page.getByRole('textbox').fill('An extra feature');
  await next(page);
  await page.getByRole('textbox').fill('A useful custom workflow.');
  await back(page);
  await expect(page.getByRole('textbox')).toHaveValue('An extra feature');
  await back(page);
  await page.getByLabel('Not sure', { exact: true }).check();
  await expect(root(page).getByRole('progressbar')).toHaveAttribute('max', '6');
  await next(page);
  await page.getByLabel('Email', { exact: true }).check();
  await expect(page.getByLabel('Email address', { exact: true })).toBeFocused();
  await expect(root(page).locator('.enquiry-conditional')).toHaveAttribute('data-open', 'true');
  await page.getByLabel('Email address', { exact: true }).fill('old@example.com');
  await page.getByLabel('WhatsApp', { exact: true }).check();
  await expect(page.getByLabel('WhatsApp number', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Email address', { exact: true })).toHaveCount(0);
  await page.getByLabel('WhatsApp number', { exact: true }).fill('+44 7700 900123');
  await back(page);
  await next(page);
  await expect(page.getByLabel('WhatsApp number', { exact: true })).toHaveValue('+44 7700 900123');
  await next(page);
  await next(page);
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  await settled(page);
  await expect(root(page)).not.toContainText('old@example.com');
  await expect(root(page)).not.toContainText('An extra feature');
});

for (const width of [320, 768, 1440])
  test(`routing, direct links, reduced motion and responsive layout at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/start/?route=help');
    await expect(page).toHaveURL(/\/enquiry\/\?route=help/);
    await expect(root(page)).toHaveAttribute('data-enquiry-screen', 'routing');
    expect(await root(page).evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(
      0,
    );
    await page.getByRole('button', { name: quizCopy.routingOptions[0], exact: true }).click();
    await expect(root(page)).toHaveAttribute('data-enquiry-screen', 'intro');
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await expect(root(page).locator('h1')).toBeFocused();
    await expect(root(page)).not.toHaveAttribute('data-enquiry-phase');
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await root(page).evaluate((node) => node.getAnimations({ subtree: true }).length),
      ).toBe(0);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (info.project.name === 'chromium')
        await page.screenshot({
          path: info.outputPath(`enquiry-${width}-${theme}.png`),
          fullPage: true,
        });
    }
    await back(page);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.locator('#start-selection')).toBeVisible();
    await page.goto('/start/');
    await page.locator('a[data-start-service="websites"]').click();
    await expect(page).toHaveURL(/service=websites/);
    await page.goBack();
    await expect(page).toHaveURL(/\/start\/$/);
  });

test('all unsure routing choices animate into the matching service and return backwards', async ({
  page,
}) => {
  for (const [index, service] of services.entries()) {
    await page.goto('/start/?route=help');
    await settled(page);
    await expect(root(page)).toHaveAttribute('data-enquiry-screen', 'routing');
    await page.getByRole('button', { name: quizCopy.routingOptions[index], exact: true }).click();
    await settled(page);
    await expect(root(page).locator('h1')).toHaveText(service.name);
    await expect(root(page).locator('h1')).toBeFocused();
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await settled(page);
    await back(page);
    await expect(root(page).locator('h1')).toHaveText(service.name);
    await expect(root(page)).toHaveAttribute('data-enquiry-direction', 'back');
    await back(page);
    await expect(page.locator('#start-selection')).toBeVisible();
    await expect(page.locator('#start-title')).toBeFocused();
  }
});

test('Stage 2 and all client briefs never opt into enquiry motion', async ({ page }) => {
  for (const service of ['branding', 'websites', 'mobile-apps', 'ai-automation']) {
    await page.goto(`/enquiry/?service=${service}&stage=2`);
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await expect(root(page)).not.toHaveClass(/enquiry-motion/);
    await expect(page.locator('#enquiry-progress-status')).toHaveCount(0);
    await expect(root(page)).not.toHaveAttribute('data-enquiry-phase');
  }
  for (const route of ['logo', 'website', 'website-demo', 'mobile-app', 'prompt']) {
    await page.goto(`/client/${route}-brief/`);
    await expect(page.locator('.enquiry-motion, #enquiry-progress-status')).toHaveCount(0);
  }
});

for (const service of ['branding', 'websites', 'mobile-apps', 'ai-automation'])
  test(`${service}: reduced motion is immediate through review and PDF`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await begin(page, service);
    await contact(page);
    await finish(page);
    expect(await root(page).evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(
      0,
    );
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    await expect(root(page)).toHaveAttribute('data-enquiry-screen', 'ready');
    expect(await root(page).evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(
      0,
    );
  });

test('keyboard-only enquiry reaches a PDF and retains focus rings', async ({
  page,
  browserName,
}) => {
  test.setTimeout(120000);
  await page.goto('/enquiry/?service=websites');
  await settled(page);
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  const tabTo = async (locator: ReturnType<Page['getByRole']>) => {
    for (let i = 0; i < 60; i++) {
      if (await locator.evaluate((node) => node === document.activeElement)) return;
      await page.keyboard.press(tabKey);
    }
    throw new Error('Keyboard could not reach its next control');
  };
  await tabTo(page.getByRole('button', { name: 'Begin', exact: true }));
  await page.keyboard.press('Enter');
  await settled(page);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press(tabKey);
    await page.keyboard.press('Space');
    const selected = root(page).locator('input:checked').first();
    await expect(selected).toBeChecked();
    expect(
      await selected.evaluate((node) => getComputedStyle(node.closest('.choice')!).outlineStyle),
    ).not.toBe('none');
    await tabTo(page.getByRole('button', { name: 'Continue', exact: true }));
    await page.keyboard.press('Enter');
    await settled(page);
  }
  await page.keyboard.press(tabKey);
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Email address', { exact: true })).toBeFocused();
  await page.keyboard.type('keyboard@example.com');
  await tabTo(page.getByRole('button', { name: 'Continue', exact: true }));
  await page.keyboard.press('Enter');
  await settled(page);
  await page.keyboard.press(tabKey);
  await page.keyboard.type('A keyboard-only enquiry.');
  await tabTo(page.getByRole('button', { name: 'Continue', exact: true }));
  await page.keyboard.press('Enter');
  await settled(page);
  await tabTo(page.getByRole('button', { name: 'Review answers', exact: true }));
  await page.keyboard.press('Enter');
  await settled(page);
  await expect(root(page)).toContainText('A keyboard-only enquiry.');
  await tabTo(page.getByRole('button', { name: 'Create PDF', exact: true }));
  await page.keyboard.press('Enter');
  await expect(root(page)).toHaveAttribute('data-enquiry-screen', 'ready');
  await tabTo(page.getByRole('button', { name: 'Download PDF', exact: true }));
  const downloading = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  expect(await (await downloading).failure()).toBeNull();
});

test('motion geometry reverses, stays within 240ms CSS timing, and preference changes release inert state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await begin(page, 'websites');
  await page.getByLabel('New business website', { exact: true }).check();
  const record = async (name: string) =>
    page.getByRole('button', { name, exact: true }).evaluate(
      (button: HTMLButtonElement) =>
        new Promise<
          {
            phase: string;
            x: number;
            y: number;
            duration: string;
            inert: boolean;
            hidden: string | null;
            forms: number;
            contained: boolean;
          }[]
        >((resolve) => {
          const node = document.getElementById('questionnaire')!;
          const samples: {
            phase: string;
            x: number;
            y: number;
            duration: string;
            inert: boolean;
            hidden: string | null;
            forms: number;
            contained: boolean;
          }[] = [];
          button.click();
          const frame = () => {
            const style = getComputedStyle(node),
              matrix = new DOMMatrixReadOnly(style.transform);
            if (!node.dataset.enquiryPhase) {
              resolve(samples);
              return;
            }
            samples.push({
              phase: node.dataset.enquiryPhase,
              x: matrix.m41,
              y: matrix.m42,
              duration: style.transitionDuration,
              inert: node.inert,
              hidden: node.getAttribute('aria-hidden'),
              forms: node.querySelectorAll('#active-question').length,
              contained: document.documentElement.scrollWidth <= innerWidth,
            });
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }),
    );
  for (const [name, sign] of [
    ['Continue', 1],
    ['Back', -1],
  ] as const) {
    const samples = await record(name);
    const outgoing = samples.filter((s) => s.phase === 'out'),
      incoming = samples.filter((s) => s.phase === 'in');
    expect(outgoing.length).toBeGreaterThan(0);
    expect(incoming.length).toBeGreaterThan(0);
    expect(outgoing.every((s) => s.x * sign <= 0.1 && Math.abs(s.x) <= 20.1)).toBe(true);
    expect(incoming.every((s) => s.x * sign >= -0.1 && Math.abs(s.x) <= 20.1)).toBe(true);
    expect(
      samples.every((s) => s.inert && s.hidden === 'true' && s.forms === 1 && s.contained),
    ).toBe(true);
    expect(samples.every((s) => s.duration.split(',').every((t) => parseFloat(t) <= 0.12))).toBe(
      true,
    );
  }
  await page
    .getByRole('button', { name: 'Continue', exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(root(page)).toHaveAttribute('inert');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settled(page);
  await expect(root(page).getByRole('progressbar')).toHaveAttribute('value', '2');
  expect(await root(page).evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(root(page).locator('h1')).toBeFocused();
});
