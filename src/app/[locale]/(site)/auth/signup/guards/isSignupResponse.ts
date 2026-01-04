// src/app/[locale]/(site)/auth/signup/guards/signup.ts (가정)

// [수정] import 경로에 [locale] 추가
import type { SignupResponse } from "@/app/[locale]/(site)/auth/signup/types/signup/api";

export function isSignupResponse(v: unknown): v is SignupResponse {
  if (typeof v !== "object" || v === null) return false;
  const r = v as { ok?: unknown };
  return typeof r.ok === "boolean";
}
