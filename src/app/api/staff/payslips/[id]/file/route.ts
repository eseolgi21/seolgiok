// src/app/api/staff/payslips/[id]/file/route.ts
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 10) {
    return new Response(JSON.stringify({ ok: false, code: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user!.id as string;
  const { id } = await params;

  const payslip = await prisma.payslip.findUnique({
    where: { id },
    select: { userId: true, fileName: true, fileData: true },
  });

  if (!payslip) {
    return new Response(JSON.stringify({ ok: false, code: "NOT_FOUND" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 본인 급여명세서만 접근 가능
  if (payslip.userId !== userId) {
    return new Response(JSON.stringify({ ok: false, code: "FORBIDDEN" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encodedName = encodeURIComponent(payslip.fileName);
  return new Response(payslip.fileData, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
    },
  });
}
