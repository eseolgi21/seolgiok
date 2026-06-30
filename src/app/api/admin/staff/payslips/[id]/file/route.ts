// src/app/api/admin/staff/payslips/[id]/file/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    select: { fileName: true, fileData: true },
  });

  if (!payslip) {
    return new Response(JSON.stringify({ ok: false, code: "NOT_FOUND" }), {
      status: 404,
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
