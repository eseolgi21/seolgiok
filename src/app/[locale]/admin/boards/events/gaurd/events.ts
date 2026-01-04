// src/app/[locale]/admin/boards/events/gaurd/events.ts
import { z } from "zod";

/* -------------------------------
 * 요청 검증 스키마 (입력)
 * ----------------------------- */
export const AdminPostFormSchema = z.object({
  title: z.string().min(1).max(200),
  bodyRaw: z.string().optional().default(""),
  bodyHtml: z.string().min(0),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  isPublished: z.boolean(),

  // 이벤트 전용
  eventStartAt: z.string().datetime().nullable().optional(),
  eventEndAt: z.string().datetime().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  ctaLinkUrl: z.string().url().nullable().optional(),
});

export const AdminPostUpdateSchema = AdminPostFormSchema.extend({
  id: z.string().min(1),
});

export const IdQuerySchema = z.object({
  id: z.string().min(1),
});

/* -------------------------------
 * 응답 검증 스키마 (출력)
 * ----------------------------- */
const ListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  isPublished: z.boolean(),
  createdAt: z.string(), // ISO
  eventStartAt: z.string().nullable(),
  eventEndAt: z.string().nullable(),
});

const DetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  bodyRaw: z.string().nullable(),
  bodyHtml: z.string().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),

  eventStartAt: z.string().nullable(),
  eventEndAt: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  ctaLinkUrl: z.string().nullable(),
});

export const AdminListResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: z.array(ListItemSchema) }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

export const AdminDetailResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: DetailSchema }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

export const AdminUpdateResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: z.object({ id: z.string() }) }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

/* -------------------------------
 * 간단 sanitize 유틸
 * ----------------------------- */
export function sanitizeHtmlAllowBasic(html: string): string {
  const withoutScripts = html.replace(
    /<\s*(script|style|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ""
  );
  const withoutHandlers = withoutScripts.replace(
    /\son[a-z]+\s*=\s*"[^"]*"/gi,
    ""
  );
  return withoutHandlers;
}
