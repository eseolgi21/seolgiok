import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin(21);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlotId = searchParams.get("shiftSlotId");
  if (!shiftDate || !shiftSlotId)
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const approvals = await prisma.handoverApproval.findMany({
    where: { shiftDate: new Date(shiftDate), shiftSlotId },
    include: {
      submitter: { select: { name: true } },
      confirmer: { select: { name: true } },
    },
  });
  return NextResponse.json({ ok: true, approvals });
}

// POST 없음 — staff endpoint에서 제출

export async function PATCH(req: Request) {
  const { session, error } = await requireAdmin(21);
  if (error) return error;
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverApproval.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (existing.status === "CONFIRMED")
    return NextResponse.json({ ok: false, code: "ALREADY_CONFIRMED" }, { status: 409 });
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
  const { error } = await requireAdmin(21);
  if (error) return error;
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  await prisma.handoverApproval.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
