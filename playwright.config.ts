import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const jsonReport =
  process.env.PLAYWRIGHT_JSON_REPORT ??
  path.join(process.cwd(), 'output', 'playwright-results.json');

const htmlReportDir =
  process.env.PLAYWRIGHT_HTML_REPORT_DIR ??
  path.join(process.cwd(), 'playwright-report');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 3600000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['json', { outputFile: jsonReport }],
    ['html', { outputFolder: htmlReportDir, open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    headless: !!process.env.CI,
    channel: 'chrome',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 90000,
    actionTimeout: 30000,
  },
  projects: [
    { name: 'chromium' },
  ],
});
