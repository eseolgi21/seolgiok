import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BoardType, PostVisibility } from "@/generated/prisma";

function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data } as const, { status: 200 });
}
function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message } as const, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const post = await prisma.post.findFirst({
        where: {
          id,
          boardType: BoardType.NOTICE,
          isPublished: true,
          visibility: PostVisibility.PUBLIC,
        },
        select: {
          id: true,
          title: true,
          bodyHtml: true,
          publishedAt: true,
          createdAt: true,
        },
      });
      if (!post) return err("NOT_FOUND", 404);
      return ok({
        id: post.id,
        title: post.title,
        bodyHtml: post.bodyHtml,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        createdAt: post.createdAt.toISOString(),
      });
    }

    const rows = await prisma.post.findMany({
      where: {
        boardType: BoardType.NOTICE,
        isPublished: true,
        visibility: PostVisibility.PUBLIC,
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return ok(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return err(msg, 500);
  }
}
