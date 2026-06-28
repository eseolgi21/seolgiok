import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlot = searchParams.get("shiftSlot");

  if (!shiftDate || !shiftSlot) {
    return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  }

  const checks = await prisma.handoverCheck.findMany({
    where: { shiftDate: new Date(shiftDate), shiftSlot },
    include: {
      checkedUser: { select: { name: true } },
      item: { select: { label: true } },
    },
  });

  return NextResponse.json({ ok: true, checks });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  const { itemId, shiftDate, shiftSlot } = (await req.json()) as {
    itemId: string;
    shiftDate: string;
    shiftSlot: string;
  };

  try {
    const check = await prisma.handoverCheck.create({
      data: {
        itemId,
        shiftDate: new Date(shiftDate),
        shiftSlot,
        checkedBy: userId,
      },
    });
    return NextResponse.json({ ok: true, check }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, code: "ALREADY_CHECKED" }, { status: 409 });
  }
}
