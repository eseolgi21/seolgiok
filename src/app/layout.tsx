import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

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
  verification: {
    google: "dgO1zrI88ajwshkH888H9s5u_YecITQ-1MJp-tW7v94",
    other: {
      "naver-site-verification": ["78c73984e6e5294169803b1f14a384f3a243afe1"],
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html data-theme="light" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
