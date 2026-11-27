// Renders public/templates/website/3d/kitchens-13/{style-*,layers}.webp and
// _parts/drawing.json from the scene code.
// Run: node src/pages/templates/website/3d/kitchens-13/_checks/posters.mjs
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const out = 'public/templates/website/3d/kitchens-13/';
const dir = await mkdtemp(join(tmpdir(), 'kitchen-posters-'));
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
  args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'],
});
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 760 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto('file://' + join(dir, 'index.html'));
  await page.waitForFunction(() => window.result, null, { timeout: 60000 });
  const { posters, drawing } = await page.evaluate(() => window.result);
  for (const [name, url] of Object.entries(posters)) {
    const png = Buffer.from(url.split(',')[1], 'base64');
    const info = await sharp(png)
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toFile(out + name + '.webp');
    console.log(name + '.webp', info.size, 'bytes');
  }
  const json = JSON.stringify(drawing);
  await writeFile(here + '../_parts/drawing.json', json + '\n');
  console.log('drawing.json', drawing.paths.length, 'paths', json.length, 'bytes');
} finally {
  await browser.close();
}
