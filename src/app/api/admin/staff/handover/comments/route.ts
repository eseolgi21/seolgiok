import { NextResponse } from "next/server";
import { resolveStoreScope } from "@/lib/middleware/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlotId = searchParams.get("shiftSlotId");
  const category = searchParams.get("category");
  if (!shiftDate || !shiftSlotId) return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const where: Record<string, unknown> = { shiftDate: new Date(shiftDate), shiftSlotId };
  if (category) where.category = category;
  if (scope.scope === "OWN") {
    // MANAGER는 쿼리 파라미터로 다른 storeId를 넘겨도 자기 매장으로 강제 고정한다.
    where.storeId = scope.storeId;
  } else {
    const storeId = searchParams.get("storeId");
    if (storeId) where.storeId = storeId;
  }
  const comments = await prisma.handoverComment.findMany({
    where,
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ ok: true, comments });
}
