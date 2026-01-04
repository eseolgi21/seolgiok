import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, type AppLocale } from "@/i18n/routing";
import { SeolgiokLogin } from "./views/Seolgiok";

type Props = {
  params: Promise<{ locale: string }>;
};

function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

// .env 파일의 브랜드 네임 그대로 사용
const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME;

export async function generateMetadata({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isAppLocale(locale)) {
    return {};
  }

  // 브랜드에 따른 JSON 키 결정 (대소문자 구분)
  const jsonKey = BRAND_NAME === "Quanty" ? "Quanty" : "GlobX";

  // authLogin.json 내부의 해당 브랜드 키 참조
  const t = await getTranslations({
    locale,
    namespace: `authLogin.${jsonKey}`,
  });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function LoginPage({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // 브랜드에 따라 뷰 컴포넌트 분기
  return <SeolgiokLogin />;
}
