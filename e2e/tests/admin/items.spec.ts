import { test, expect } from '@playwright/test';

test('품목 분류 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/items');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('품목 분류 /en 로케일', async ({ page }) => {
  await page.goto('/en/admin/items');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('품목 API 미인증 → 401', async ({ page }) => {
  // cookie: '' 로 세션 쿠키 강제 제거
  const resp = await page.request.get('/api/admin/accounting/items', {
    headers: { cookie: '' },
  });
  expect(resp.status()).toBe(401);
});
