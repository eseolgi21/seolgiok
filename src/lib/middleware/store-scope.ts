import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { USER_LEVELS } from "@/lib/constants/user-levels";

export async function resolveStoreScope(): Promise<
  | { ok: true; scope: "ALL" }
  | { ok: true; scope: "OWN"; storeId: string }
  | { ok: false; error: NextResponse }
> {
  const session = await auth();
  if (!session) {
    return {
      ok: false,
      error: NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  const level = session.user?.level ?? 0;

  if (level >= USER_LEVELS.ADMIN) {
    return { ok: true, scope: "ALL" };
  }

  if (level >= USER_LEVELS.MANAGER) {
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: session.user!.id as string },
      select: { storeId: true },
    });

    if (!userInfo?.storeId) {
      return {
        ok: false,
        error: NextResponse.json({ ok: false, code: "STORE_NOT_ASSIGNED" }, { status: 403 }),
      };
    }

    return { ok: true, scope: "OWN", storeId: userInfo.storeId };
  }

  return {
    ok: false,
    error: NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 }),
  };
}
