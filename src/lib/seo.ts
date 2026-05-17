import type { Metadata } from "next";

const BASE_URL = "https://seolgiok.com";
const OG_IMAGE = "/images/seolgiok_homescreen.png";

const LOCALE_OG_MAP: Record<string, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
  vi: "vi_VN",
};

const ALL_LOCALES = ["ko", "en", "ja", "zh", "vi"] as const;

type ArticleOptions = { publishedTime: string; modifiedTime?: string };

export function buildPageMetadata(
  locale: string,
  pathname: string,
  title: string,
  description?: string,
  article?: ArticleOptions
): Metadata {
  const ogBase = {
    title,
    description,
    url: `${BASE_URL}/${locale}${pathname}`,
    siteName: "설기옥 선릉 본점",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "설기옥 선릉 본점" }],
    locale: LOCALE_OG_MAP[locale] ?? "ko_KR",
  };

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${pathname}`,
      languages: {
        ...Object.fromEntries(ALL_LOCALES.map((l) => [l, `/${l}${pathname}`])),
        "x-default": `/ko${pathname}`,
      },
    },
    openGraph: article
      ? { ...ogBase, type: "article", ...article }
      : { ...ogBase, type: "website" },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
