import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { USER_LEVELS } from "@/lib/constants/user-levels";
import HandoverReviewView from "./HandoverReviewView";

export default async function HandoverReviewPage() {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  const isAdmin = level >= USER_LEVELS.ADMIN;

  return (
    <Suspense>
      <HandoverReviewView isAdmin={isAdmin} />
    </Suspense>
  );
}
