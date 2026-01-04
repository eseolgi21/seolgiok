// src/app/[locale]/admin/boards/events/types/index.ts
import { PostVisibility } from "@/generated/prisma";

export interface AdminPostListItem {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string; // ISO
  eventStartAt: string | null; // ISO|null
  eventEndAt: string | null; // ISO|null
}

export interface AdminPostDetail {
  id: string;
  title: string;
  bodyRaw: string | null;
  bodyHtml: string | null;
  visibility: keyof typeof PostVisibility extends never
    ? "PUBLIC" | "PRIVATE"
    : "PUBLIC" | "PRIVATE";
  isPublished: boolean;
  publishedAt: string | null; // ISO|null
  createdAt: string; // ISO
  updatedAt: string; // ISO

  eventStartAt: string | null;
  eventEndAt: string | null;
  bannerUrl: string | null;
  ctaLinkUrl: string | null;
}

export interface AdminPostFormInput {
  title: string;
  bodyRaw: string;
  bodyHtml: string;
  visibility: "PUBLIC" | "PRIVATE";
  isPublished: boolean;

  eventStartAt?: string | null; // ISO string
  eventEndAt?: string | null; // ISO string
  bannerUrl?: string | null;
  ctaLinkUrl?: string | null;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: string;
}

export type AdminListResult = ApiOk<AdminPostListItem[]> | ApiErr;
export type AdminDetailResult = ApiOk<AdminPostDetail> | ApiErr;
export type AdminUpdateResult = ApiOk<{ id: string }> | ApiErr;
