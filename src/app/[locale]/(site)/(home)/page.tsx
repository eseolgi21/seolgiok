// src/app/[locale]/(site)/(home)/page.tsx

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, type AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

// 허용된 로케일인지 확인하는 함수
function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isAppLocale(locale)) {
    return {};
  }

  // Seolgiok
  const t = await getTranslations({ locale, namespace: "home.Seolgiok" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

import { SeolgiokView } from "./views/Seolgiok";

// ... (existing code)

export default async function HomePage({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // 강제로 설기옥 뷰 보여주거나 BRAND_NAME 로직에 추가
  // User asked to make introduction page, assuming it replaces the default or is conditioned.
  // Given the explicit request "make introduction page", I will set it as default or use it directly.
  // But to be safe and clear, I'll just render it directly for now as requested.
  // Or simpler:
  return <SeolgiokView />;
}
