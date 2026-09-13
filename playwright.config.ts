import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  timeout: 60000,
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://localhost:4323', trace: 'retain-on-failure' },
  webServer: {
    // GitHub Pages serves directory index files with or without a trailing slash.
    // Override only preview routing; keep the production build configuration unchanged.
    command: `pnpm build && node --input-type=module -e "import { preview } from 'astro'; await preview({ trailingSlash: 'ignore', server: { host: '127.0.0.1', port: 4323 } });"`,
    url: 'http://localhost:4323',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
