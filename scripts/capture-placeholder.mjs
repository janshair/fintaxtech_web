// Captures the gallery preview for the placeholder template from a running server:
// PREVIEW_ORIGIN=http://localhost:4321 node scripts/capture-placeholder.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4321';
const out = 'public/templates/website/placeholder/placeholder-10/preview.webp';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(origin + '/templates/website/placeholder/placeholder-10/');
  await page.evaluate(() => document.fonts.ready);
  // Entrances finish before the capture, so the preview shows the settled page.
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()));
  const info = await sharp(await page.screenshot())
    .webp({ quality: 85 })
    .toFile(out);
  console.log(out, info.width, info.height, info.size);
} finally {
  await browser.close();
}
