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
  const category = searchParams.get("category");
  if (!shiftDate || !shiftSlotId) return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const where: Record<string, unknown> = { shiftDate: new Date(shiftDate), shiftSlotId };
  if (category) where.category = category;
  const comments = await prisma.handoverComment.findMany({
    where,
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ ok: true, comments });
}
