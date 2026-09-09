import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { socialProfiles } from '../../src/content/social';
for (const theme of ['light', 'dark'] as const) {
  test(`social links and app policies remain accessible in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        '/contact/',
        '/invoice/privacy.html',
        '/reprocket/privacy.html',
        '/reprocket/terms.html',
      ]) {
        const response = await page.goto(route);
        expect([200, 304]).toContain(response?.status());
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('body > header')).toHaveCount(1);
        await expect(page.locator('body > footer')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        for (const profile of socialProfiles) {
          const link = page
            .locator('footer')
            .getByRole('link', { name: profile.label, exact: true });
          await expect(link).toHaveAttribute('href', profile.url);
          await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
          await link.focus();
          await expect(link).toBeFocused();
        }
        if (testInfo.project.name === 'chromium')
          await page.screenshot({
            path: `docs/seo-audit/${route.split('/').filter(Boolean).join('-')}-${width}-${theme}.png`,
            fullPage: true,
          });
      }
    }
    await page.goto('/contact/');
    const social = page.locator('main').getByRole('link', { name: 'GitHub', exact: true });
    // Intercept the destination to verify native Enter/new-tab behaviour without relying on a social network.
    await page
      .context()
      .route('https://github.com/Fintaxtech-Ltd', (route) =>
        route.fulfill({ body: 'Profile destination' }),
      );
    await social.focus();
    const popupPromise = page.waitForEvent('popup');
    await page.keyboard.press('Enter');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    expect(popup.url()).toBe('https://github.com/Fintaxtech-Ltd');
    await popup.close();
  });
}
