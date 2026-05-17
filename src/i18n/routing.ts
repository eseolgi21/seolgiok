// src/i18n/routing.ts
import { createNavigation } from "next-intl/navigation";

export const locales = ["ko", "en", "ja", "zh", "vi"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "ko";

export const routing = {
  locales,
  defaultLocale,
  localeDetection: false, // Accept-Language 헤더 무시 (쿠키는 proxy.ts에서 직접 처리)
};

export const { Link, useRouter, usePathname, redirect } = createNavigation(routing);
