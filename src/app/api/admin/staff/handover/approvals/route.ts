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
  if (!shiftDate || !shiftSlotId) return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const approvals = await prisma.handoverApproval.findMany({
    where: { shiftDate: new Date(shiftDate), shiftSlotId },
    include: { approver: { select: { name: true } } },
  });
  return NextResponse.json({ ok: true, approvals });
}

export async function POST(req: Request) {
  const { session, error } = await requireAdmin(21);
  if (error) return error;
  const { shiftDate, shiftSlotId, category, note } = await req.json() as { shiftDate: string; shiftSlotId: string; category: string; note?: string };
  if (!shiftDate || !shiftSlotId || !category) return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  try {
    const approval = await prisma.handoverApproval.create({
      data: { shiftDate: new Date(shiftDate), shiftSlotId, category, approvedBy: session!.user!.id as string, ...(note && { note }) },
    });
    return NextResponse.json({ ok: true, approval }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, code: "ALREADY_APPROVED" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin(21);
  if (error) return error;
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  await prisma.handoverApproval.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
