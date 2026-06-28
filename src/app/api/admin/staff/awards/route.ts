// src/app/api/admin/staff/awards/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
  const votes = await prisma.employeeVote.groupBy({
    by: ["targetId"],
    where: { voteYear: year, voteMonth: month },
    _count: { targetId: true },
    orderBy: { _count: { targetId: "desc" } },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: votes.map((v) => v.targetId) } },
    select: { id: true, name: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const ranking = votes.map((v) => ({ targetId: v.targetId, name: userMap[v.targetId] ?? "", count: v._count.targetId }));
  return NextResponse.json({ ok: true, year, month, ranking });
}
