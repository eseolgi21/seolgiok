// e2e/tests/auth/signup.spec.ts
// 회원가입 → 어드민 유저목록 노출 여부 E2E 검증
import { test, expect } from '@playwright/test';

const ts = Date.now().toString().slice(-6);
const TEST_USER = {
  email: `e2e${ts}@test.local`,
  password: 'Test4621!@',
};

// serial: 1번 완료 후 2번 실행 보장
test.describe.serial('회원가입 → 어드민 유저목록 노출 E2E', () => {
  // 서버가 자동생성하는 username(TopPart.tsx/MiddlePart.tsx에는 입력 필드 자체가 없음,
  // src/app/api/(site)/auth/signup/route.ts generateUsername() 참고) — 3)에서 조회 후 4)에서 사용.
  let createdUsername = '';

  // ─── 1. 회원가입 (인증 없이) ────────────────────────────────────────
  test('1) 신규 회원가입 — 성공 후 로그인 페이지 이동', async ({ browser }) => {
    // 프로젝트 레벨 admin storageState 우회 → 새 컨텍스트
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();

    await page.goto('/ko/auth/signup');
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // 폼 입력 — 실제 폼(TopPart.tsx/MiddlePart.tsx)에는 #email/#password/#password2만 존재.
    // username/name은 서버가 자동 생성하므로 입력 필드 자체가 UI에 없다.
    await page.locator('#email').fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.locator('#password2').fill(TEST_USER.password);

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
  test('2) 회원가입 API 응답 — 동일 이메일 재가입 시도 → EMAIL_TAKEN(DB 생성 확인)', async ({ page }) => {
    // username은 서버 자동생성이라 중복검사 대상이 아니다(provision-user.ts 주석 참고,
    // 실제 라우트도 email로만 dedup함). 동일 이메일로 재가입 시도해 EMAIL_TAKEN(409)이 나오면
    // 1)에서 생성된 유저가 DB에 실제 존재함을 증명한다.
    const res = await page.request.post('/api/auth/signup', {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
        agreeTerms: true,
        agreePrivacy: true,
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json() as { ok: boolean; code?: string };
    expect(body.ok).toBe(false);
    expect(body.code).toBe('EMAIL_TAKEN');
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

    // username은 서버 자동생성이라 사전에 알 수 없으므로 email로 조회 후 실제 username을 확보한다.
    const found = body.data.find((u) => u.email === TEST_USER.email);

    expect(
      found,
      `신규 가입자 이메일 "${TEST_USER.email}"가 어드민 유저목록 API 응답에 없음 (total: ${body.total})`,
    ).toBeTruthy();

    createdUsername = found!.username;
  });

  // ─── 4. 어드민 유저목록 UI — 신규 가입자 행 표시 여부 ───────────────
  test('4) 어드민 유저목록 UI — 신규 가입자 행 표시', async ({ page }) => {
    expect(createdUsername, '3)에서 확보한 username이 비어있음').toBeTruthy();

    await page.goto('/ko/admin/users/list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'e2e/screenshots/admin-users-list.png',
      fullPage: true,
    });

    const userCell = page.getByRole('cell', { name: createdUsername, exact: true });
    await expect(
      userCell,
      `신규 가입자 "${createdUsername}"가 어드민 유저목록 UI 테이블에 없음`,
    ).toBeVisible({ timeout: 5000 });
  });
});
