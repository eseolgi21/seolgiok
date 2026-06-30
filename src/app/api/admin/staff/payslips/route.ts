// src/app/api/admin/staff/payslips/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/admin-auth";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// GET — 전체 급여명세서 목록 또는 직원 목록 (?type=staff-users)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);

  // 드롭다운용 직원 목록 (level >= 10)
  if (searchParams.get("type") === "staff-users") {
    const staffInfos = await prisma.userInfo.findMany({
      where: { level: { gte: 10 } },
      select: { userId: true, level: true, user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return NextResponse.json({ ok: true, users: staffInfos.map((i) => ({ id: i.userId, name: i.user.name, level: i.level })) });
  }

  // 급여명세서 목록
  const payslips = await prisma.payslip.findMany({
    select: {
      id: true,
      year: true,
      month: true,
      fileName: true,
      fileSize: true,
      uploadedAt: true,
      user: { select: { id: true, name: true } },
      uploader: { select: { name: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { uploadedAt: "desc" }],
  });

  return NextResponse.json({ ok: true, payslips });
}

// POST — PDF 업로드 (multipart/form-data: file, userId, year, month)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const uploadedBy = session!.user.id as string;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_FORM" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const userId = formData.get("userId") as string | null;
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!file || !userId || !year || !month) {
    return NextResponse.json({ ok: false, code: "MISSING_FIELDS" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ ok: false, code: "INVALID_FILE_TYPE" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, code: "FILE_TOO_LARGE" }, { status: 400 });
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ ok: false, code: "INVALID_YEAR" }, { status: 400 });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, code: "INVALID_MONTH" }, { status: 400 });
  }

  // 직원 존재 여부 확인
  const userInfo = await prisma.userInfo.findUnique({ where: { userId }, select: { level: true } });
  if (!userInfo || userInfo.level < 10) {
    return NextResponse.json({ ok: false, code: "USER_NOT_FOUND" }, { status: 404 });
  }

  const fileData = Buffer.from(await file.arrayBuffer());

  const payslip = await prisma.payslip.upsert({
    where: { userId_year_month: { userId, year, month } },
    create: { userId, year, month, fileName: file.name, fileSize: file.size, fileData, uploadedBy },
    update: { fileName: file.name, fileSize: file.size, fileData, uploadedBy, uploadedAt: new Date() },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: payslip.id }, { status: 201 });
}

// DELETE — 급여명세서 삭제 ({ ids: string[] })
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const { ids } = body;
  if (!ids?.length) {
    return NextResponse.json({ ok: false, code: "MISSING_IDS" }, { status: 400 });
  }

  await prisma.payslip.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ ok: true });
}
