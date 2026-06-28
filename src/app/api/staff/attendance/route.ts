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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const logs = await prisma.attendanceLog.findMany({
    where: { userId, clockedAt: { gte: todayStart } },
    orderBy: { clockedAt: "asc" },
  });

  const last = logs.at(-1);
  return NextResponse.json({ ok: true, logs, lastType: last?.type ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  const { type } = (await req.json()) as { type: "CLOCK_IN" | "CLOCK_OUT" };
  if (type !== "CLOCK_IN" && type !== "CLOCK_OUT") {
    return NextResponse.json({ ok: false, code: "INVALID_TYPE" }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const last = await prisma.attendanceLog.findFirst({
    where: { userId, clockedAt: { gte: todayStart } },
    orderBy: { clockedAt: "desc" },
  });

  if (last?.type === type) {
    return NextResponse.json(
      {
        ok: false,
        code: type === "CLOCK_IN" ? "ALREADY_CLOCKED_IN" : "ALREADY_CLOCKED_OUT",
      },
      { status: 400 }
    );
  }

  const log = await prisma.attendanceLog.create({ data: { userId, type } });
  return NextResponse.json({ ok: true, log }, { status: 201 });
}
