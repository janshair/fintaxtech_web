// Renders public/templates/website/3d/juice-bar-05/cup-*.webp from the scene.
// Run: node src/pages/templates/website/3d/juice-bar-05/_checks/posters.mjs
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const out = 'public/templates/website/3d/juice-bar-05/';
const dir = await mkdtemp(join(tmpdir(), 'tumble-posters-'));
await build({
  entryPoints: [here + 'posters.ts'],
  bundle: true,
  format: 'iife',
  outfile: join(dir, 'posters.js'),
  logLevel: 'warning',
});
await writeFile(
  join(dir, 'index.html'),
  '<!doctype html><body style="margin:0"><script src="posters.js"></script>',
);
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 720, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto('file://' + join(dir, 'index.html'));
  await page.waitForFunction(() => window.posters, null, { timeout: 60000 });
  const posters = await page.evaluate(() => window.posters);
  for (const [name, url] of Object.entries(posters)) {
    const png = Buffer.from(url.split(',')[1], 'base64');
    const info = await sharp(png)
      .webp({ quality: 82, alphaQuality: 90, effort: 6 })
      .toFile(out + name + '.webp');
    console.log(name + '.webp', info.size, 'bytes');
  }
} finally {
  await browser.close();
}
