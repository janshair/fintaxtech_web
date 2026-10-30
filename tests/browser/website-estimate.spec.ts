import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route = '/estimate/website/';
async function begin(page: any, pack = 'business') {
  await page.goto(route);
  await page.getByRole('button', { name: 'Prepare my website estimate' }).click();
  await page.locator(`input[name=packageId][value=${pack}]`).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
async function pages(page: any) {
  for (const name of ['Home', 'About', 'Services', 'Contact', 'Gallery'])
    await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
test('six-step local journey, per-page controls, back navigation, canonical and PDF', async ({
  page,
  request,
}) => {
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url());
  });
  await begin(page);
  await pages(page);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Page name', exact: true })).toHaveCount(5);
  await expect(page.locator('input[type=radio]:checked')).toHaveCount(11);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('input[value=essential]')).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('input[value=shopify_care]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download PDF Estimate' })).toBeVisible();
  await expect(page.locator('[data-estimate-form]')).toContainText('£999.00');
  await page
    .getByRole('spinbutton', {
      name: 'Additional consolidated design revision rounds',
      exact: true,
    })
    .fill('1');
  await expect(page.locator('[data-result]')).toContainText('£1,098.00');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PDF Estimate' }).click(),
  ]);
  expect(await download.failure()).toBeNull();
  expect(posts).toEqual([]);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://fintaxtech.co.uk/estimate/website/',
  );
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(route);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Prepare my website estimate' })).toBeVisible();
});
for (const width of [320, 390, 768, 1440])
  for (const theme of ['light', 'dark'])
    test(`${width} ${theme} accessible responsive questionnaire`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => {
        localStorage.setItem('ftt:theme', t);
        localStorage.setItem('ftt:consent', 'rejected');
      }, theme);
      await begin(page);
      await pages(page);
      expect(
        (await new AxeBuilder({ page }).include('.website-estimate').analyze()).violations,
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `test-results/website-estimate/${width}-${theme}.png`,
        fullPage: true,
      });
    });
test('Shopify-only product and support options', async ({ page }) => {
  await begin(page, 'shopify');
  await pages(page);
  await expect(
    page.getByRole('group', { name: 'Initial Shopify product setup', exact: true }),
  ).toBeVisible();
  await page.locator('input[name="shopify.method"][value=manual]').check();
  for (const label of [
    'Simple products in the included allowance',
    'Products with sizes or colours in the included allowance',
    'Additional simple listings',
    'Additional listings with sizes or colours',
    'Products needing complex configuration',
  ])
    await page.getByRole('spinbutton', { name: label, exact: true }).fill('0');
  await page
    .getByRole('textbox', { name: 'Product types, supplied data, variations and import needs' })
    .fill('Supplied standard catalogue');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('input[value=shopify_care]')).toHaveCount(1);
  await expect(page.locator('input[value=website_care]')).toHaveCount(0);
});
