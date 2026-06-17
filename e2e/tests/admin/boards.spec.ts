import { test, expect } from '@playwright/test';

// ── 공지 게시판 ──────────────────────────────────────────

test('공지 게시판 목록 로딩', async ({ page }) => {
  await page.goto('/ko/admin/boards/announcements');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('공지 게시판 /en 로케일', async ({ page }) => {
  await page.goto('/en/admin/boards/announcements');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('공지 게시판 글쓰기 페이지 접근', async ({ page }) => {
  await page.goto('/ko/admin/boards/announcements/write');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

// ── 이벤트 게시판 ─────────────────────────────────────────

test('이벤트 게시판 목록 로딩', async ({ page }) => {
  await page.goto('/ko/admin/boards/events');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('이벤트 게시판 /en 로케일', async ({ page }) => {
  await page.goto('/en/admin/boards/events');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('이벤트 게시판 글쓰기 페이지 접근', async ({ page }) => {
  await page.goto('/ko/admin/boards/events/write');
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('body')).toBeVisible();
});

// ── 보안 확인 — API 인증 없이 PATCH/DELETE 거부 ──────────

test('미인증 공지 PATCH → 401', async ({ page }) => {
  const resp = await page.request.patch('/api/admin/boards/announcements', {
    data: { id: 'fake', title: 'test' },
  });
  expect(resp.status()).toBe(401);
});

test('미인증 공지 DELETE → 401', async ({ page }) => {
  const resp = await page.request.delete('/api/admin/boards/announcements?id=fake');
  expect(resp.status()).toBe(401);
});

test('미인증 이벤트 PATCH → 401', async ({ page }) => {
  const resp = await page.request.patch('/api/admin/boards/events', {
    data: { id: 'fake', title: 'test' },
  });
  expect(resp.status()).toBe(401);
});

test('미인증 이벤트 DELETE → 401', async ({ page }) => {
  const resp = await page.request.delete('/api/admin/boards/events?id=fake');
  expect(resp.status()).toBe(401);
});
