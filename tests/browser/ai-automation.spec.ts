import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { automationCopy as c, contentAutomation } from '../../src/content/ai-automation';
import { promptBriefCopy, promptBriefSections } from '../../src/content/prompt-brief';

const secret = 'LOCAL-WORKFLOW-EXAMPLE-3829';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ftt:consent', 'rejected'));
  page.on('dialog', (d) => d.accept());
});
test('canonical service, shared labels, schema and sitemap exclude the old indexable route', async ({
  page,
  request,
  browser,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(
    sitemap.match(/<loc>https:\/\/fintaxtech.co.uk\/services\/ai-automation\/<\/loc>/g),
  ).toHaveLength(1);
  expect(sitemap).not.toContain('/services/prompt-services/');
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noJS.newPage();
  await fallback.goto('http://localhost:4323/services/prompt-services/');
  await expect(fallback.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
  await expect(fallback.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://fintaxtech.co.uk/services/ai-automation/',
  );
  await expect(fallback.getByRole('link', { name: c.redirect.link })).toHaveAttribute(
    'href',
    c.redirect.destination,
  );
  await noJS.close();
  for (const path of ['/', '/start/', '/services/', '/services/ai-automation/']) {
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(
      page.locator('footer').getByRole('link', { name: 'AI Automation', exact: true }),
    ).toHaveAttribute('href', c.redirect.destination);
    expect(await page.locator('main').innerText()).not.toMatch(
      /Prompt Services|Content from my documents/,
    );
  }
  await expect(page.locator('h1')).toHaveText(c.headline);
  await expect(page.locator('meta[name=robots]')).toHaveCount(0);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content', c.description);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://fintaxtech.co.uk/services/ai-automation/',
  );
  await expect(page.getByText(c.boundary, { exact: true })).toBeVisible();
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())[
    '@graph'
  ];
  expect(graph.find((item) => item['@type'] === 'Service')).toMatchObject({ name: c.name });
  await expect(
    page.getByRole('link', { name: 'Start a project enquiry', exact: true }),
  ).toHaveAttribute('href', '/enquiry/?service=ai-automation');
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 390, height: 844 });
    if (theme === 'dark') await page.locator('#theme-toggle').click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('static service redirect preserves suffix and history; old and new enquiry links work', async ({
  page,
}) => {
  for (const suffix of ['', '?utm_source=old&x=1&x=2#scope']) {
    await page.goto('/about/');
    await page.goto('/services/prompt-services/' + suffix);
    await expect(page).toHaveURL('http://localhost:4323/services/ai-automation/' + suffix);
    await page.goBack();
    await expect(page).toHaveURL('/about/');
  }
  for (const route of [
    '/start/?service=prompt-services&stage=2',
    '/enquiry/?service=prompt-services',
    '/enquiry/?service=ai-automation',
  ]) {
    await page.goto(route);
    await expect(page.locator('#questionnaire h1')).toHaveText(c.name);
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await expect(page.locator('#questionnaire h1')).toHaveText(c.projectLabel);
  }
});
async function completePublic(page: Page) {
  for (let i = 0; i < 35; i++) {
    if (await page.getByRole('heading', { name: 'Your contact details', exact: true }).isVisible())
      break;
    const options = page.locator(
      '#questionnaire input[type=radio], #questionnaire input[type=checkbox]',
    );
    if (await options.count()) await options.first().check();
    const input = page.locator('#questionnaire textarea');
    if (await input.count()) await input.fill(secret);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
}
for (const stage of ['1', '2'])
  test(`public stage ${stage} switches from content to workflow and produces a local automation PDF`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    const requests: string[] = [];
    page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
    await page.goto(`/enquiry/?service=ai-automation&stage=${stage}`);
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await page.getByLabel(contentAutomation, { exact: true }).check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator('#questionnaire h1')).toHaveText(
      stage === '1' ? 'What type of content is involved?' : 'What is the primary output?',
    );
    await page.locator('#questionnaire input[type=radio]').first().check();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByLabel('AI assistant or knowledge helper', { exact: true }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('alert')).not.toBeEmpty();
    await completePublic(page);
    await expect(page.locator('#questionnaire')).not.toContainText(
      stage === '1' ? 'What type of content is involved?' : 'What is the primary output?',
    );
    await expect(page.locator('#questionnaire')).toContainText(c.knowledgeLabel);
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    const pdf = await downloading;
    expect(pdf.suggestedFilename()).toBe(c.pdfFilename);
    await pdf.saveAs(info.outputPath(`automation-enquiry-${stage}.pdf`));
    expect(requests.join('\n')).not.toContain(secret);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  });
test('existing client URL supports workflow branches, review and local PDF in both themes', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
  await page.goto('/client/prompt-brief/');
  await expect(page.locator('h1')).toHaveText('AI Automation Production Brief');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
  await page.getByRole('button', { name: promptBriefCopy.begin }).click();
  await page.getByLabel('Connection between business systems', { exact: true }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: theme === 'light' ? 320 : 390, height: 844 });
    if (theme === 'dark') await page.locator('#theme-toggle').click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`workflow-${theme}.png`), fullPage: true });
  }
  for (let i = 0; i < 10; i++) {
    const title = await page.locator('[data-brief-form] h2').innerText();
    if (title === promptBriefCopy.reviewTitle) break;
    for (const f of promptBriefSections.find((s) => s.title === title)!.fields) {
      const wrap = page.locator(`#field-${f.id}`);
      if (!(await wrap.count())) continue;
      if (f.type === 'single' || f.type === 'multi') await wrap.locator('input').first().check();
      else await wrap.locator('input, textarea').fill(secret);
    }
    const next = page.getByRole('button', {
      name: title === 'Anything else' ? 'Review brief' : 'Next',
      exact: true,
    });
    await next.click();
  }
  await expect(page.locator('.brief-review')).toContainText(c.connectionLabel);
  await expect(page.locator('.brief-review')).not.toContainText('Your preferred tone');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await downloading;
  expect(pdf.suggestedFilename()).toBe('FinTaxTech-ai-automation-production-brief.pdf');
  await pdf.saveAs(info.outputPath('automation-production.pdf'));
  await page
    .getByRole('button', { name: 'Edit answers: Your automation project', exact: true })
    .click();
  await page.getByLabel(contentAutomation, { exact: true }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('[data-brief-form] h2')).toHaveText('The content you need');
  expect(requests.join('\n')).not.toContain(secret);
  expect(
    requests.every(
      (r) =>
        r.startsWith('GET http://localhost:4323/') ||
        r.startsWith('GET blob:http://localhost:4323/'),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual([
    'ftt:consent',
    'ftt:theme',
  ]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
  await page.reload();
  await page.getByRole('button', { name: promptBriefCopy.begin }).click();
  await expect(page.locator('[data-brief-form] input:checked')).toHaveCount(0);
});
