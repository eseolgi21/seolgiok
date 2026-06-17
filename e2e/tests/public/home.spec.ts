import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const LOCALES = ['ko', 'en', 'ja', 'zh', 'vi'] as const;

for (const locale of LOCALES) {
  test(`홈페이지 /${locale} 로딩 및 핵심 UI`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}`));
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });
}

test('홈 → 메뉴 링크 존재', async ({ page }) => {
  await page.goto('/ko');
  await expect(page.locator('a[href*="/menu"]').first()).toBeVisible();
});

test('홈 → 로그인 링크 존재', async ({ page }) => {
  await page.goto('/ko');
  await expect(page.locator('a[href*="/auth/login"]').first()).toBeVisible();
});

test('홈 → 회원가입 링크 존재', async ({ page }) => {
  await page.goto('/ko');
  await expect(page.locator('a[href*="/auth/signup"]').first()).toBeVisible();
});
