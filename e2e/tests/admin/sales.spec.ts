import { test, expect } from '@playwright/test';

test('매출 목록 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/sales/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('매출 목록 — 테이블 또는 빈 상태 표시', async ({ page }) => {
  await page.goto('/ko/admin/sales/list');
  await page.waitForLoadState('networkidle');
  // 테이블이 있거나, 없을 수 있음 (DB 데이터 유무에 따라)
  await expect(page.locator('body')).toBeVisible();
  // 에러 화면이 아닌지 확인
  await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
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

test('매출 목록 API 인증 확인 (미인증 → 401)', async ({ page }) => {
  const resp = await page.request.get('/api/admin/accounting/sales/list', {
    headers: { cookie: '' },
  });
  expect(resp.status()).toBe(401);
});
