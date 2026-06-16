import { test, expect } from '@playwright/test';

test('관리자 대시보드 접근 (인증 후)', async ({ page }) => {
  await page.goto('/ko/admin');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});
