import { test, expect } from '@playwright/test';

test('수익 정산 페이지 로딩', async ({ page }) => {
  await page.goto('/ko/admin/profit');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('수익 정산 /en 로케일', async ({ page }) => {
  await page.goto('/en/admin/profit');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});
