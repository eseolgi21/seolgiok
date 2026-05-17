import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";
import { locales, type AppLocale } from "@/i18n/routing";
import { ToastProvider } from "@/components/ui";

const inter = Inter({ subsets: ["latin"] });

function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export const metadata: Metadata = {
  metadataBase: new URL("https://seolgiok.com"),
  title: {
    default: "설기옥 선릉 본점 — 정성의 시간",
    template: "%s",
  },
  openGraph: {
    siteName: "설기옥 선릉 본점",
    images: [{ url: "/images/seolgiok_homescreen.png", width: 1200, height: 630, alt: "설기옥 선릉 본점" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/seolgiok_homescreen.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

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
    <html
      lang={localeParam}
      data-theme="light"
      className={inter.className}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={localeParam} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
