// src/app/[locale]/layout.tsx

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";
import { notFound } from "next/navigation";

import { locales, type AppLocale } from "@/i18n/routing";
import { ToastProvider } from "@/components/ui";

export const metadata = {
  title: "설기옥 - 정성의 시간",
  description: "24시간의 기다림이 빚어낸 맑고 깊은 한 그릇",
};

function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const localeParam = resolvedParams.locale;

  if (!isAppLocale(localeParam)) {
    notFound();
  }

  setRequestLocale(localeParam);

  const messages = await getMessages({ locale: localeParam });

  return (
    <NextIntlClientProvider locale={localeParam} messages={messages}>
      <ToastProvider>{children}</ToastProvider>
    </NextIntlClientProvider>
  );
}
