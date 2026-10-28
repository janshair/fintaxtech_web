// Template-local regression/performance check. Run after pnpm build against preview.
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const route = '/templates/website/3d/juice-bar-05/';
const url = origin + route + '?name=SeJuice&area=Dundee&ref=L-TEST';
const out = process.env.JUICE_REPORT_DIR || 'docs/juice-bar-05-enhancement';
await mkdir(out, { recursive: true });
const report = { url, browsers: {}, assets: [] };
const save = async (file, value) => writeFile(out + '/' + file, JSON.stringify(value, null, 2));
async function progress(page, mode) {
  return page.evaluate((mode) => {
    const track = document.querySelector(
      mode === 'story' ? '[data-story-track]' : '[data-coffee-track]',
    );
    const frame = track.querySelector('[data-scene]'),
      r = frame.getBoundingClientRect();
    return {
      y: scrollY,
      p: Number(track.dataset.progress),
      top: r.top,
      bottom: r.bottom,
      bar: document.querySelector('.mobile-contact').getBoundingClientRect().height,
      stage: track.dataset.stage,
      label: track.querySelector('[data-stage-badge]').textContent,
    };
  }, mode);
}
async function go(page, mode, p) {
  const y = await page.evaluate(
    ({ mode, p }) => {
      const track = document.querySelector(
        mode === 'story' ? '[data-story-track]' : '[data-coffee-track]',
      );
      const height = track.querySelector('[data-scene]').getBoundingClientRect().height;
      const bar = document.querySelector('.mobile-contact').getBoundingClientRect().height;
      return (
        track.getBoundingClientRect().top + scrollY - (innerHeight - bar - height - 24) + p * 620
      );
    },
    { mode, p },
  );
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForTimeout(60);
}
for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    const mainContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await mainContext.newPage();
    const errors = [],
      warnings = [],
      requests = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
      if (m.type() === 'warning') warnings.push(m.text());
    });
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    page.on('request', (r) => {
      if (r.resourceType() !== 'document')
        requests.push(r.url() + ' ' + (r.headers().referer || ''));
    });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.three === 'live');
    await page.locator('.hero-scene').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-live=true] canvas');
    assert.equal(await page.locator('.hero [data-area-prefix]').textContent(), 'in');
    assert.equal(
      await page.locator('[data-story-track] [data-stage-badge]').textContent(),
      '01 / PICK',
    );
    assert.equal(
      await page.locator('[data-coffee-track] [data-stage-badge]').textContent(),
      '01 / BEANS',
    );
    assert.equal(await page.locator('[data-sample-review]').count(), 3);
    for (const card of await page.locator('[data-sample-review]').all())
      assert.match(await card.textContent(), /Example review/);
    report.browsers[engine] = { stories: {} };
    for (const mode of ['story', 'coffee']) {
      const start = await page.evaluate(
        (mode) =>
          document
            .querySelector(mode === 'story' ? '[data-story-track]' : '[data-coffee-track]')
            .getBoundingClientRect().top +
          scrollY -
          470,
        mode,
      );
      const logs = [];
      for (let offset = 0; offset <= 820; offset += 20) {
        await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), start + offset);
        await page.waitForTimeout(26);
        logs.push(await progress(page, mode));
      }
      for (let i = 1; i < logs.length; i++) {
        assert(logs[i].p >= logs[i - 1].p, 'monotonic ' + mode);
        if (logs[i].p > logs[i - 1].p && logs[i].p < 1) {
          assert(logs[i].top >= 0);
          assert(logs[i].bottom <= 812 - logs[i].bar + 1);
        }
      }
      const interior = logs.filter((l) => l.p > 0 && l.p < 1),
        span = interior.at(-1).y - interior[0].y;
      assert(span >= 550 && span <= 700, 'timeline span ' + span);
      const intermediates = [0, 1, 2].map(
        (s) => logs.filter((l) => l.p > s / 3 + 0.03 && l.p < (s + 1) / 3 - 0.03).length,
      );
      assert(intermediates.every((n) => n >= 5));
      await save(engine + '-' + mode + '-progress.json', logs);
      report.browsers[engine].stories[mode] = { span, intermediates };
      for (const [i, p] of [0.18, 0.53, 0.96].entries()) {
        await go(page, mode, p);
        assert.equal((await progress(page, mode)).stage, String(i));
        if (mode === 'coffee') {
          assert.equal(await page.locator('canvas').getAttribute('data-coffee-label'), 'SeJuice');
          assert.equal(await page.locator('canvas').getAttribute('data-beans'), '64');
          await page.screenshot({ path: out + '/' + engine + '-coffee-stage-' + (i + 1) + '.png' });
          if (i === 2)
            assert(Number(await page.locator('canvas').getAttribute('data-latte-art')) > 0.9);
        } else if (i === 2) {
          const width = Number(await page.locator('canvas').getAttribute('data-cup-width'));
          assert(width >= 225 && width <= 263, 'cup width ' + width);
          report.browsers[engine].cupWidthPx = width;
        }
      }
      // Reverse the full story and check the initial label restores.
      const backwards = [];
      for (let offset = 820; offset >= 0; offset -= 20) {
        await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), start + offset);
        await page.waitForTimeout(26);
        backwards.push(await progress(page, mode));
      }
      for (let i = 1; i < backwards.length; i++)
        assert(backwards[i].p <= backwards[i - 1].p, 'reversible ' + mode);
      assert.equal(backwards.at(-1).p, 0);
      await save(engine + '-' + mode + '-reverse.json', backwards);
    }
    await page.locator('.loyalty').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1300);
    assert.match(await page.locator('.loyalty').getAttribute('class'), /is-filled/);
    assert.equal(await page.locator('.stamps span').count(), 10);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.locator('.hero [data-order]').click();
    await page.getByRole('button', { name: 'Next: your mix' }).click();
    await page.getByRole('button', { name: 'See order preview' }).click();
    assert.equal(
      await page.locator('#order-final [data-agency-link]').textContent(),
      'Want this for SeJuice? Talk to FinTaxTech',
    );
    assert.equal(
      await page.locator('#order-final [data-agency-link]').getAttribute('href'),
      '/contact/?ref=L-TEST',
    );
    await page.keyboard.press('Escape');
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(axe.violations, []);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(
      await page.evaluate(() => [localStorage.length, sessionStorage.length]),
      [0, 0],
    );
    assert(!requests.some((r) => /SeJuice|Dundee|L-TEST/.test(r)));
    assert.deepEqual(errors, []);
    const driver = warnings.filter((w) => /GPU stall due to ReadPixels/.test(w));
    assert.deepEqual(
      warnings.filter((w) => !/GPU stall due to ReadPixels/.test(w)),
      [],
    );
    report.browsers[engine].captureWarnings = driver;
    await page.close();
    for (const fallback of ['reduced-motion', 'webgl-off', 'no-js']) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        reducedMotion: fallback === 'reduced-motion' ? 'reduce' : 'no-preference',
        javaScriptEnabled: fallback !== 'no-js',
      });
      if (fallback === 'webgl-off')
        await context.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            if (String(type).includes('webgl')) return null;
            return original.call(this, type, ...args);
          };
        });
      const p = await context.newPage();
      await p.goto(url);
      if (fallback !== 'no-js')
        await p.waitForFunction(() => document.documentElement.dataset.three === 'fallback');
      assert(await p.locator('.coffee-posters').isVisible());
      assert.equal(await p.locator('.coffee-posters figure').count(), 3);
      await p.locator('.coffee-posters').scrollIntoViewIfNeeded();
      await p.screenshot({ path: out + '/' + engine + '-' + fallback + '.png' });
      await context.close();
    }
    console.log(engine, 'passed');
  } finally {
    await browser.close();
  }
}
// Count every poster, including all three new coffee stages, against the total.
for (const file of (await readdir('public' + route)).filter((f) => f.endsWith('.webp'))) {
  const bytes = (await stat('public' + route + file)).size;
  report.assets.push({ file, bytes });
  if (file !== 'preview.webp') assert(bytes <= 120_000);
}
report.assetBytes = report.assets.reduce((sum, a) => sum + a.bytes, 0);
assert(report.assetBytes <= 1_500_000);
const html = await readFile('dist' + route + 'index.html', 'utf8');
const modulePath = html.match(/<script type="module" src="([^"]+)"/)[1];
const jsFiles = [
  modulePath,
  ...(await readdir('dist/_astro'))
    .filter((f) => /^scene\..*\.js$/.test(f))
    .map((f) => '/_astro/' + f),
];
report.js = [];
for (const file of jsFiles) {
  const buffer = await readFile('dist' + file);
  report.js.push({ file, raw: buffer.length, gzip: gzipSync(buffer).length });
}
report.jsGzip = report.js.reduce((sum, f) => sum + f.gzip, 0);
assert(report.jsGzip <= 250_000);
const browser = await chromium.launch();
try {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(url);
  await p.waitForFunction(() => document.documentElement.dataset.three === 'live');
  report.fps = {};
  for (const mode of ['story', 'coffee']) {
    await go(p, mode, 0.94);
    const result = await p.evaluate(async (mode) => {
      const frames = [],
        begin = performance.now(),
        count = Number(document.querySelector('canvas').dataset.frames);
      let last = begin;
      for (let i = 0; i < 180; i++) {
        if (mode === 'story') scrollBy({ top: i % 2 ? -8 : 8, behavior: 'instant' });
        await new Promise(requestAnimationFrame);
        const now = performance.now();
        if (i > 10) frames.push(now - last);
        last = now;
      }
      frames.sort((a, b) => a - b);
      return {
        average: 1000 / (frames.reduce((s, v) => s + v, 0) / frames.length),
        p95ms: frames[Math.floor(frames.length * 0.95)],
        renderedFrames: Number(document.querySelector('canvas')?.dataset.frames) - count,
        fallback: document.documentElement.dataset.fallback || null,
      };
    }, mode);
    report.fps[mode] = result;
    assert(result.average >= 30 && !result.fallback);
  }
  await p.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(200);
  const before = await p.locator('canvas').getAttribute('data-frames');
  await p.waitForTimeout(400);
  const after = await p.locator('canvas').getAttribute('data-frames');
  assert.equal(before, after);
  report.offscreenPaused = true;
} finally {
  await browser.close();
}
await save('report.json', report);
console.log(JSON.stringify(report, null, 2));
