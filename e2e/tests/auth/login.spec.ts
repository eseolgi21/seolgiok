import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('올바른 자격증명으로 로그인 성공 → 홈 이동', async ({ page }) => {
  // next 파라미터 없이 로그인하면 클라이언트 기본값 "/" (홈)으로 이동
  await page.goto('/ko/auth/login');
  await page.getByPlaceholder(/아이디 또는 이메일/).fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder(/비밀번호 입력/).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /로그인/i }).click();
  await page.waitForURL(/\/ko$/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/ko$/);
});

test('next 파라미터로 로그인 후 admin 이동', async ({ page }) => {
  await page.goto('/ko/auth/login?next=/ko/admin/dashboard');
  await page.getByPlaceholder(/아이디 또는 이메일/).fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder(/비밀번호 입력/).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /로그인/i }).click();
  // next=/ko/admin/dashboard 이므로 admin으로 이동
  await page.waitForURL(/\/admin/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/admin/);
});

test('틀린 비밀번호 — 로그인 페이지 유지', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByPlaceholder(/아이디 또는 이메일/).fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder(/비밀번호 입력/).fill('WrongPassword!999');
  await page.getByRole('button', { name: /로그인/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
});

test('존재하지 않는 계정 — 로그인 실패', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByPlaceholder(/아이디 또는 이메일/).fill('nobody@nowhere.com');
  await page.getByPlaceholder(/비밀번호 입력/).fill('WrongPassword!999');
  await page.getByRole('button', { name: /로그인/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
});

test('빈 폼 제출 — 로그인 페이지 유지', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByRole('button', { name: /로그인/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('미인증 /ko/admin 접근 → 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/ko/admin');
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
});

test('미인증 /en/admin 접근 → 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/en/admin');
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
});
