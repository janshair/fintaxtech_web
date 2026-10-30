import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  motionGallery as gallery,
  motionTemplates,
  barberRedirect,
} from '../../src/content/templates';
const demo = motionTemplates[0];

test('gallery and demo have correct static metadata, assets and sitemap rules', async ({
  request,
}) => {
  const galleryResponse = await request.get(gallery.route);
  expect(galleryResponse.status()).toBe(200);
  const galleryHTML = await galleryResponse.text();
  expect(galleryHTML).not.toContain('noindex');
  expect(galleryHTML).toContain(`rel="canonical" href="https://fintaxtech.co.uk${gallery.route}"`);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.split(`<loc>https://fintaxtech.co.uk${gallery.route}</loc>`)).toHaveLength(2);
  expect(sitemap).not.toContain(barberRedirect.route);
  for (const template of motionTemplates) {
    expect(galleryHTML).toContain(template.name);
    expect(galleryHTML).toContain(template.preview.src);
    expect(sitemap).not.toContain(template.route);
    for (const path of [template.route, template.route.slice(0, -1)]) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(`rel="canonical" href="https://fintaxtech.co.uk${template.route}"`);
      expect(html).toContain('noindex,nofollow');
    }
    for (const file of ['styles.css', 'app.js', 'preview.webp']) {
      expect((await request.get(`${template.route}${file}`)).status()).toBe(200);
    }
  }
});

for (const width of [320, 390, 768, 1440]) {
  test(`gallery works in both themes at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
    await page.goto(gallery.route);
    await expect(page.locator('h1')).toHaveText(gallery.title);
    await expect(page.locator('.template-card')).toHaveCount(motionTemplates.length);
    await expect(page.locator('header.site-header')).toHaveCount(1);
    await expect(page.locator('footer.site-footer')).toHaveCount(1);
    for (const template of motionTemplates) {
      await expect(
        page.getByRole('link', { name: `${gallery.previewLabel} ${template.name}` }),
      ).toHaveAttribute('href', template.route);
      const img = page.locator(`.template-card img[src="${template.preview.src}"]`);
      await expect
        .poll(() => img.evaluate((node) => (node as HTMLImageElement).naturalWidth))
        .toBe(template.preview.width);
    }
    await expect(
      page.getByRole('link', { name: `${gallery.previewLabel} ${demo.name}` }),
    ).toHaveAttribute('href', demo.route);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      if (testInfo.project.name === 'chromium')
        await page.screenshot({
          path: testInfo.outputPath(`gallery-${width}-${theme}.png`),
          fullPage: true,
        });
    }
    const link = page.getByRole('link', { name: `${gallery.previewLabel} ${demo.name}` });
    await link.focus();
    await link.press('Enter');
    await expect(page).toHaveURL(demo.route);
    await page.locator('[data-personalise]').click();
    await expect(page.locator('#name-dialog')).toBeVisible();
  });
}

for (const width of [390, 1440]) {
  test(`personalisation, booking, motion and memory-only state at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const outgoing: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://localhost:4323') outgoing.push(request.url());
    });
    await page.goto(demo.route);
    await page.locator('[data-personalise]').click();
    await expect(page.locator('#name-dialog')).toBeVisible();
    await expect(page.getByLabel('Business name', { exact: true })).toBeFocused();
    await page.getByLabel('Business name', { exact: true }).fill('North & South <Barbers>');
    await page.getByRole('button', { name: 'Preview my website' }).click();
    await expect(page.locator('#name-dialog')).not.toBeVisible();
    for (const name of await page.locator('[data-business]').all())
      await expect(name).toHaveText('North & South <Barbers>');
    await expect(page.locator('[data-business] barbers')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(new URL(page.url()).searchParams.get('name')).toBe('North & South <Barbers>');
    await page.locator('#visit [data-book]').click();
    await expect(page.locator('#booking-dialog')).toBeVisible();
    await page.locator('#booking-form button[type=submit]').click();
    await expect(page.locator('#booking-slots')).toBeVisible();
    await page.locator('#booking-slots button[type=submit]').click();
    await expect(page.locator('#booking-result')).toContainText('Demo only, nothing is sent');
    await page.keyboard.press('Escape');
    await expect(page.locator('#booking-dialog')).not.toBeVisible();
    await expect(page.locator('#visit [data-book]')).toBeFocused();
    await page.locator('#ritual').scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--scroll')))
      .not.toBe('0.0000');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#ritual-step')).toHaveText('THE COMPLETE RITUAL');
    await expect(page.locator('.pole-stripes')).toHaveCSS('animation-name', 'none');
    expect(
      await page.evaluate(() => ({
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      })),
    ).toEqual({ local: [], session: [] });
    expect(outgoing).toEqual([]);
    await page.reload();
    await expect(page.locator('#name-dialog')).not.toBeVisible();
    await page.locator('[data-personalise]').click();
    await expect(page.getByLabel('Business name', { exact: true })).toHaveValue(
      'North & South <Barbers>',
    );
    await page.getByRole('button', { name: 'Explore the sample first' }).click();
    await expect(page.locator('[data-business]').first()).toHaveText(demo.name);
    if (testInfo.project.name === 'chromium')
      await page.screenshot({ path: testInfo.outputPath(`demo-${width}.png`), fullPage: true });
    await page.locator('.site-footer').getByRole('link', { name: gallery.backLabel }).click();
    await expect(page).toHaveURL(gallery.route);
  });
}

test('old demo links preserve queries and fragments through the shared redirect', async ({
  page,
}) => {
  await page.goto(`${barberRedirect.route}?utm_source=sample#services`);
  await expect(page).toHaveURL(`${demo.route}?utm_source=sample#services`);
});

test('the cleaning gallery card opens the implemented Fresh Start demo', async ({ page }) => {
  const cleaning = motionTemplates.find((template) => template.id === 'cleaning-04')!;
  await page.goto(gallery.route);
  await page.getByRole('link', { name: `${gallery.previewLabel} ${cleaning.name}` }).click();
  await expect(page).toHaveURL(cleaning.route);
  await expect(page.locator('h1')).toContainText('A clean home.');
});

test('the gym gallery card opens the implemented Full Circuit demo', async ({ page }) => {
  const gym = motionTemplates.find((template) => template.id === 'gym-06')!;
  await page.goto(gallery.route);
  await page.getByRole('link', { name: `${gallery.previewLabel} ${gym.name}` }).click();
  await expect(page).toHaveURL(gym.route);
  await expect(page.locator('h1')).toContainText('Stronger starts');
  await expect(page.locator('[data-business]').first()).toHaveText('Hillmoor Fitness Club');
});
