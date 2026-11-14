import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { careersCopy } from '../../src/content/careers';
import { company } from '../../src/content/site';

test('careers navigation, static vacancy, metadata and email application', async ({
  browser,
  page,
  request,
}) => {
  await page.goto('/');
  await expect(
    page.locator('header').getByRole('link', { name: careersCopy.label, exact: true }),
  ).toHaveCount(0);
  await page.locator('footer').getByRole('link', { name: careersCopy.label, exact: true }).click();
  await expect(page).toHaveURL(/\/careers\/$/);
  const vacancy = page.getByRole('link', { name: 'Front-End Developer', exact: true });
  await vacancy.focus();
  await expect(vacancy).toBeFocused();
  await vacancy.press('Enter');
  await expect(page).toHaveURL(/\/careers\/frontend-developer\/$/);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  for (const path of ['/careers/', '/careers/frontend-developer/']) {
    expect((await staticPage.goto(path))?.status()).toBe(200);
    await expect(staticPage.locator('h1')).toHaveCount(1);
    await expect(
      staticPage.locator('.job-meta dt').getByText('Published', { exact: true }),
    ).toHaveCount(0);
    await expect(staticPage.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `${company.url}${path}`,
    );
    await expect(staticPage.locator('meta[name=robots]')).toHaveCount(0);
    const graph = JSON.parse(
      await staticPage.locator('script[type="application/ld+json"]').innerText(),
    )['@graph'];
    expect(
      graph.filter((node: Record<string, unknown>) => node['@type'] === 'JobPosting'),
    ).toHaveLength(path === '/careers/' ? 0 : 1);
  }
  const main = staticPage.locator('main');
  const subject = 'CV[Fintaxtech-Web]: Front-End Developer';
  await expect(main.locator('.job-application')).toHaveText(
    `Send your CV to ${company.email} using the subject line below. ${subject} CVs with a different subject line will be discarded.`,
  );
  await expect(main.locator('.job-application br + strong:has(+ br)')).toHaveText(subject);
  await expect(main.getByRole('heading', { name: 'You will be working on' })).toBeVisible();
  const email = main.getByRole('link', { name: company.email, exact: true });
  await expect(email).toHaveAttribute(
    'href',
    `mailto:${company.email}?subject=${encodeURIComponent(subject)}`,
  );
  await expect(email).not.toHaveClass(/button/);
  await expect(main.getByRole('heading', { name: 'Useful additional familiarity' })).toHaveCount(0);
  await expect(main.locator('button, form, input[type=file]')).toHaveCount(0);
  await expect(main.locator('.article-body > :last-child')).toHaveClass('job-application');
  expect((await request.get('/careers/fixture-inactive/')).status()).toBe(404);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(
    sitemap.split('<loc>https://fintaxtech.co.uk/careers/frontend-developer/</loc>'),
  ).toHaveLength(2);
  await context.close();
});

test('careers category filters show only matching vacancies and can be reset', async ({ page }) => {
  await page.goto('/careers/');
  const filters = page.getByRole('group', { name: careersCopy.categoryFilter });
  await expect(filters.getByRole('button')).toHaveText([
    'All jobs',
    'AI Automation',
    'Branding',
    'Mobile',
    'Web',
  ]);
  const all = filters.getByRole('button', { name: 'All jobs' });
  const web = filters.getByRole('button', { name: 'Web' });
  const vacancy = page.getByRole('link', { name: 'Front-End Developer', exact: true });

  for (const [name, slug] of [
    ['AI Automation', 'ai-automation'],
    ['Branding', 'branding'],
    ['Mobile', 'mobile'],
  ]) {
    const category = filters.getByRole('button', { name });
    await category.click();
    await expect(category).toHaveAttribute('aria-pressed', 'true');
    await expect(vacancy).toBeHidden();
    const matches = page.locator(`[data-job-category="${slug}"]`);
    await expect(matches.filter({ visible: true })).toHaveCount(await matches.count());
    await expect(
      page.locator(`[data-job-category]:not([data-job-category="${slug}"]):visible`),
    ).toHaveCount(0);
    if ((await matches.count()) === 0)
      await expect(page.getByRole('status')).toHaveText(careersCopy.emptyCategory);
  }

  await web.press('Enter');
  await expect(web).toHaveAttribute('aria-pressed', 'true');
  await expect(vacancy).toBeVisible();

  await all.click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(web).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-job-category][hidden]')).toHaveCount(0);
});

for (const theme of ['light', 'dark'])
  test(`careers responsive accessibility in ${theme}`, async ({ page }, info) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ftt:theme', theme);
      localStorage.setItem('ftt:consent', 'rejected');
    }, theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/careers/', '/careers/frontend-developer/']) {
        await page.goto(path);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        if (info.project.name === 'chromium' && width === 1280)
          await page.locator('main').screenshot({
            path: `test-results/careers-${path === '/careers/' ? 'index' : 'job'}-${theme}.png`,
          });
      }
    }
  });
