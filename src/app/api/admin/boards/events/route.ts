// src/app/api/admin/boards/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BoardType, BodyFormat, PostVisibility } from "@/generated/prisma";
import {
  AdminPostFormSchema,
  AdminPostUpdateSchema,
  IdQuerySchema,
  sanitizeHtmlAllowBasic,
} from "@/app/[locale]/admin/boards/events/gaurd/events";

import { getUserId } from "@/lib/request-user";
import { z } from "zod";

function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data } as const, { status: 200 });
}
function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message } as const, { status });
}

function toDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
}

// ==== GET: 목록 / 단건 상세 (BoardType.EVENT) ====
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // 상세
    if (id) {
      const parsed = IdQuerySchema.safeParse({ id });
      if (!parsed.success) return err("INVALID_ID", 400);

      const post = await prisma.post.findFirst({
        where: { id: parsed.data.id, boardType: BoardType.EVENT },
        select: {
          id: true,
          title: true,
          bodyRaw: true,
          bodyHtml: true,
          visibility: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,

          eventStartAt: true,
          eventEndAt: true,
          bannerUrl: true,
          ctaLinkUrl: true,
        },
      });
      if (!post) return err("NOT_FOUND", 404);

      return ok({
        id: post.id,
        title: post.title,
        bodyRaw: post.bodyRaw,
        bodyHtml: post.bodyHtml,
        visibility:
          post.visibility === PostVisibility.PRIVATE ? "PRIVATE" : "PUBLIC",
        isPublished: post.isPublished,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),

        eventStartAt: post.eventStartAt
          ? post.eventStartAt.toISOString()
          : null,
        eventEndAt: post.eventEndAt ? post.eventEndAt.toISOString() : null,
        bannerUrl: post.bannerUrl ?? null,
        ctaLinkUrl: post.ctaLinkUrl ?? null,
      });
    }

    // 목록(제목 오름차순: 공지와 동일)
    const rows = await prisma.post.findMany({
      where: { boardType: BoardType.EVENT },
      orderBy: [{ title: "asc" }],
      select: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true,
        eventStartAt: true,
        eventEndAt: true,
      },
    });

    return ok(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        isPublished: r.isPublished,
        createdAt: r.createdAt.toISOString(),
        eventStartAt: r.eventStartAt ? r.eventStartAt.toISOString() : null,
        eventEndAt: r.eventEndAt ? r.eventEndAt.toISOString() : null,
      }))
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return err(msg, 500);
  }
}

// ==== POST: 생성 (BoardType.EVENT) ====
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return err("UNAUTHORIZED", 401);

    const json = await req.json().catch(() => null);
    if (!json) return err("EMPTY_BODY", 400);

    const parsed = AdminPostFormSchema.safeParse(json);
    if (!parsed.success) return err("INVALID_BODY", 400);

    const {
      title,
      bodyRaw,
      bodyHtml,
      visibility,
      isPublished,
      eventStartAt,
      eventEndAt,
      bannerUrl,
      ctaLinkUrl,
    } = parsed.data;

    const safeHtml = sanitizeHtmlAllowBasic(bodyHtml);
    const now = new Date();

    const created = await prisma.post.create({
      data: {
        boardType: BoardType.EVENT,
        supportCategory: null,
        authorId: userId,
        visibility:
          visibility === "PRIVATE"
            ? PostVisibility.PRIVATE
            : PostVisibility.PUBLIC,
        title,
        bodyFormat: BodyFormat.HTML,
        bodyRaw: bodyRaw ?? "",
        bodyHtml: safeHtml,
        isPublished,
        publishedAt: isPublished ? now : null,
        tags: [],

        eventStartAt: toDateOrNull(eventStartAt),
        eventEndAt: toDateOrNull(eventEndAt),
        bannerUrl:
          typeof bannerUrl === "string" && bannerUrl.trim().length > 0
            ? bannerUrl.trim()
            : null,
        ctaLinkUrl:
          typeof ctaLinkUrl === "string" && ctaLinkUrl.trim().length > 0
            ? ctaLinkUrl.trim()
            : null,
      },
      select: { id: true },
    });

    return ok({ id: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return err(msg, 500);
  }
}

// ==== PATCH: 수정 (BoardType.EVENT) ====
export async function PATCH(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    if (!json) return err("EMPTY_BODY", 400);

    const parsed = AdminPostUpdateSchema.safeParse(json);
    if (!parsed.success) return err("INVALID_BODY", 400);

    const {
      id,
      title,
      bodyRaw,
      bodyHtml,
      visibility,
      isPublished,
      eventStartAt,
      eventEndAt,
      bannerUrl,
      ctaLinkUrl,
    } = parsed.data;

    const exists = await prisma.post.findFirst({
      where: { id, boardType: BoardType.EVENT },
      select: { id: true, publishedAt: true },
    });
    if (!exists) return err("NOT_FOUND", 404);

    const safeHtml = sanitizeHtmlAllowBasic(bodyHtml);
    const nextPublishedAt = isPublished
      ? (exists.publishedAt ?? new Date())
      : null;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title,
        bodyRaw: bodyRaw ?? "",
        bodyHtml: safeHtml,
        visibility:
          visibility === "PRIVATE"
            ? PostVisibility.PRIVATE
            : PostVisibility.PUBLIC,
        isPublished,
        publishedAt: nextPublishedAt,

        eventStartAt: toDateOrNull(eventStartAt),
        eventEndAt: toDateOrNull(eventEndAt),
        bannerUrl:
          typeof bannerUrl === "string" && bannerUrl.trim().length > 0
            ? bannerUrl.trim()
            : null,
        ctaLinkUrl:
          typeof ctaLinkUrl === "string" && ctaLinkUrl.trim().length > 0
            ? ctaLinkUrl.trim()
            : null,
      },
      select: { id: true },
    });

    return ok({ id: updated.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return err(msg, 500);
  }
}

// ==== DELETE: 일괄 삭제 (BoardType.EVENT) ====
const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BulkDeleteSchema.safeParse(json);
    if (!parsed.success) return err("INVALID_BODY", 400);

    const { ids } = parsed.data;

    const result = await prisma.post.deleteMany({
      where: {
        id: { in: ids },
        boardType: BoardType.EVENT,
      },
    });

    return ok({ deletedCount: result.count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return err(msg, 500);
  }
}
