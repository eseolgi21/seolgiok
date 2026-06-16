import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('미인증 상태에서 /ko/admin 접근 시 로그인 리다이렉트', async ({ page }) => {
  await page.goto('/ko/admin');
  await expect(page).toHaveURL(/\/auth\/login/);
});
