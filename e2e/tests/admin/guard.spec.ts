import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('미인증 /ko/admin → 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/ko/admin');
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
});

test('미인증 /ko/admin/sales/list → 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/ko/admin/sales/list');
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
});

test('미인증 /ko/admin/users/list → 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/ko/admin/users/list');
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
});

test('미인증 /ko/admin/boards/announcements → 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/ko/admin/boards/announcements');
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
});
