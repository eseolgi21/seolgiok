import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { USER_LEVELS } from "@/lib/constants/user-levels";
import HandoverHistoryView from "./HandoverHistoryView";

export default async function HandoverHistoryPage() {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  const isAdmin = level >= USER_LEVELS.ADMIN;

  return (
    <Suspense>
      <HandoverHistoryView isAdmin={isAdmin} />
    </Suspense>
  );
}
