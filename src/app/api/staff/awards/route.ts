import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [votes, myVoteToday] = await Promise.all([
    prisma.employeeVote.groupBy({
      by: ["targetId"],
      where: { voteYear: year, voteMonth: month },
      _count: { targetId: true },
      orderBy: { _count: { targetId: "desc" } },
    }),
    prisma.employeeVote.findFirst({
      where: { voterId: userId, voteDate: today },
    }),
  ]);

  const targetIds = votes.map((v) => v.targetId);
  const users = await prisma.user.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, name: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const ranking = votes.map((v) => ({
    targetId: v.targetId,
    name: userMap[v.targetId] ?? "",
    count: v._count.targetId,
  }));

  return NextResponse.json({
    ok: true,
    ranking,
    votedToday: !!myVoteToday,
    votedTargetId: myVoteToday?.targetId ?? null,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  const { targetId } = (await req.json()) as { targetId: string };
  if (!targetId) {
    return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (targetId === userId) {
    return NextResponse.json({ ok: false, code: "SELF_VOTE" }, { status: 400 });
  }

  const now = new Date();
  const voteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const vote = await prisma.employeeVote.create({
      data: {
        voterId: userId,
        targetId,
        voteDate,
        voteYear: now.getFullYear(),
        voteMonth: now.getMonth() + 1,
      },
    });
    return NextResponse.json({ ok: true, vote: { id: vote.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, code: "ALREADY_VOTED" }, { status: 409 });
  }
}
