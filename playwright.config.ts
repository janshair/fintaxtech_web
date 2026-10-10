import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
const development = process.env.BRIEF_BROWSER_SERVER === 'dev';
export default defineConfig({
  testDir: 'tests/browser',
  timeout: 60000,
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://localhost:4323', trace: 'retain-on-failure' },
  webServer: {
    // GitHub Pages serves directory index files with or without a trailing slash.
    // Override only preview routing; keep the production build configuration unchanged.
    command: development
      ? `node --import ./tests/mocks/slack-fetch.mjs --input-type=module -e "import { dev } from 'astro'; await dev({ server: { host: '127.0.0.1', port: 4323 }, vite: { cacheDir: '.astro/browser-test-vite' } });"`
      : `node node_modules/astro/bin/astro.mjs build && node --import ./tests/mocks/slack-fetch.mjs scripts/preview.mjs --host 127.0.0.1 --port 4323 --trailing-slash ignore`,
    env: {
      SLACK_WEBHOOK: 'https://hooks.slack.com/services/TEST_ONLY',
      PUBLIC_SLACK_WEBHOOK: '',
      BRIEF_MOCK_CALLS_FILE: resolve('test-results/slack-http-mock.jsonl'),
    },
    url: 'http://localhost:4323',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
