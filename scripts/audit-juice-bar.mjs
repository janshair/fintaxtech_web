// Run after pnpm build, against a static preview. Never visits enquiry endpoints.
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const route = '/templates/website/3d/juice-bar-05/';
const letter =
  route + '?name=Jay%27s%20Juice%20%26%20Co&area=Kirkcaldy&phone=07526%20699217&ref=L-TEST';
const out = 'docs/juice-bar-05';
await mkdir(out, { recursive: true });
const sceneFile = (await readdir('dist/_astro')).find((file) => /^scene\..*\.js$/.test(file));
const source = await readFile('dist/_astro/' + sceneFile);
const html = await readFile('dist' + route + 'index.html', 'utf8');
const loaderPath = html.match(/<script type="module" src="([^"]+)"/)[1];
const loaderSource = await readFile('dist' + loaderPath);
const jsGzipBytes = gzipSync(source).length + gzipSync(loaderSource).length;
const assets = await Promise.all(
  ['hero.webp', 'stage-1.webp', 'stage-2.webp', 'stage-3.webp', 'coffee.webp'].map(
    async (file) => ({ file, bytes: (await stat('public' + route + file)).size }),
  ),
);
const report = {
  date: new Date().toISOString(),
  origin,
  scene: { file: sceneFile, rawBytes: source.length, gzipBytes: gzipSync(source).length },
  loader: {
    file: loaderPath,
    rawBytes: loaderSource.length,
    gzipBytes: gzipSync(loaderSource).length,
  },
  combined3dJsGzipBytes: jsGzipBytes,
  assets,
  posterTotalBytes: assets.reduce((total, asset) => total + asset.bytes, 0),
  externalModelTextureBytes: 0,
  previewBytes: (await stat('public' + route + 'preview.webp')).size,
};
const browser = await chromium.launch({ args: ['--remote-debugging-port=9224'] });
try {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
  });
  await page.goto(origin + letter);
  await page.waitForSelector('[data-live=true] canvas');
  await page.waitForTimeout(600);
  await page.screenshot({ path: out + '/personalised-phone.png' });
  await page.screenshot({ path: out + '/personalised-full.png', fullPage: true });
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(origin + route + '?name=Daybreak%20Juice%20Club');
  await page.waitForSelector('[data-live=true] canvas');
  const sampleCanvas = page.locator('canvas');
  report.label = await sampleCanvas.getAttribute('data-label');
  // Context loss uses the actual WebGL extension and lets the browser restore once.
  report.contextLoss = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const ext = gl.getExtension('WEBGL_lose_context');
    if (!ext) return { available: false };
    ext.loseContext();
    await new Promise((r) => setTimeout(r, 150));
    const lost = document.documentElement.dataset.fallback;
    ext.restoreContext();
    await new Promise((r) => setTimeout(r, 700));
    return { available: true, lost, restored: document.documentElement.dataset.three };
  });
  // A foreground visibility override exercises the same handler without allowing
  // headless background-page scheduling policies to distort the measurement.
  report.visibility = await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const before = Number(document.querySelector('canvas').dataset.frames);
    await new Promise((r) => setTimeout(r, 400));
    const after = Number(document.querySelector('canvas').dataset.frames);
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    return { before, after, paused: before === after };
  });
  // Navigation, rather than a query flag, switches to a genuine reduced-motion fallback.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(origin + letter);
  await page.screenshot({ path: out + '/poster-fallback-phone.png' });
  await page.waitForFunction(() => document.documentElement.dataset.fallback === 'reduced-motion');
  report.reducedMotion = await page.locator('html').getAttribute('data-fallback');
  await page.close();
  const fps = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const cdp = await fps.context().newCDPSession(fps);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await fps.goto(origin + letter);
  await fps.waitForFunction(() => !!document.documentElement.dataset.three);
  report.frameRate = await fps.evaluate(async () => {
    const before = Number(document.querySelector('canvas')?.dataset.frames || 0);
    const samples = [],
      start = performance.now();
    let previous = start;
    let frames = 0;
    while (performance.now() - start < 4200) {
      dispatchEvent(
        new PointerEvent('pointermove', { pointerType: 'mouse', clientX: innerWidth * 0.6 }),
      );
      await new Promise(requestAnimationFrame);
      const now = performance.now();
      if (frames++ > 10) samples.push(now - previous);
      previous = now;
    }
    samples.sort((a, b) => a - b);
    return {
      renderedFrames: Number(document.querySelector('canvas')?.dataset.frames || 0) - before,
      cpuSlowdown: 4,
      width: 390,
      samples: samples.length,
      averageFps: 1000 / (samples.reduce((a, b) => a + b, 0) / samples.length),
      p95FrameMs: samples[Math.floor(samples.length * 0.95)],
      fallback: document.documentElement.dataset.fallback || null,
    };
  });
  await fps.close();
  const result = await lighthouse(origin + letter, {
    port: 9224,
    onlyCategories: ['performance', 'accessibility'],
    output: 'json',
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
  });
  const lhr = result.lhr;
  await writeFile(out + '/lighthouse.json', JSON.stringify(lhr, null, 2));
  report.lighthouse = {
    performance: lhr.categories.performance.score * 100,
    accessibility: lhr.categories.accessibility.score * 100,
    lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    fcpMs: lhr.audits['first-contentful-paint'].numericValue,
    failed: Object.entries(lhr.audits)
      .filter(([, a]) => a.score === 0)
      .map(([id, a]) => ({ id, title: a.title, value: a.displayValue })),
  };
} finally {
  await browser.close();
}
await writeFile(out + '/audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
assert(jsGzipBytes <= 250_000, '3D JavaScript exceeds 250 KB gzipped');
assert(report.posterTotalBytes <= 1_500_000);
assert(report.previewBytes < 200_000);
for (const asset of assets) assert(asset.bytes <= 120_000);
assert(report.lighthouse.performance >= 85);
assert(report.lighthouse.accessibility >= 95);
assert(report.lighthouse.cls < 0.05);
assert(report.lighthouse.lcpMs < 2500);
assert(report.frameRate.averageFps >= 30 && !report.frameRate.fallback);
assert(report.visibility.paused);
assert(report.contextLoss.restored === 'live');
