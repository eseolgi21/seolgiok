"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-dark text-cream/50 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Brand + Nav */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-10 pb-10 border-b border-white/10">
          <div className="space-y-1">
            <p className="font-serif text-xl font-bold text-cream">설기옥</p>
            <p className="text-xs tracking-[0.3em] text-gold/50 uppercase">
              Korean Beef Bone Soup
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/menu" className="hover:text-gold transition-colors">
              {t("nav.menu")}
            </Link>
            <Link href="/about" className="hover:text-gold transition-colors">
              {t("nav.about")}
            </Link>
            <Link href="/location" className="hover:text-gold transition-colors">
              {t("nav.location")}
            </Link>
            <Link
              href="/announcements"
              className="hover:text-gold transition-colors"
            >
              {t("nav.announcements")}
            </Link>
          </nav>
        </div>

        {/* Business Info */}
        <div className="space-y-1.5 text-xs leading-relaxed mb-8">
          <p>
            {t("biz.name")} &nbsp;|&nbsp; {t("biz.ceo")} &nbsp;|&nbsp;{" "}
            {t("biz.regNum")}
          </p>
          <p>{t("biz.address")}</p>
          <p>{t("biz.phone")}</p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-cream/25">
          <p>© 2026 설기옥. {t("copyright")}</p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="hover:text-gold/60 transition-colors"
            >
              {t("links.terms")}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gold/60 transition-colors"
            >
              {t("links.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
