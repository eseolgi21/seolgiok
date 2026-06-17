import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('안내 페이지 /ko/about 로딩', async ({ page }) => {
  await page.goto('/ko/about');
  await expect(page).toHaveURL(/\/about/);
  await expect(page.locator('body')).toBeVisible();
});

test('안내 페이지 /en/about 로딩', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page).toHaveURL(/\/about/);
  await expect(page.locator('body')).toBeVisible();
});
