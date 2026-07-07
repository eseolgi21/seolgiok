import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
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
  if (!shiftDate || !shiftSlotId) return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const checks = await prisma.handoverCheck.findMany({
    where: { shiftDate: new Date(shiftDate), shiftSlotId, storeId: userInfo.storeId },
    include: { checkedUser: { select: { name: true } }, item: { select: { label: true, category: true } } },
  });
  return NextResponse.json({ ok: true, checks });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const userId = session.user!.id as string;

  const userInfo = await prisma.userInfo.findUnique({
    where: { userId },
    select: { storeId: true },
  });
  if (!userInfo?.storeId) {
    return NextResponse.json({ ok: false, code: "STORE_NOT_ASSIGNED" }, { status: 403 });
  }

  const { itemId, shiftDate, shiftSlotId } = (await req.json()) as { itemId: string; shiftDate: string; shiftSlotId: string };

  const [item, slot] = await Promise.all([
    prisma.handoverItem.findUnique({ where: { id: itemId }, select: { storeId: true } }),
    prisma.handoverShiftSlot.findUnique({ where: { id: shiftSlotId }, select: { storeId: true } }),
  ]);
  if (!item || item.storeId !== userInfo.storeId || !slot || slot.storeId !== userInfo.storeId) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const check = await prisma.handoverCheck.create({
      data: { itemId, shiftDate: new Date(shiftDate), shiftSlotId, checkedBy: userId, storeId: userInfo.storeId },
    });
    return NextResponse.json({ ok: true, check }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, code: "ALREADY_CHECKED" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
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

  const { itemId, shiftDate, shiftSlotId } = (await req.json()) as {
    itemId: string;
    shiftDate: string;
    shiftSlotId: string;
  };
  if (!itemId || !shiftDate || !shiftSlotId)
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  await prisma.handoverCheck.deleteMany({
    where: {
      itemId,
      shiftDate: new Date(shiftDate),
      shiftSlotId,
      checkedBy: userId,
      storeId: userInfo.storeId,
    },
  });
  return NextResponse.json({ ok: true });
}
