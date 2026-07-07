export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { USER_LEVELS } from "@/lib/constants/user-levels";
import AdminShell from "@/components/admin/AdminShell";

// 인수인계(handover) 서브트리만 MANAGER(15)에게 열어준다. 그 외 /admin/* 전체(회계·게시판·회원 등)는
// 여전히 ADMIN(21) 미만 전부 차단 — 개별 admin 페이지에는 자체 레벨 가드가 없고 이 레이아웃의
// 게이트에만 의존하므로, 여기서 경로별로 정밀하게 나눠야 한다. pathname은 src/proxy.ts가
// x-pathname 헤더로 주입한다.
const HANDOVER_STAFF_AREA_REGEXP = /\/admin\/staff\/handover(\/|$)/;

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  // 미인증 → 로그인 페이지 (다음 URL 유지)
  if (!session) redirect(`/${locale}/auth/login`);

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isHandoverStaffArea = HANDOVER_STAFF_AREA_REGEXP.test(pathname);
  const minLevel = isHandoverStaffArea ? USER_LEVELS.MANAGER : USER_LEVELS.ADMIN;

  // 권한 부족 → 홈 (handover 서브트리만 MANAGER 이상 허용, 그 외는 ADMIN 이상만 허용)
  const level = session.user?.level ?? 0;
  if (level < minLevel) redirect(`/${locale}`);

  return <AdminShell>{children}</AdminShell>;
}
