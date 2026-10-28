// Regression captures of real scroll positions; no synthetic scene override.
import { chromium, firefox, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const out = 'docs/juice-bar-05-pour';
await mkdir(out, { recursive: true });
const results = {};
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto(
      origin + '/templates/website/3d/juice-bar-05/?name=SeJuice&area=Dundee&ref=L-TEST',
    );
    await page.waitForFunction(() => document.documentElement.dataset.three === 'live');
    const hero = await page.locator('.hero .location').textContent();
    assert.match(hero, /in Dundee/);
    assert(!hero.includes('inDundee'));
    const contact = await page.locator('#contact .section-heading>p').textContent();
    assert.match(contact, /in Dundee/);
    assert.equal(await page.locator('#reviews-title').textContent(), 'A little neighbourhood love');
    assert.match(
      await page.locator('.reviews header').textContent(),
      /Example reviews — your real Google reviews appear here\./,
    );
    await page.screenshot({ path: out + '/' + name + '-hero.png' });
    const records = [];
    for (const p of [0.2, 0.5, 0.8, 1]) {
      const y = await page.evaluate((p) => {
        const t = document.querySelector('[data-coffee-track]'),
          f = t.querySelector('[data-scene]'),
          bar = document.querySelector('.mobile-contact').getBoundingClientRect().height;
        return Math.ceil(
          t.getBoundingClientRect().top +
            scrollY -
            (innerHeight - bar - f.getBoundingClientRect().height - 24) +
            620 * p,
        );
      }, p);
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForFunction(
        (p) =>
          Math.abs(Number(document.querySelector('[data-coffee-track]').dataset.progress) - p) <
            0.003 && document.querySelector('[data-scene=coffee]').dataset.live === 'true',
        p,
      );
      // Let the scroll-driven camera/fill complete and the live frame settle.
      await page.waitForTimeout(650);
      const state = await page.evaluate(() => ({
        progress: Number(document.querySelector('[data-coffee-track]').dataset.progress),
        fill: Number(document.querySelector('canvas').dataset.coffeeFill),
        pourView: Number(document.querySelector('canvas').dataset.coffeePourView),
        label: document.querySelector('canvas').dataset.coffeeLabel,
      }));
      assert.equal(state.label, 'SeJuice');
      if (p === 0.5) {
        assert(Math.abs(state.fill - 0.5) < 0.01);
        assert.equal(state.pourView, 1);
      }
      if (p === 1) assert.equal(state.pourView, 0);
      await page.screenshot({ path: out + '/' + name + '-coffee-' + p.toFixed(1) + '.png' });
      await page
        .locator('[data-scene=coffee]')
        .screenshot({ path: out + '/' + name + '-scene-' + p.toFixed(1) + '.png' });
      records.push(state);
    }
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const before = await page.locator('canvas').getAttribute('data-frames');
    await page.waitForTimeout(350);
    assert.equal(await page.locator('canvas').getAttribute('data-frames'), before);
    results[name] = {
      hero: hero.trim(),
      contact: contact.trim(),
      states: records,
      offscreenPaused: true,
    };
    console.log(name, 'passed');
  } finally {
    await browser.close();
  }
}
await writeFile(out + '/verification.json', JSON.stringify(results, null, 2));
