import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByLabel(/이메일|email/i).fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel(/비밀번호|password/i).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /로그인|sign in|login/i }).click();
  await page.waitForURL('**/admin**');
  await expect(page).toHaveURL(/\/admin/);
  await page.context().storageState({ path: authFile });
});
