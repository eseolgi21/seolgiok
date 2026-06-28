export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import StaffShell from "@/components/staff/StaffShell";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export default async function StaffLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;

  if (!session || level < 10) {
    redirect(`/${locale}/auth/login`);
  }

  const userName = session.user?.name ?? "";

  return (
    <StaffShell userName={userName}>
      {children}
    </StaffShell>
  );
}
