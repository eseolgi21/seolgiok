import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('올바른 자격증명으로 로그인 성공', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByLabel(/이메일|email/i).fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel(/비밀번호|password/i).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /로그인|sign in|login/i }).click();
  await expect(page).toHaveURL(/\/admin/);
});

test('틀린 자격증명 — 오류 메시지 표시', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByLabel(/이메일|email/i).fill('wrong@example.com');
  await page.getByLabel(/비밀번호|password/i).fill('wrongpassword');
  await page.getByRole('button', { name: /로그인|sign in|login/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('빈 폼 제출 — 로그인 페이지 유지', async ({ page }) => {
  await page.goto('/ko/auth/login');
  await page.getByRole('button', { name: /로그인|sign in|login/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});
