import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test.local') });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const IS_REMOTE = BASE_URL.startsWith('https://');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: IS_REMOTE ? 1 : 0,
  workers: IS_REMOTE ? 4 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\/public\/.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
    },
  ],
  // 원격 URL이면 webServer 생략 (이미 떠 있음)
  ...(IS_REMOTE ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
    },
  }),
});
