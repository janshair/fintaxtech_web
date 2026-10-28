import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.env.PREVIEW_ORIGIN || 'http://localhost:4324';
const out = process.env.JUICE_REPORT_DIR || 'docs/juice-bar-05-enhancement';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ['--remote-debugging-port=9225'] });
try {
  const result = await lighthouse(
    origin + '/templates/website/3d/juice-bar-05/?name=SeJuice&area=Dundee&ref=L-TEST',
    {
      port: 9225,
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
    },
  );
  const l = result.lhr;
  await writeFile(out + '/lighthouse.json', JSON.stringify(l, null, 2));
  const summary = {
    performance: l.categories.performance.score * 100,
    accessibility: l.categories.accessibility.score * 100,
    lcpMs: l.audits['largest-contentful-paint'].numericValue,
    cls: l.audits['cumulative-layout-shift'].numericValue,
    fcpMs: l.audits['first-contentful-paint'].numericValue,
  };
  await writeFile(out + '/lighthouse-summary.json', JSON.stringify(summary, null, 2));
  console.log(summary);
  assert(summary.performance >= 85);
  assert(summary.accessibility >= 95);
  assert(summary.lcpMs < 2500);
  assert(summary.cls < 0.05);
} finally {
  await browser.close();
}
