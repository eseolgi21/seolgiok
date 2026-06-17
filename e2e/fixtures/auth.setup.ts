import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // next 파라미터로 로그인 후 admin으로 이동
  await page.goto('/ko/auth/login?next=/ko/admin/dashboard');

  await page.getByPlaceholder(/아이디 또는 이메일/).fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder(/비밀번호 입력/).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /로그인/i }).click();

  await page.waitForURL('**/admin**', { timeout: 20000 });
  await expect(page).toHaveURL(/\/admin/);
  await page.context().storageState({ path: authFile });
});
