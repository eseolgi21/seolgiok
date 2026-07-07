import { NextResponse } from "next/server";
import { resolveStoreScope } from "@/lib/middleware/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 직원 인수인계 체크 현황 조회 — ADMIN/SUPER는 전 매장, MANAGER는 자기 매장 한정 접근.
// ADMIN/SUPER: storeId를 주면 해당 매장만, 생략하면 전체 매장 통합 조회.
// MANAGER: 쿼리 storeId는 무시하고 항상 자신의 배정 매장으로만 필터링.
export async function GET(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;

  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlotId = searchParams.get("shiftSlotId");
  if (!shiftDate || !shiftSlotId) {
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  }

  // MANAGER(OWN)는 클라이언트가 보낸 storeId를 절대 신뢰하지 않고 scope.storeId로 강제 필터.
  const storeFilter =
    scope.scope === "OWN" ? scope.storeId : searchParams.get("storeId") ?? undefined;

  const checks = await prisma.handoverCheck.findMany({
    where: {
      shiftDate: new Date(shiftDate),
      shiftSlotId,
      ...(storeFilter ? { storeId: storeFilter } : {}),
    },
    include: {
      checkedUser: { select: { name: true } },
      item: { select: { label: true, category: true } },
      store: { select: { name: true } },
    },
  });
  return NextResponse.json({ ok: true, checks });
}
