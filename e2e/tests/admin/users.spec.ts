import { test, expect } from '@playwright/test';

test('회원 목록 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/users/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('회원 목록 — 테이블 표시', async ({ page }) => {
  await page.goto('/ko/admin/users/list');
  await page.waitForLoadState('networkidle');
  // 최소 1개 계정(admin)이 있으므로 테이블 존재 확인
  await expect(page.locator('table').first()).toBeVisible({ timeout: 8000 });
});

test('회원 목록 /en 로케일', async ({ page }) => {
  await page.goto('/en/admin/users/list');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('회원 목록 API 인증 확인 (미인증 → 401)', async ({ page }) => {
  // 쿠키 없이 직접 API 요청
  const resp = await page.request.get('/api/admin/users/list', {
    headers: { cookie: '' },
  });
  expect(resp.status()).toBe(401);
});
