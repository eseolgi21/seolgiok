// src/app/api/staff/payslips/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.user!.id as string;

  const payslips = await prisma.payslip.findMany({
    where: { userId },
    select: { id: true, year: true, month: true, fileName: true, fileSize: true, uploadedAt: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json({ ok: true, payslips });
}
