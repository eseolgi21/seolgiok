import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // 로그인 페이지 접근 (next 파라미터 없이 — 쿼리스트링에 /admin이 포함되면 waitForURL 오작동)
  await page.goto('/ko/auth/login');

  await page.getByPlaceholder(/아이디 또는 이메일/).fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder(/비밀번호 입력/).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /로그인/i }).click();

  // 홈으로 이동할 때까지 대기 (next 없으면 로그인 성공 시 / 로 이동)
  await page.waitForURL('https://seolgiok.com/ko', { timeout: 20000 });

  // 세션 쿠키가 설정된 후 admin으로 이동하여 인증 확인
  await page.goto('/ko/admin/dashboard');
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
