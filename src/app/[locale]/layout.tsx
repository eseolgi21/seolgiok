import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { locales, type AppLocale } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { HtmlLang } from "@/components/HtmlLang";

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
      <HtmlLang lang={localeParam} />
      {children}
      <Toaster position="top-right" richColors />
    </NextIntlClientProvider>
  );
}
