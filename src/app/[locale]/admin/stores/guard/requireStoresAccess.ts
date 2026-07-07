// src/app/[locale]/admin/stores/guard/requireStoresAccess.ts
// 서버 전용 access 체크. auth() → prisma → pg(Node 전용)를 끌고 오므로
// 클라이언트 번들에는 절대 import되면 안 된다 (stores.ts의 파서 함수들과 분리됨).

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export const STORES_MIN_LEVEL = 21;

// admin/layout.tsx가 이미 level<21을 차단하지만, 방어적으로 페이지에서도 재확인한다.
export async function requireStoresAccess(locale: string): Promise<void> {
  const session = await auth();
  if (!session) redirect(`/${locale}/auth/login`);
  const level = session.user?.level ?? 0;
  if (level < STORES_MIN_LEVEL) redirect(`/${locale}`);
}
