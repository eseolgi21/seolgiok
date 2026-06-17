import { test, expect } from '@playwright/test';

test('대시보드 접근 및 로딩', async ({ page }) => {
  await page.goto('/ko/admin');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('대시보드 → shadcn 사이드바 존재', async ({ page }) => {
  await page.goto('/ko/admin/dashboard');
  await page.waitForLoadState('networkidle');
  // shadcn sidebar: data-slot="sidebar-wrapper" 또는 data-slot="sidebar"
  const sidebar = page.locator('[data-slot="sidebar-wrapper"], [data-slot="sidebar"]');
  await expect(sidebar.first()).toBeVisible({ timeout: 8000 });
});

test('대시보드 /en/admin 로케일 접근', async ({ page }) => {
  await page.goto('/en/admin');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('대시보드 /ja/admin 로케일 접근', async ({ page }) => {
  await page.goto('/ja/admin');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});
