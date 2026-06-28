// src/app/api/admin/staff/notices/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const posts = await prisma.post.findMany({
    where: { boardType: "INTERNAL" },
    select: { id: true, title: true, isPublished: true, publishedAt: true, createdAt: true, author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const authorId = session.user!.id as string;
  const { title, bodyRaw, isPublished } = await req.json() as { title: string; bodyRaw: string; isPublished?: boolean };
  if (!title?.trim() || !bodyRaw?.trim()) return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  const post = await prisma.post.create({
    data: { boardType: "INTERNAL", authorId, title: title.trim(), bodyRaw: bodyRaw.trim(), bodyHtml: bodyRaw.trim(), visibility: "PUBLIC", isPublished: !!isPublished, publishedAt: isPublished ? new Date() : null },
  });
  return NextResponse.json({ ok: true, post: { id: post.id } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { id, title, bodyRaw, isPublished } = await req.json() as { id: string; title?: string; bodyRaw?: string; isPublished?: boolean };
  if (!id) return NextResponse.json({ ok: false, code: "MISSING_ID" }, { status: 400 });
  const post = await prisma.post.update({
    where: { id },
    data: { ...(title && { title }), ...(bodyRaw && { bodyRaw, bodyHtml: bodyRaw }), ...(isPublished !== undefined && { isPublished, publishedAt: isPublished ? new Date() : null }) },
  });
  return NextResponse.json({ ok: true, post: { id: post.id } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const { ids } = await req.json() as { ids: string[] };
  if (!ids?.length) return NextResponse.json({ ok: false, code: "MISSING_IDS" }, { status: 400 });
  await prisma.post.deleteMany({ where: { id: { in: ids }, boardType: "INTERNAL" } });
  return NextResponse.json({ ok: true });
}
