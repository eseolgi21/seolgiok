// src/app/admin/boards/announcements/gaurd/announcements.ts
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

/* -------------------------------
 * 요청 검증 스키마 (입력)
 * ----------------------------- */
export const AdminPostFormSchema = z.object({
  title: z.string().min(1).max(200),
  bodyRaw: z.string().optional().default(""),
  bodyHtml: z.string().min(0),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  isPublished: z.boolean(),
});

export const AdminPostUpdateSchema = AdminPostFormSchema.extend({
  id: z.string().min(1),
});

export const IdQuerySchema = z.object({
  id: z.string().min(1),
});

/* -------------------------------
 * 응답 검증 스키마 (출력)
 *  - 클라이언트 훅에서 런타임 검증에 사용
 * ----------------------------- */
// 목록 아이템
const ListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  isPublished: z.boolean(),
  createdAt: z.string(), // ISO 문자열
});

// 상세 보기
const DetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  bodyRaw: z.string().nullable(),
  bodyHtml: z.string().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(), // ISO | null
  createdAt: z.string(), // ISO
  updatedAt: z.string(), // ISO
});

// 공통 응답(discriminated union)
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
 * sanitize 유틸 — sanitize-html 라이브러리 기반
 * ----------------------------- */
export function sanitizeHtmlAllowBasic(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "img": ["src", "alt", "width", "height"],
      "a": ["href", "name", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}
