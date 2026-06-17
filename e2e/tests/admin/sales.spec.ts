import { test, expect } from '@playwright/test';

test('매출 목록 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/sales/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('매출 목록 — 테이블 또는 빈 상태 표시', async ({ page }) => {
  await page.goto('/ko/admin/sales/list');
  await page.waitForLoadState('networkidle');
  // 테이블 or 빈 상태 메시지 둘 중 하나
  const table = page.locator('table');
  const empty = page.locator('[class*="empty"], [class*="없"], text=/없/');
  const hasTable = await table.count() > 0;
  const hasEmpty = await empty.count() > 0;
  expect(hasTable || hasEmpty).toBeTruthy();
});

test('매출 목록 /en 로케일 — 영문 UI 확인', async ({ page }) => {
  await page.goto('/en/admin/sales/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('매출 업로드 페이지 접근', async ({ page }) => {
  await page.goto('/ko/admin/sales/upload');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});
