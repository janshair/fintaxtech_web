import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4321';
const out = 'public/templates/website/3d/juice-bar-05';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
  await page.goto(origin + '/templates/website/3d/juice-bar-05/?name=Daybreak%20Juice%20Club');
  await page.waitForSelector('[data-live=true] canvas', { timeout: 30000 });
  for (const [file, mode, progress, width, height] of [
    ['hero', 'hero', 1, 900, 900],
    ['stage-1', 'story', 0.16, 900, 700],
    ['stage-2', 'story', 0.52, 900, 700],
    ['stage-3', 'story', 1, 900, 700],
    ['coffee', 'coffee', 1, 800, 650],
  ]) {
    const data = await page.evaluate(
      ({ mode, progress, width, height }) => {
        dispatchEvent(
          new CustomEvent('juice-capture', {
            detail: { mode, progress, width, height, poster: true },
          }),
        );
        return document.querySelector('canvas').toDataURL('image/png').split(',')[1];
      },
      { mode, progress, width, height },
    );
    const buffer = await sharp(Buffer.from(data, 'base64')).webp({ quality: 85 }).toBuffer();
    await writeFile(`${out}/${file}.webp`, buffer);
    console.log(file, buffer.length);
  }
  await page.reload();
  await page.waitForSelector('[data-live=true] canvas');
  await page.waitForTimeout(600);
  await sharp(await page.screenshot())
    .webp({ quality: 85 })
    .toFile(out + '/preview.webp');
  console.log('preview saved');
} finally {
  await browser.close();
}
