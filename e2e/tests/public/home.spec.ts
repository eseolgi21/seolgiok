import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('홈페이지 /ko 로딩', async ({ page }) => {
  await page.goto('/ko');
  await expect(page).toHaveURL(/\/ko/);
  await expect(page.locator('body')).toBeVisible();
});

test('홈페이지 /en 로딩', async ({ page }) => {
  await page.goto('/en');
  await expect(page).toHaveURL(/\/en/);
  await expect(page.locator('body')).toBeVisible();
});
