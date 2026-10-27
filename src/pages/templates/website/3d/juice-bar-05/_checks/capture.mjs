// Run from the repository root. Uses the actual shared WebGL renderer.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const assets = 'public/templates/website/3d/juice-bar-05/';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(origin + '/templates/website/3d/juice-bar-05/?name=Daybreak%20Juice%20Club');
  await page.waitForSelector('[data-live=true] canvas');
  for (const [file, mode, progress, width, height] of [
    ['hero', 'hero', 1, 900, 900],
    ['stage-1', 'story', 0.18, 900, 700],
    ['stage-2', 'story', 0.53, 900, 700],
    ['stage-3', 'story', 1, 900, 700],
    ['coffee-stage-1', 'coffee', 0.19, 900, 700],
    ['coffee-stage-2', 'coffee', 0.53, 900, 700],
    ['coffee-stage-3', 'coffee', 1, 900, 700],
    ['coffee', 'coffee', 1, 800, 650],
  ]) {
    const png = await page.evaluate(
      (detail) => {
        dispatchEvent(new CustomEvent('juice-capture', { detail: { ...detail, poster: true } }));
        return document.querySelector('canvas').toDataURL().split(',')[1];
      },
      { mode, progress, width, height },
    );
    const buffer = await sharp(Buffer.from(png, 'base64')).webp({ quality: 85 }).toBuffer();
    if (buffer.length > 120_000) throw Error(file + ' poster exceeds 120 KB');
    await writeFile(assets + file + '.webp', buffer);
    console.log(file, buffer.length);
  }
  await page.reload();
  await page.waitForSelector('[data-live=true] canvas');
  await page.waitForTimeout(2400);
  const preview = await sharp(await page.screenshot())
    .webp({ quality: 85 })
    .toBuffer();
  if (preview.length >= 200_000) throw Error('Preview exceeds 200 KB');
  await writeFile(assets + 'preview.webp', preview);
} finally {
  await browser.close();
}
