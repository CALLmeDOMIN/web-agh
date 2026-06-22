import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * Konfiguracja Playwright.
 * Dokumentacja: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI ? [['html'], ['github']] : 'html',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry', // nagraj trace przy ponowieniu (debugowanie)
    screenshot: 'only-on-failure', // screenshot tylko gdy test padnie
    video: 'retain-on-failure', // wideo zachowane tylko dla błędów
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],

  webServer: [
    {
      command: 'npm run start --workspace server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev --workspace client',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
