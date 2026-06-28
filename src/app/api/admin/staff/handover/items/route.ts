// src/app/api/admin/staff/handover/items/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const items = await prisma.handoverItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { label, order } = await req.json() as { label: string; order?: number };
  if (!label?.trim()) return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  const maxOrder = await prisma.handoverItem.aggregate({ _max: { order: true } });
  const item = await prisma.handoverItem.create({ data: { label: label.trim(), order: order ?? (maxOrder._max.order ?? 0) + 1 } });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { id, label, order, isActive } = await req.json() as { id: string; label?: string; order?: number; isActive?: boolean };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const item = await prisma.handoverItem.update({ where: { id }, data: { ...(label && { label }), ...(order !== undefined && { order }), ...(isActive !== undefined && { isActive }) } });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  await prisma.handoverItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
