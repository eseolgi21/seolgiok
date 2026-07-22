
import { signIn } from "@/lib/auth/auth";
import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getClientIp, isRateLimited, recordAttempt, resetRateLimit } from "@/lib/middleware/rate-limit";

// 브루트포스 방어: 실패한 시도만 카운트한다(성공 로그인은 카운트하지 않음 → 정상 사용자 영향 없음).
// 계정 단위(IP+식별자) 10회/15분, IP 단위(여러 계정 대상 스캐닝) 30회/15분 — 둘 중 하나라도
// 초과하면 차단. 정상 e2e 스위트는 실패 로그인이 소수(수동 오입력 테스트 1~2건)뿐이라 영향 없음.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAIL_LIMIT_PER_ACCOUNT = 10;
const LOGIN_FAIL_LIMIT_PER_IP = 30;

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();
    const ip = getClientIp(req);
    const normalizedId = typeof id === "string" ? id.trim().toLowerCase() : "";
    const accountKey = `login-fail:${ip}:${normalizedId}`;
    const ipKey = `login-fail:${ip}`;

    const accountLimited = isRateLimited(accountKey, LOGIN_FAIL_LIMIT_PER_ACCOUNT);
    const ipLimited = isRateLimited(ipKey, LOGIN_FAIL_LIMIT_PER_IP);
    if (accountLimited.limited || ipLimited.limited) {
      const retryAfterSec = Math.max(accountLimited.retryAfterSec, ipLimited.retryAfterSec);
      return NextResponse.json(
        { ok: false, code: "TOO_MANY_ATTEMPTS" },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    // 0. Pre-check: Verify user exists to avoid "CredentialsSignin" error log stack trace
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: id }, { email: id }],
      },
    });

    // Timing-safe dummy hash — prevents account enumeration via response time difference
    const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    if (!existingUser) {
      await bcrypt.compare(password, DUMMY_HASH).catch(() => {});
      recordAttempt(accountKey, LOGIN_WINDOW_MS);
      recordAttempt(ipKey, LOGIN_WINDOW_MS);
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // 0.1 Pre-check: Verify password matches to avoid "CredentialsSignin" error log
    if (existingUser.passwordHash) {
      const isValid = await bcrypt.compare(password, existingUser.passwordHash);
      if (!isValid) {
        recordAttempt(accountKey, LOGIN_WINDOW_MS);
        recordAttempt(ipKey, LOGIN_WINDOW_MS);
        return NextResponse.json(
          { ok: false, code: "INVALID_CREDENTIALS" },
          { status: 401 }
        );
      }
    }

    // 1. NextAuth signIn (Credentials)
    // redirect: false prevents server-side redirect, throws error on failure
    await signIn("credentials", {
      username: id,
      password,
      redirect: false,
    });

    // 2. Success (signIn didn't throw) — 실패 카운터 리셋
    resetRateLimit(accountKey);
    resetRateLimit(ipKey);
    return NextResponse.json({
      ok: true,
      user: { username: id },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return NextResponse.json(
            { ok: false, code: "INVALID_CREDENTIALS" },
            { status: 401 }
          );
        default:
          return NextResponse.json(
            { ok: false, code: "UNKNOWN_ERROR" },
            { status: 500 }
          );
      }
    }

    // In some versions, 'Digest...' or 'Callback...' errors might appear
    // But since we use redirect: false, we shouldn't get redirect errors.
    console.error("Login Error:", error);

    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
