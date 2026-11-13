// Captures a template's 1200×900 gallery preview from a running server, e.g.
// PREVIEW_ORIGIN=http://localhost:4321 node scripts/capture-template-preview.mjs landing-12
// Supports the placeholder and landing templates, whose previews show the first screen.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
const routes = {
  'placeholder-11': '/templates/website/placeholder/placeholder-11/',
  'landing-12': '/templates/website/landing/landing-12/',
};
const id = process.argv[2];
if (!routes[id])
  throw new Error(`Usage: capture-template-preview.mjs <${Object.keys(routes).join('|')}>`);
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4321';
const out = `public${routes[id]}preview.webp`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(origin + routes[id]);
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
