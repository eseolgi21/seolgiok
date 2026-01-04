// src/lib/request-user.ts
import { headers } from "next/headers";

export type RequestUser = {
  userId: string | null;
  email: string | null;
  sessionJti: string | null;
};

/** 사용자 ID만 필요할 때 */
export async function getUserId(): Promise<string | null> {
  try {
    const h = await headers(); // ✅ await 필요
    return h.get("x-user-id");
  } catch {
    return null;
  }
}

/** 여러 값을 한 번에 */
export async function getRequestUser(): Promise<RequestUser> {
  try {
    const h = await headers(); // ✅ await 필요
    return {
      userId: h.get("x-user-id"),
      email: h.get("x-user-email"),
      sessionJti: h.get("x-session-jti"),
    };
  } catch {
    return { userId: null, email: null, sessionJti: null };
  }
}

/** 어드민 여부: 사용자 레벨 21 이상만 어드민 */
export async function isAdmin(): Promise<boolean> {
  try {
    const h = await headers(); // Next.js 서버 컴포넌트/Route Handler
    const levelStr = h.get("x-user-level");
    if (levelStr === null) return false;

    const levelNum = Number(levelStr);
    if (!Number.isFinite(levelNum)) return false;

    return levelNum > 20;
  } catch {
    return false;
  }
}
