import { test, expect } from '@playwright/test';

test('매입 목록 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/purchase/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('매입 목록 — 에러 없이 렌더링', async ({ page }) => {
  await page.goto('/ko/admin/purchase/list');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
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

test('매입 목록 API 인증 확인 (미인증 → 401)', async ({ page }) => {
  const resp = await page.request.get('/api/admin/accounting/purchase/list', {
    headers: { cookie: '' },
  });
  expect(resp.status()).toBe(401);
});
