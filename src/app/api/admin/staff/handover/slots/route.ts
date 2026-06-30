import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin(15);
  if (error) return error;
  const slots = await prisma.handoverShiftSlot.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ ok: true, slots });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin(15);
  if (error) return error;
  const { label, order } = await req.json() as { label: string; order?: number };
  if (!label?.trim()) return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  const maxOrder = await prisma.handoverShiftSlot.aggregate({ _max: { order: true } });
  const slot = await prisma.handoverShiftSlot.create({
    data: { label: label.trim(), order: order ?? (maxOrder._max.order ?? 0) + 1 },
  });
  return NextResponse.json({ ok: true, slot }, { status: 201 });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin(15);
  if (error) return error;
  const { id, label, order, isActive } = await req.json() as { id: string; label?: string; order?: number; isActive?: boolean };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const slot = await prisma.handoverShiftSlot.update({
    where: { id },
    data: { ...(label && { label }), ...(order !== undefined && { order }), ...(isActive !== undefined && { isActive }) },
  });
  return NextResponse.json({ ok: true, slot });
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin(15);
  if (error) return error;
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  try {
    await prisma.handoverShiftSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, code: "SLOT_IN_USE" }, { status: 409 });
  }
}
