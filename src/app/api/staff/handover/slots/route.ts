import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const slots = await prisma.handoverShiftSlot.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, label: true, order: true },
  });
  return NextResponse.json({ ok: true, slots });
}
