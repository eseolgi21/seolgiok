import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const userId = session.user!.id as string;

  const userInfo = await prisma.userInfo.findUnique({
    where: { userId },
    select: { storeId: true },
  });
  if (!userInfo?.storeId) {
    return NextResponse.json({ ok: false, code: "STORE_NOT_ASSIGNED" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlotId = searchParams.get("shiftSlotId");
  if (!shiftDate || !shiftSlotId)
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const approvals = await prisma.handoverApproval.findMany({
    where: { shiftDate: new Date(shiftDate), shiftSlotId, storeId: userInfo.storeId },
    select: { id: true, category: true, status: true, submittedAt: true, submitter: { select: { name: true } } },
  });
  return NextResponse.json({ ok: true, approvals });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const userId = session.user!.id as string;

  const userInfo = await prisma.userInfo.findUnique({
    where: { userId },
    select: { storeId: true },
  });
  if (!userInfo?.storeId) {
    return NextResponse.json({ ok: false, code: "STORE_NOT_ASSIGNED" }, { status: 403 });
  }

  const { shiftDate, shiftSlotId, category } = (await req.json()) as {
    shiftDate: string;
    shiftSlotId: string;
    category: string;
  };
  if (!shiftDate || !shiftSlotId || !category)
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });

  const slot = await prisma.handoverShiftSlot.findUnique({ where: { id: shiftSlotId }, select: { storeId: true } });
  if (!slot || slot.storeId !== userInfo.storeId) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const approval = await prisma.handoverApproval.create({
      data: {
        shiftDate: new Date(shiftDate),
        shiftSlotId,
        category,
        status: "PENDING",
        submittedBy: userId,
        storeId: userInfo.storeId,
      },
    });
    return NextResponse.json({ ok: true, approval }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, code: "ALREADY_SUBMITTED" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const existing = await prisma.handoverApproval.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (existing.status === "CONFIRMED")
    return NextResponse.json({ ok: false, code: "ALREADY_CONFIRMED" }, { status: 409 });
  if (existing.submittedBy !== (session.user!.id as string))
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  await prisma.handoverApproval.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
