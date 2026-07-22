// src/app/api/auth/resolve-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { checkAndRecord, getClientIp } from "@/lib/middleware/rate-limit";
import type {
  ResolveUserResponse,
  ResolvedUser,
} from "@/types/auth/resolve-user/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// 사용자 열거/PII 노출 방지: 로그인한 사용자만 조회 가능(비인증 접근 차단).
// 인증 후에도 남용을 막기 위해 IP당 5분에 30건으로 제한(defense in depth).
const RESOLVE_USER_WINDOW_MS = 5 * 60 * 1000;
const RESOLVE_USER_LIMIT_PER_IP = 30;

/** ---------------- Helpers ---------------- */
function json<T>(body: T, init?: number | ResponseInit): NextResponse<T> {
  const res =
    typeof init === "number"
      ? NextResponse.json<T>(body, { status: init })
      : NextResponse.json<T>(body, init);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** ---------------- Validation ---------------- */
const QuerySchema = z.object({
  query: z
    .string()
    .trim()
    .pipe(z.string().min(1, "query is required").max(254, "query is too long")),
});

/** Prisma select: DB에 실제 존재하는 필드만 선택 */
const userDbSelect = {
  id: true,
  username: true,
  email: true,
  // displayName이 없을 수 있으므로 name을 선택
  name: true,
} as const;

// DB에서 읽은 사용자 레코드를 ResolvedUser로 변환
type UserDb = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  // 만약 실제 DB에 displayName이 있다면 아래 optional을 추가하고 select에도 포함하세요:
  // displayName?: string | null;
};

function toResolvedUser(u: UserDb): ResolvedUser {
  // displayName 우선순위: displayName(있다면) -> name -> username
  const displayName =
    (u as { displayName?: string | null }).displayName ?? u.name ?? u.username;
  return {
    id: u.id,
    username: u.username,
    email: u.email ?? "",
    displayName,
  };
}

/** 조회 함수: 이메일/유저명/ID(문자열)/레퍼럴코드(UserInfo.referralCode) 검색 */
async function findUserByQuery(query: string): Promise<ResolvedUser | null> {
  const isEmail = EMAIL_REGEX.test(query);

  // 1) 이메일
  if (isEmail) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: query, mode: "insensitive" } },
      select: userDbSelect,
    });
    if (byEmail) return toResolvedUser(byEmail);
  }

  // 2) username (대소문자 무시 완전일치)
  const byUsername = await prisma.user.findFirst({
    where: { username: { equals: query, mode: "insensitive" } },
    select: userDbSelect,
  });
  if (byUsername) return toResolvedUser(byUsername);

  // 3) id (문자열 cuid/uuid 완전일치, 대소문자 구분)
  const byId = await prisma.user.findUnique({
    where: { id: query },
    select: userDbSelect,
  });
  if (byId) return toResolvedUser(byId);

  // 4) referralCode (UserInfo.referralCode, 대소문자 무시 완전일치)
  const info = await prisma.userInfo.findFirst({
    where: { referralCode: { equals: query, mode: "insensitive" } },
    select: { userId: true },
  });
  if (info) {
    const user = await prisma.user.findUnique({
      where: { id: info.userId },
      select: userDbSelect,
    });
    if (user) return toResolvedUser(user);
  }

  return null;
}

/** ---------------- 인증/rate limit 가드 ---------------- */
// 비인증 사용자가 임의 email/username/id/referralCode로 계정 이메일을 조회할 수 있던
// 문제(사용자 열거·PII 노출)를 막기 위해, 로그인 세션이 없으면 즉시 거부한다.
async function guard(
  req: NextRequest
): Promise<NextResponse<ResolveUserResponse> | null> {
  const session = await auth();
  if (!session?.user) {
    return json<ResolveUserResponse>(
      { ok: false, code: "UNAUTHORIZED", message: "Login required" },
      401
    );
  }

  const ip = getClientIp(req);
  const rl = checkAndRecord(
    `resolve-user:${ip}`,
    RESOLVE_USER_LIMIT_PER_IP,
    RESOLVE_USER_WINDOW_MS
  );
  if (rl.limited) {
    return json<ResolveUserResponse>(
      { ok: false, code: "RATE_LIMITED", message: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  return null;
}

/** ---------------- Routes ---------------- */
// GET /api/auth/resolve-user?query=...  (레거시: ?q=... 도 허용)
export async function GET(
  req: NextRequest
): Promise<NextResponse<ResolveUserResponse>> {
  try {
    const guardRes = await guard(req);
    if (guardRes) return guardRes;

    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("query") ?? searchParams.get("q") ?? "";
    const parsed = QuerySchema.safeParse({ query: raw });

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(", ");
      return json<ResolveUserResponse>(
        { ok: false, code: "INVALID_INPUT", message },
        400
      );
    }

    const q = parsed.data.query;
    const user = await findUserByQuery(q);

    if (!user) {
      return json<ResolveUserResponse>(
        { ok: false, code: "NOT_FOUND", message: "User not found" },
        404
      );
    }

    return json<ResolveUserResponse>({ ok: true, user }, 200);
  } catch {
    // 개발 중 원인 파악을 위해 로그를 남겨두면 편합니다.
    // console.error("[resolve-user][GET] error:", err);
    return json<ResolveUserResponse>(
      { ok: false, code: "UNKNOWN", message: "Unexpected error" },
      500
    );
  }
}

// POST /api/auth/resolve-user  { query: string }  (레거시: { q: string }도 허용)
export async function POST(
  req: NextRequest
): Promise<NextResponse<ResolveUserResponse>> {
  try {
    const guardRes = await guard(req);
    if (guardRes) return guardRes;

    const body = (await req.json()) as { query?: string; q?: string };
    const parsed = QuerySchema.safeParse({ query: body.query ?? body.q ?? "" });

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(", ");
      return json<ResolveUserResponse>(
        { ok: false, code: "INVALID_INPUT", message },
        400
      );
    }

    const q = parsed.data.query;
    const user = await findUserByQuery(q);

    if (!user) {
      return json<ResolveUserResponse>(
        { ok: false, code: "NOT_FOUND", message: "User not found" },
        404
      );
    }

    return json<ResolveUserResponse>({ ok: true, user }, 200);
  } catch {
    // console.error("[resolve-user][POST] error:", err);
    return json<ResolveUserResponse>(
      { ok: false, code: "UNKNOWN", message: "Unexpected error" },
      500
    );
  }
}
