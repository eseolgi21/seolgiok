import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('메뉴 페이지 /ko/menu 로딩', async ({ page }) => {
  await page.goto('/ko/menu');
  await expect(page).toHaveURL(/\/menu/);
  await expect(page.locator('body')).toBeVisible();
});

test('메뉴 페이지 /en/menu 로딩', async ({ page }) => {
  await page.goto('/en/menu');
  await expect(page).toHaveURL(/\/menu/);
  await expect(page.locator('body')).toBeVisible();
});

test('메뉴 이미지 로딩 확인', async ({ page }) => {
  await page.goto('/ko/menu');
  // 이미지 엘리먼트가 존재하는지 확인
  const images = page.locator('img');
  await expect(images.first()).toBeVisible();
});
