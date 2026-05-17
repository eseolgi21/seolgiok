// src/app/[locale]/(site)/(home)/page.tsx

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, type AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { FaqPageJsonLd } from "@/components/JsonLd";

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
  return buildPageMetadata(locale, "", t("metaTitle"), t("metaDescription"));
}

import { SeolgiokView } from "./views/Seolgiok";
import { GrandOpeningPopup } from "@/components/GrandOpeningPopup";

// ... (existing code)

export default async function HomePage({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home.Seolgiok" });
  const faqItems = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
    { q: t("faqQ5"), a: t("faqA5") },
    { q: t("faqQ6"), a: t("faqA6") },
  ];

  return (
    <>
      <FaqPageJsonLd items={faqItems} />
      <GrandOpeningPopup />
      <SeolgiokView />
    </>
  );
}
