// src/app/api/admin/staff/suggestions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const level = (session?.user as { level?: number })?.level ?? 0;
  if (!session || level < 21) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const posts = await prisma.post.findMany({
    where: { boardType: "SUGGESTION" },
    select: { id: true, title: true, bodyHtml: true, createdAt: true, author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, posts });
}
