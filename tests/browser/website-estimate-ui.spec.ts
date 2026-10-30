import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [320, 375, 390, 768, 1440])
  for (const theme of ['light', 'dark'])
    test(`website six-step UI ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => {
        localStorage.setItem('ftt:theme', t);
        localStorage.setItem('ftt:consent', 'rejected');
      }, theme);
      await page.goto('/estimate/website/');
      await page.getByRole('button', { name: 'Prepare my website estimate' }).click();
      const cards = page.locator('.website-estimate .choice-card');
      await expect(cards).toHaveCount(4);
      const copy = cards.first().locator('.mobile-option');
      expect((await copy.boundingBox())!.width).toBeGreaterThan(150);
      const radio = page.locator('input[name=packageId][value=business]');
      await radio.focus();
      await page.keyboard.press('Space');
      await expect(radio).toBeChecked();
      const details = cards.first().locator('details');
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      await expect(details.getByRole('list')).toBeVisible();
      const root = page.locator('.website-estimate');
      for (let step = 1; step <= 6; step++) {
        await expect(root.locator('.quiz-progress')).toHaveAttribute('value', String(step));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (step === 1 || step === 6)
          expect(
            (await new AxeBuilder({ page }).include('.website-estimate').analyze()).violations,
          ).toEqual([]);
        if (width === 375 || width === 1440)
          await root.screenshot({
            path: `test-results/website-ui/${width}-${theme}-step-${step}.png`,
          });
        if (step === 2)
          for (const name of ['Home', 'About', 'Services', 'Contact', 'Gallery'])
            await page.getByRole('button', { name, exact: true }).click();
        if (step < 6) await page.getByRole('button', { name: 'Continue', exact: true }).click();
      }
      await expect(page.locator('[data-result] .estimate-total').first()).toHaveText('£999.00');
    });
