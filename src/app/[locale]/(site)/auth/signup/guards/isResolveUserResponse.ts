// src/app/[locale]/(site)/auth/signup/gaurd/api.ts (가정)

// [수정] import 경로에 [locale] 추가
import type { ResolveUserResponse } from "@/app/[locale]/(site)/auth/signup/types/signup/api";

export function isResolveUserResponse(v: unknown): v is ResolveUserResponse {
  if (typeof v !== "object" || v === null) return false;
  const r = v as { ok?: unknown };
  return typeof r.ok === "boolean";
}
