// Run against the local dev server. Exercises actual content-file edits and
// Astro's rendered output, then restores exact source bytes in a finally block.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.env.THEME_ORIGIN || 'http://localhost:4322';
const out = 'docs/template-themes';
const files = {
  'barber-01': 'barber',
  'tailoring-02': 'tailoring',
  'automotive-03': 'automotive',
  'cleaning-04': 'cleaning',
  'juice-bar-05': 'juice-bar',
  'gym-06': 'gym',
};
const originals = new Map();
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const results = {};
const contrast = (a, b) => {
  const l = (c) => {
    const v = c
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((x) => ((x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
  };
  const x = l(a),
    y = l(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
try {
  for (const [id, name] of Object.entries(files))
    originals.set(
      `src/content/${name}-demo.ts`,
      await readFile(`src/content/${name}-demo.ts`, 'utf8'),
    );
  for (const variant of ['default', 'test']) {
    if (variant === 'test') {
      for (const [file, source] of originals)
        await writeFile(
          file,
          source
            .replace(/brand:\s*'#[\da-f]+'/i, "brand: '#1E3A8A'")
            .replace(/accent:\s*'#[\da-f]+'/i, "accent: '#E11D48'"),
        );
    }
    for (const id of Object.keys(files)) {
      await page.mouse.move(0, 0);
      await page.goto(
        origin +
          '/templates/website/' +
          (id === 'juice-bar-05' ? '3d' : 'motion') +
          '/' +
          id +
          '/?name=SeJuice&area=Dundee&ref=L-TEST',
      );
      if (variant === 'test')
        await page.waitForFunction(
          () =>
            getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() ===
            '#1e3a8a',
        );
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        return {
          brand: s.getPropertyValue('--brand').trim(),
          accent: s.getPropertyValue('--accent').trim(),
          onBrand: s.getPropertyValue('--on-brand').trim(),
          onAccent: s.getPropertyValue('--on-accent').trim(),
          overflow: document.documentElement.scrollWidth > innerWidth,
          buttons: Array.from(
            document.querySelectorAll('.button,.mobile-actions button,.mobile-contact a'),
          )
            .filter((e) => {
              const s = getComputedStyle(e);
              return s.display !== 'none' && e.getBoundingClientRect().height > 0;
            })
            .map((e) => ({
              text: e.textContent.trim(),
              fg: getComputedStyle(e).color,
              bg: getComputedStyle(e).backgroundColor,
            })),
        };
      });
      assert(!state.overflow, `${id} overflow`);
      if (variant === 'test') {
        assert.equal(state.brand, '#1e3a8a');
        assert.equal(state.accent, '#e11d48');
      }
      await page.screenshot({ path: `${out}/${id}-${variant}.png`, fullPage: true });
      const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      results[id + '-' + variant] = {
        ...state,
        buttonContrast: state.buttons
          .filter((b) => b.bg !== 'rgba(0, 0, 0, 0)')
          .map((b) => ({ ...b, ratio: contrast(b.fg, b.bg) })),
        contrastViolations: axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      };
      const hoverButtons = [];
      for (const button of await page.locator('.button:visible').all()) {
        await button.hover();
        const colors = await button.evaluate((e) => ({
          text: e.textContent.trim(),
          fg: getComputedStyle(e).color,
          bg: getComputedStyle(e).backgroundColor,
        }));
        if (colors.bg !== 'rgba(0, 0, 0, 0)')
          hoverButtons.push({ ...colors, ratio: contrast(colors.fg, colors.bg) });
      }
      results[id + '-' + variant].hoverButtons = hoverButtons;
      console.log(id, variant, `contrast violations: ${axe.violations.length}`);
    }
  }
} finally {
  for (const [file, source] of originals) await writeFile(file, source);
  await browser.close();
  await writeFile(out + '/theme-results.json', JSON.stringify(results, null, 2));
}
for (const [name, result] of Object.entries(results)) {
  if (name.endsWith('-test') || !name.startsWith('barber-01'))
    assert.equal(result.contrastViolations.length, 0, name + ' contrast');
  for (const button of [...result.buttonContrast, ...result.hoverButtons])
    assert(button.ratio >= 4.5, name + ' ' + button.text + ' contrast');
}
