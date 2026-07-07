import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStoreScope } from "@/lib/middleware/store-scope";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const queryStoreId = searchParams.get("storeId");
  // OWN(MANAGER)은 쿼리 storeId를 절대 신뢰하지 않고 자기 매장으로 강제 필터한다.
  const storeFilter = scope.scope === "OWN" ? { storeId: scope.storeId } : queryStoreId ? { storeId: queryStoreId } : {};
  const slots = await prisma.handoverShiftSlot.findMany({
    where: { ...storeFilter, ...(category ? { category } : {}) },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ ok: true, slots });
}

export async function POST(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { label, category, order, storeId: bodyStoreId } = await req.json() as { label: string; category?: string; order?: number; storeId?: string };
  if (!label?.trim()) return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  let storeId: string;
  if (scope.scope === "OWN") {
    // body에 storeId가 오더라도 무시하고 자기 매장으로 강제한다.
    storeId = scope.storeId;
  } else {
    if (!bodyStoreId) return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
    storeId = bodyStoreId;
  }
  const cat = category === "KITCHEN" ? "KITCHEN" : "HALL";
  const maxOrder = await prisma.handoverShiftSlot.aggregate({
    where: { storeId, category: cat },
    _max: { order: true },
  });
  const slot = await prisma.handoverShiftSlot.create({
    data: { label: label.trim(), category: cat, order: order ?? (maxOrder._max.order ?? 0) + 1, storeId },
  });
  return NextResponse.json({ ok: true, slot }, { status: 201 });
}

export async function PATCH(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { id, label, order, isActive } = await req.json() as { id: string; label?: string; order?: number; isActive?: boolean };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverShiftSlot.findUnique({ where: { id }, select: { storeId: true } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (scope.scope === "OWN" && existing.storeId !== scope.storeId) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  const slot = await prisma.handoverShiftSlot.update({
    where: { id },
    data: { ...(label && { label }), ...(order !== undefined && { order }), ...(isActive !== undefined && { isActive }) },
  });
  return NextResponse.json({ ok: true, slot });
}

export async function DELETE(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverShiftSlot.findUnique({ where: { id }, select: { storeId: true } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (scope.scope === "OWN" && existing.storeId !== scope.storeId) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  try {
    await prisma.handoverShiftSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, code: "SLOT_IN_USE" }, { status: 409 });
  }
}
