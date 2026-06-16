export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (level < 21) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
