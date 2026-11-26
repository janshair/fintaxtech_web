import { expect, test } from '@playwright/test';

const palettes = {
  light: { brand: 'rgb(23, 107, 114)', templates: 'rgb(37, 99, 235)' },
  dark: { brand: 'rgb(101, 197, 199)', templates: 'rgb(79, 131, 255)' },
};

for (const theme of ['light', 'dark'] as const) {
  test(`the ${theme} brand palette reaches the catalogues and preserves template samples`, async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
    await page.emulateMedia({ colorScheme: theme });
    const launcher = page.getByRole('button', { name: 'Get Started', exact: true });

    await page.goto('/');
    await expect(launcher).toHaveCSS('background-color', palettes[theme].brand);

    await page.goto('/templates/');
    await expect(launcher).toHaveCSS('background-color', palettes[theme].brand);
    await expect(page.locator('.service-card h2 span').first()).toHaveCSS(
      'color',
      palettes[theme].brand,
    );

    for (const route of [
      '/templates/website/',
      '/templates/website/motion/',
      '/templates/website/3d/',
      '/templates/website/landing/',
      '/templates/website/placeholder/',
      '/templates/branding/',
      '/templates/branding/logo/',
      '/templates/ai-automation/',
      '/templates/mobile-apps/',
    ]) {
      await page.goto(route);
      await expect(launcher).toHaveCSS('background-color', palettes[theme].brand);
    }

    await page.goto('/templates/website/motion/barber-01/');
    await expect(page.locator('html')).not.toHaveAttribute('data-site-theme', 'brand');

    for (const route of [
      '/templates/branding/logo/minimalism/',
      '/templates/ai-automation/retail-ecommerce/',
      '/templates/mobile-apps/booking-appointments/',
    ]) {
      await page.goto(route);
      await expect(launcher).toHaveCSS('background-color', palettes[theme].templates);
      const email = page.locator('.site-footer a[href^="mailto:"]');
      await expect(email).toHaveCSS('color', palettes[theme].templates);
    }

    const switched = theme === 'light' ? 'dark' : 'light';
    await page.getByRole('button', { name: 'Switch colour theme' }).click();
    await expect(launcher).toHaveCSS('background-color', palettes[switched].templates);

    await page.goto('/templates/website/');
    await expect(launcher).toHaveCSS('background-color', palettes[switched].brand);
    await expect(page.locator('.explore').first()).toHaveCSS('color', palettes[switched].brand);

    await page.goto('/pricing/');
    await expect(launcher).toHaveCSS('background-color', palettes[switched].brand);
    await expect(page.getByRole('link', { name: 'Pricing', exact: true }).first()).toHaveCSS(
      'color',
      palettes[switched].brand,
    );
  });
}
