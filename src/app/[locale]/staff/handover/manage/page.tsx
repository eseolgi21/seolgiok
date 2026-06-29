export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { USER_LEVELS } from "@/lib/constants/user-levels";
import HandoverManageClient from "./HandoverManageClient";

type Props = { params: Promise<{ locale: string }> };

export default async function StaffHandoverManagePage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;

  if (!session || level < USER_LEVELS.MANAGER) {
    redirect(`/${locale}/staff/handover`);
  }

  return <HandoverManageClient />;
}
