import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const [url = 'http://localhost:4325', label = 'local-after'] = process.argv.slice(2);
await mkdir('docs/seo-audit', { recursive: true });
for (const desktop of [true, false]) {
  const chrome = await chromium.launch({ args: ['--remote-debugging-port=9223'] });
  try {
    const result = await lighthouse(url, {
      port: 9223,
      onlyCategories: ['seo'],
      output: 'json',
      ...(desktop
        ? {
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              width: 1440,
              height: 900,
              deviceScaleFactor: 1,
              disabled: false,
            },
          }
        : {}),
    });
    const lhr = result.lhr;
    const report = {
      url: lhr.finalDisplayedUrl,
      fetchTime: lhr.fetchTime,
      lighthouseVersion: lhr.lighthouseVersion,
      formFactor: lhr.configSettings.formFactor,
      score: lhr.categories.seo.score,
      audits: Object.fromEntries(
        Object.entries(lhr.audits).map(([id, a]) => [
          id,
          {
            title: a.title,
            score: a.score,
            displayValue: a.displayValue,
            explanation: a.explanation,
            details: a.score === 0 ? a.details : undefined,
          },
        ]),
      ),
    };
    await writeFile(
      `docs/seo-audit/${label}-${desktop ? 'desktop' : 'mobile'}.json`,
      JSON.stringify(report, null, 2),
    );
    console.log(
      label,
      desktop ? 'desktop' : 'mobile',
      report.score,
      Object.entries(report.audits).filter(([, a]) => a.score === 0),
    );
  } finally {
    await chrome.close();
  }
}
