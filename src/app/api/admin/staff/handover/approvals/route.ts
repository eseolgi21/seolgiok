import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { resolveStoreScope } from "@/lib/middleware/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlotId = searchParams.get("shiftSlotId");
  if (!shiftDate || !shiftSlotId)
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const where: Record<string, unknown> = { shiftDate: new Date(shiftDate), shiftSlotId };
  if (scope.scope === "OWN") {
    // MANAGER는 쿼리 파라미터로 다른 storeId를 넘겨도 자기 매장으로 강제 고정한다.
    where.storeId = scope.storeId;
  } else {
    const storeId = searchParams.get("storeId");
    if (storeId) where.storeId = storeId;
  }
  const approvals = await prisma.handoverApproval.findMany({
    where,
    include: {
      submitter: { select: { name: true } },
      confirmer: { select: { name: true } },
    },
  });
  return NextResponse.json({ ok: true, approvals });
}

// POST 없음 — staff endpoint에서 제출

export async function PATCH(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverApproval.findUnique({
    where: { id },
    select: { id: true, status: true, storeId: true },
  });
  // 레코드 없음과 매장 불일치(IDOR)를 동일한 404로 통합 — 레코드 존재 여부를 노출하지 않는다.
  if (!existing || (scope.scope === "OWN" && existing.storeId !== scope.storeId)) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }
  if (existing.status === "CONFIRMED")
    return NextResponse.json({ ok: false, code: "ALREADY_CONFIRMED" }, { status: 409 });
  const session = await auth();
  const updated = await prisma.handoverApproval.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      confirmedBy: session!.user!.id as string,
      confirmedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true, approval: updated });
}

export async function DELETE(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverApproval.findUnique({
    where: { id },
    select: { id: true, storeId: true },
  });
  // 레코드 없음과 매장 불일치(IDOR)를 동일한 404로 통합 — 레코드 존재 여부를 노출하지 않는다.
  if (!existing || (scope.scope === "OWN" && existing.storeId !== scope.storeId)) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }
  await prisma.handoverApproval.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
