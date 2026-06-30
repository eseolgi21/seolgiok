import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const userId = session.user!.id as string;
  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shiftSlotId = searchParams.get("shiftSlotId");
  const category = searchParams.get("category");
  if (!shiftDate || !shiftSlotId) return NextResponse.json({ ok: false, code: "MISSING_PARAMS" }, { status: 400 });
  const where: Record<string, unknown> = { shiftDate: new Date(shiftDate), shiftSlotId, authorId: userId };
  if (category) where.category = category;
  const comments = await prisma.handoverComment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: { id: true, content: true, createdAt: true, category: true },
  });
  return NextResponse.json({ ok: true, comments });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const userId = session.user!.id as string;
  const { shiftDate, shiftSlotId, category, content } = (await req.json()) as {
    shiftDate: string; shiftSlotId: string; category: string; content: string;
  };
  if (!content?.trim()) return NextResponse.json({ ok: false, code: "EMPTY_CONTENT" }, { status: 400 });
  const comment = await prisma.handoverComment.create({
    data: { shiftDate: new Date(shiftDate), shiftSlotId, category, authorId: userId, content: content.trim() },
  });
  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
