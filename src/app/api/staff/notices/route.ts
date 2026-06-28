import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const post = await prisma.post.findFirst({
      where: { id, boardType: "INTERNAL" },
      select: {
        id: true,
        title: true,
        bodyHtml: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    if (!post) {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, post });
  }

  const posts = await prisma.post.findMany({
    where: { boardType: "INTERNAL", isPublished: true },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ ok: true, posts });
}
