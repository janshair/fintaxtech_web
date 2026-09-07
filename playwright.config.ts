import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  timeout: 60000,
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://localhost:4323', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm build && pnpm exec astro preview --host 127.0.0.1 --port 4323',
    url: 'http://localhost:4323',
    // Keep Astro attached to Playwright instead of auto-detaching in agent environments.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
