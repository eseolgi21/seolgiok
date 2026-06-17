export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import AdminShell from "@/components/admin/AdminShell";

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

  // 권한 부족 → 홈
  const level = session.user?.level ?? 0;
  if (level < 21) redirect(`/${locale}`);

  return <AdminShell>{children}</AdminShell>;
}
