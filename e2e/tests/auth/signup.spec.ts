// e2e/tests/auth/signup.spec.ts
// 회원가입 → 어드민 유저목록 노출 여부 E2E 검증
import { test, expect } from '@playwright/test';

const ts = Date.now().toString().slice(-6);
const TEST_USER = {
  username: `e2e${ts}`,
  email: `e2e${ts}@test.local`,
  password: 'Test4621!@',
  name: `E2E테스터${ts}`,
};

// serial: 1번 완료 후 2번 실행 보장
test.describe.serial('회원가입 → 어드민 유저목록 노출 E2E', () => {

  // ─── 1. 회원가입 (인증 없이) ────────────────────────────────────────
  test('1) 신규 회원가입 — 성공 후 로그인 페이지 이동', async ({ browser }) => {
    // 프로젝트 레벨 admin storageState 우회 → 새 컨텍스트
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();

    await page.goto('/ko/auth/signup');
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // 폼 입력
    await page.locator('#username').fill(TEST_USER.username);
    await page.locator('#email').fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.locator('#password2').fill(TEST_USER.password);
    await page.locator('#name').fill(TEST_USER.name);

    // 약관 동의 체크박스 2개
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // 회원가입 버튼 클릭
    await page.getByRole('button', { name: /회원가입/i }).click();

    // 성공 시 로그인 페이지로 이동
    await page.waitForURL(/\/auth\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/auth\/login/);

    await page.screenshot({
      path: 'e2e/screenshots/signup-success.png',
      fullPage: false,
    });

    await ctx.close();
  });

  // ─── 2. API 직접 확인 — DB에 유저가 생성되었는지 ────────────────────
  test('2) 회원가입 API 응답 — DB 생성 확인', async ({ page }) => {
    // 이미 가입된 username 으로 중복 가입 시도 → USERNAME_TAKEN 이면 DB에 존재
    const res = await page.request.post('/api/auth/signup', {
      data: {
        username: TEST_USER.username,
        email: `dup-${TEST_USER.email}`,
        password: TEST_USER.password,
        name: TEST_USER.name,
        agreeTerms: true,
        agreePrivacy: true,
      },
    });
    const body = await res.json() as { ok: boolean; code?: string };
    // USERNAME_TAKEN → DB에 해당 username 유저가 실제 존재함을 증명
    expect(body.ok).toBe(false);
    expect(body.code).toBe('USERNAME_TAKEN');
  });

  // ─── 3. 어드민 유저목록 API — 신규 가입자 포함 여부 ─────────────────
  test('3) 어드민 유저목록 API — 신규 가입자 포함 여부', async ({ page }) => {
    const res = await page.request.get('/api/admin/users/list?page=1&pageSize=100');
    expect(res.ok()).toBe(true);

    const body = await res.json() as {
      ok: boolean;
      data: Array<{ username: string; email: string }>;
      total: number;
    };
    expect(body.ok).toBe(true);

    const found = body.data.some((u) => u.username === TEST_USER.username);

    // 현재 버그 재현: ReferralEdge 없으면 목록에 미노출
    // 이 단언이 실패하면 → 신규 가입자가 목록에 없는 버그 확인됨
    expect(
      found,
      `신규 가입자 "${TEST_USER.username}"가 어드민 유저목록 API 응답에 없음 (total: ${body.total})`,
    ).toBe(true);
  });

  // ─── 4. 어드민 유저목록 UI — 신규 가입자 행 표시 여부 ───────────────
  test('4) 어드민 유저목록 UI — 신규 가입자 행 표시', async ({ page }) => {
    await page.goto('/ko/admin/users/list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'e2e/screenshots/admin-users-list.png',
      fullPage: true,
    });

    const userCell = page.getByRole('cell', { name: TEST_USER.username, exact: true });
    await expect(
      userCell,
      `신규 가입자 "${TEST_USER.username}"가 어드민 유저목록 UI 테이블에 없음`,
    ).toBeVisible({ timeout: 5000 });
  });
});
