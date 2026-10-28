// Real final-stage scroll captures: requested names, 375×812 and 1440×1000.
import { chromium, firefox, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const out = 'docs/juice-bar-05-sleeve-names';
await mkdir(out, { recursive: true });
const names = [
  ['jay', "Jay's Juice & Co"],
  ['sejuice', 'SeJuice'],
  ['highland', 'The Highland Morning Juice and Coffee Company'],
];
const results = {};
for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [375, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 375 ? 812 : 1000 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const [slug, name] of names) {
        await page.goto(
          origin +
            '/templates/website/3d/juice-bar-05/?' +
            new URLSearchParams({ name, area: 'Dundee', ref: 'L-TEST' }),
        );
        await page.waitForFunction(() => document.documentElement.dataset.three === 'live');
        for (const mode of ['story', 'coffee']) {
          const track = mode === 'story' ? '[data-story-track]' : '[data-coffee-track]';
          const y = await page.evaluate((track) => {
            const t = document.querySelector(track),
              frame = t.querySelector('[data-scene]');
            const bar = document.querySelector('.mobile-contact').getBoundingClientRect().height;
            return Math.ceil(
              t.getBoundingClientRect().top +
                scrollY -
                (innerHeight - bar - frame.getBoundingClientRect().height - 24) +
                620,
            );
          }, track);
          await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
          await page.waitForFunction(
            ({ track, mode, name }) =>
              Number(document.querySelector(track).dataset.progress) === 1 &&
              document.querySelector(`[data-scene=${mode}]`).dataset.live === 'true' &&
              document.querySelector('canvas')?.dataset.labelScene === mode &&
              document.querySelector('canvas')?.dataset.label === name,
            { track, mode, name },
          );
          await page.waitForTimeout(650);
          const state = await page.locator('canvas').evaluate((canvas) => ({
            name: canvas.dataset.label,
            lines: JSON.parse(canvas.dataset.labelLines),
            font: Number(canvas.dataset.labelFont),
            widths: JSON.parse(canvas.dataset.labelWidths),
            maxWidth: Number(canvas.dataset.labelMaxWidth),
            truncated: canvas.dataset.labelTruncated === 'true',
            arc: Number(canvas.dataset.labelArc),
            centre: Number(canvas.dataset.labelCentreX),
            sceneWidth: canvas.clientWidth,
            yaw: Number(canvas.dataset.finalYaw),
            lidOn: canvas.dataset.lidOn === 'true',
            looseObjects: Number(canvas.dataset.looseObjects),
          }));
          assert.equal(state.name, name);
          assert(state.lines.length >= 1 && state.lines.length <= 2);
          assert(state.font >= 128 && state.font <= 176);
          assert(state.widths.every((w) => w <= state.maxWidth));
          assert.equal(state.arc, 120);
          assert(
            Math.abs(state.centre - state.sceneWidth / 2) <= 0.51,
            'label centre must face the camera',
          );
          assert.equal(state.yaw, 0);
          assert.equal(state.looseObjects, 0);
          if (mode === 'story') assert(state.lidOn);
          const displayed = state.lines.join(' ').replace(/…$/u, '').trim();
          assert(name === displayed || name.startsWith(displayed + ' '), 'never break a word');
          if (slug === 'highland') {
            assert(state.truncated);
            assert(state.lines.at(-1).endsWith('…'));
          } else {
            assert(!state.truncated);
            assert.equal(displayed, name);
          }
          if (slug === 'sejuice') assert.equal(state.lines.length, 1);
          const stem = `${out}/${engine}-${width}-${slug}-${mode}`;
          const clip = await page.locator(`[data-scene=${mode}]`).boundingBox();
          const scene = await page.screenshot({ clip });
          await writeFile(stem + '.png', scene);
          const metadata = await sharp(scene).metadata();
          const rect = {
            left: Math.floor(metadata.width * 0.16),
            top: Math.floor(metadata.height * (mode === 'coffee' ? 0.5 : 0.56)),
            width: Math.floor(metadata.width * 0.68),
            height: Math.floor(metadata.height * 0.33),
          };
          const crop = await sharp(scene).extract(rect).png().toBuffer();
          await sharp(crop)
            .resize({ width: 1100 })
            .png()
            .toFile(stem + '-name-zoom.png');
          await page.waitForTimeout(160);
          const next = await page.screenshot({ clip });
          const a = await sharp(crop).raw().toBuffer(),
            b = await sharp(next).extract(rect).raw().toBuffer();
          let changed = 0;
          for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) changed++;
          // Steam animates above the cup. The sleeve itself must stay stable.
          assert.equal(changed, 0, 'final sleeve flicker');
          results[`${engine}-${width}-${slug}-${mode}`] = { ...state, changedChannels: changed };
        }
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(engine, 'passed');
  } finally {
    await browser.close();
  }
}
await writeFile(out + '/report.json', JSON.stringify(results, null, 2));
for (const width of [375, 1440]) {
  const tiles = [];
  for (const [row, mode] of ['story', 'coffee'].entries())
    for (const [col, [slug]] of names.entries()) {
      const tile = await sharp(`${out}/chromium-${width}-${slug}-${mode}-name-zoom.png`)
        .resize({ width: 440, height: 210, fit: 'contain', background: '#faf5e9' })
        .png()
        .toBuffer();
      tiles.push({ input: tile, left: col * 440, top: row * 210 });
    }
  await sharp({ create: { width: 1320, height: 420, channels: 3, background: '#faf5e9' } })
    .composite(tiles)
    .png()
    .toFile(`${out}/names-${width}.png`);
}
