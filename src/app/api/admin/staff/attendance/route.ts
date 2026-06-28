// src/app/api/admin/staff/attendance/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const target = dateStr ? new Date(dateStr) : new Date();
  target.setHours(0, 0, 0, 0);
  const nextDay = new Date(target);
  nextDay.setDate(nextDay.getDate() + 1);
  const logs = await prisma.attendanceLog.findMany({
    where: { clockedAt: { gte: target, lt: nextDay } },
    include: { user: { select: { name: true } } },
    orderBy: { clockedAt: "asc" },
  });
  return NextResponse.json({ ok: true, logs });
}
