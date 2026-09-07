import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  localStorage.setItem('ftt:consent', 'rejected');
  window.__metrics = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__metrics.cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
});
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: 200000,
  uploadThroughput: 100000,
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto('http://localhost:4323/');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
const metrics = await page.evaluate(() => ({
  ...window.__metrics,
  resources: performance
    .getEntriesByType('resource')
    .map((e) => ({ name: e.name.split('/').pop(), bytes: e.transferSize })),
  viewport: innerWidth,
}));
await mkdir('docs/visual-checks', { recursive: true });
await writeFile('docs/visual-checks/performance.json', JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics));
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
for (const [name, url] of [
  ['service', '/services/websites/'],
  ['questionnaire', '/start/?service=websites'],
]) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://localhost:4323' + url);
  if (name === 'questionnaire')
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.screenshot({ path: `docs/visual-checks/${name}-desktop.png`, fullPage: true });
}
await browser.close();
