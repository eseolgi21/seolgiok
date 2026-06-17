import { test, expect } from '@playwright/test';

test('매입 목록 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/purchase/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('매입 목록 — 테이블 또는 빈 상태 표시', async ({ page }) => {
  await page.goto('/ko/admin/purchase/list');
  await page.waitForLoadState('networkidle');
  const table = page.locator('table');
  const hasTable = await table.count() > 0;
  expect(hasTable).toBeTruthy();
});

test('매입 목록 /en 로케일', async ({ page }) => {
  await page.goto('/en/admin/purchase/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('매입 업로드 페이지 접근', async ({ page }) => {
  await page.goto('/ko/admin/purchase/upload');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});
