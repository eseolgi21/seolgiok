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

  const posts = await prisma.post.findMany({
    where: { boardType: "SUGGESTION", authorId: userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  const { title, body } = (await req.json()) as { title: string; body: string };
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      boardType: "SUGGESTION",
      authorId: userId,
      visibility: "PRIVATE",
      title: title.trim(),
      bodyRaw: body.trim(),
      bodyHtml: body.trim(),
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, post: { id: post.id } }, { status: 201 });
}
