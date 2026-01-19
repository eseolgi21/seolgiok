// /Users/noian/Desktop/project/globxBotWeb/src/app/[locale]/(site)/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MainHeader from "@/components/MainHeader";
import { auth } from "@/lib/auth/auth";
import type { ReactNode } from "react";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const authed = !!session?.user;
  const userLevel = session?.user?.level ?? 0;

  return (
    // [핵심]: <body> 태그에 있던 스타일은 이 div에 적용됩니다. (올바름)
    <div className="min-h-dvh bg-base-200 text-base-content flex flex-col">
      <MainHeader authed={authed} userLevel={userLevel} />

      <main className="flex-1 w-full flex flex-col">{children}</main>
    </div>
  );
}
