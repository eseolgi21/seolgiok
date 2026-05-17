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

export async function generateMetadata({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "authLogin.Seolgiok" });

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
