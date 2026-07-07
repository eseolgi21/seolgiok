import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStoreScope } from "@/lib/middleware/store-scope";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { searchParams } = new URL(req.url);
  const queryStoreId = searchParams.get("storeId");
  // OWN(MANAGER)은 쿼리 storeId를 절대 신뢰하지 않고 자기 매장으로 강제 필터한다.
  const where = scope.scope === "OWN" ? { storeId: scope.storeId } : queryStoreId ? { storeId: queryStoreId } : {};
  const items = await prisma.handoverItem.findMany({ where, orderBy: [{ category: "asc" }, { order: "asc" }] });
  return NextResponse.json({ ok: true, items });
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
  const maxOrder = await prisma.handoverItem.aggregate({ where: { storeId }, _max: { order: true } });
  const item = await prisma.handoverItem.create({
    data: { label: label.trim(), category: category ?? "HALL", order: order ?? (maxOrder._max.order ?? 0) + 1, storeId },
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}

export async function PATCH(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { id, label, category, order, isActive } = await req.json() as { id: string; label?: string; category?: string; order?: number; isActive?: boolean };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverItem.findUnique({ where: { id }, select: { storeId: true } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (scope.scope === "OWN" && existing.storeId !== scope.storeId) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  const item = await prisma.handoverItem.update({
    where: { id },
    data: { ...(label && { label }), ...(category && { category }), ...(order !== undefined && { order }), ...(isActive !== undefined && { isActive }) },
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  const scope = await resolveStoreScope();
  if (!scope.ok) return scope.error;
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverItem.findUnique({ where: { id }, select: { storeId: true } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (scope.scope === "OWN" && existing.storeId !== scope.storeId) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  await prisma.handoverItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
