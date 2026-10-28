// Actual viewport captures and geometry/typography checks, including transitions.
import { chromium, firefox, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const out = 'docs/juice-bar-05-labels';
await mkdir(out, { recursive: true });
const report = {};
for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(
        origin + '/templates/website/3d/juice-bar-05/?name=SeJuice&area=Dundee&ref=L-TEST',
      );
      await page.waitForFunction(() => document.documentElement.dataset.three === 'live');
      const states = [];
      for (const mode of ['story', 'coffee']) {
        const track = mode === 'story' ? '[data-story-track]' : '[data-coffee-track]';
        for (const progress of [0.15, 0.331, 0.334, 0.5, 0.665, 0.668, 0.85, 1]) {
          const y = await page.evaluate(
            ({ track, progress }) => {
              const t = document.querySelector(track),
                f = t.querySelector('[data-scene]'),
                bar = document.querySelector('.mobile-contact').getBoundingClientRect().height;
              return Math.ceil(
                t.getBoundingClientRect().top +
                  scrollY -
                  (innerHeight - bar - f.getBoundingClientRect().height - 24) +
                  620 * progress,
              );
            },
            { track, progress },
          );
          await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
          await page.waitForFunction(
            ({ track, progress }) =>
              Math.abs(Number(document.querySelector(track).dataset.progress) - progress) < 0.003,
            { track, progress },
          );
          await page.waitForTimeout(280);
          const state = await page.evaluate(
            ({ track, mode }) => {
              const canvas = document.querySelector('canvas');
              const steps = Array.from(
                document.querySelector(track).querySelectorAll('[data-story-step]'),
              ).map((e) => {
                const s = getComputedStyle(e);
                return { padding: s.padding, width: e.getBoundingClientRect().width };
              });
              return {
                mode,
                progress: document.querySelector(track).dataset.progress,
                texture: canvas.dataset.labelTexture,
                anisotropy: canvas.dataset.anisotropy,
                clearance: canvas.dataset[mode === 'story' ? 'juiceClearance' : 'coffeeClearance'],
                name: canvas.dataset.label,
                bufferWidth: canvas.width,
                cssWidth: canvas.clientWidth,
                steps,
              };
            },
            { track, mode },
          );
          assert.equal(state.texture, '2048x512');
          assert.equal(state.name, 'SeJuice');
          assert(Number(state.clearance) >= 0.01799);
          assert.equal(new Set(state.steps.map((s) => s.padding)).size, 1);
          assert(state.bufferWidth / state.cssWidth <= (width < 768 ? 1.5 : 2) + 0.01);
          states.push(state);
          if ([0.15, 0.5, 0.85, 1].includes(progress)) {
            const file = `${out}/${engine}-${width}-${mode}-${progress}.png`;
            const buffer = await page.screenshot({
              clip: await page.locator(`[data-scene=${mode}]`).boundingBox(),
            });
            await writeFile(file, buffer);
            if (progress === 1) {
              const metadata = await sharp(buffer).metadata();
              const crop = await sharp(buffer)
                .extract({
                  left: Math.floor(metadata.width * 0.24),
                  top: Math.floor(metadata.height * (mode === 'coffee' ? 0.52 : 0.59)),
                  width: Math.floor(metadata.width * 0.52),
                  height: Math.floor(metadata.height * 0.28),
                })
                .resize({ width: 1000 })
                .png()
                .toBuffer();
              await writeFile(`${out}/${engine}-${width}-${mode}-name-zoom.png`, crop);
            }
          }
        }
      }
      const heading = await page.locator('#coffee-title').evaluate((e) => {
        const ancestors = [];
        for (let n = e; n; n = n.parentElement) {
          const s = getComputedStyle(n);
          ancestors.push({ tag: n.tagName, transform: s.transform, willChange: s.willChange });
        }
        return ancestors;
      });
      assert(heading.every((e) => e.transform === 'none' && e.willChange === 'auto'));
      if (width === 1440) {
        await page.locator('#coffee-title').scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({
          clip: await page.locator('#coffee .section-heading').boundingBox(),
          path: `${out}/${engine}-1440-coffee-heading.png`,
        });
      }
      await page.locator('[data-edit]').click();
      await page.locator('#business-name').fill('Bright Cup');
      await page.getByRole('button', { name: 'Preview my website' }).click();
      await page.waitForFunction(
        () => document.querySelector('canvas')?.dataset.label === 'Bright Cup',
      );
      report[engine + '-' + width] = { states, heading, redrawOnNameChange: true };
      await context.close();
    }
    console.log(engine, 'passed');
  } finally {
    await browser.close();
  }
}
await writeFile(out + '/report.json', JSON.stringify(report, null, 2));
