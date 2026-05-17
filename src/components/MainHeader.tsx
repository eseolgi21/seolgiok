"use client";

import { Link, usePathname as useIntlPathname } from "@/i18n/routing";
import { useCallback, useState } from "react";
import Image from "next/image";
import { UserCircleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations, useLocale } from "next-intl";

type MainHeaderProps = {
  authed?: boolean;
  userLevel?: number;
};

export default function MainHeader({
  authed = false,
  userLevel = 0,
}: MainHeaderProps) {
  const t = useTranslations("header");
  const locale = useLocale();
  const isManager = Number(userLevel) >= 21;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    setMobileMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.assign(`/${locale}`);
    }
  }, [locale]);

  const pathname = useIntlPathname();

  const isActive = useCallback((href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);

  const navItems = [
    { href: "/about",         label: t("public.about") },
    { href: "/menu",          label: t("public.menu") },
    { href: "/location",      label: t("public.location") },
    { href: "/announcements", label: t("public.announcements") },
  ] as const;

  return (
    <>
    <header className="sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 bg-white/90 border-gray-200">
      <div className="navbar h-20 container mx-auto px-3 sm:px-6">

        {/* 로고 */}
        <div className="navbar-start shrink-0 w-auto">
          <Link href="/" aria-label={t("aria.home")} className="inline-flex items-center lg:-ml-2">
            <Image
              src="/images/logo.png"
              alt="설기옥"
              width={1280}
              height={424}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* PC 중앙 메뉴 */}
        <div className="navbar-center hidden lg:flex items-center justify-center flex-1 min-w-0">
          <ul className="menu menu-horizontal px-1 gap-2">
            {navItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-base font-medium transition-colors hover:text-gold hover:bg-transparent whitespace-nowrap px-4 py-2 ${
                    isActive(href) ? "text-gold font-bold" : "text-gray-700"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 오른쪽 버튼 영역 */}
        <div className="navbar-end flex items-center gap-2 w-auto shrink-0 ml-auto">
          {isManager && (
            <Link
              href="/admin/dashboard"
              className="hidden sm:inline-flex btn btn-outline mr-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-black whitespace-nowrap rounded-none text-sm"
            >
              {t("auth.admin")}
            </Link>
          )}

          <LanguageSwitcher
            variant="icon-only"
            direction="down"
            align="right"
            triggerClassName="btn btn-ghost btn-circle btn-md"
          />

          {/* PC 전용: 로그인/회원가입 or UserCircle */}
          {!authed ? (
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/auth/signup"
                className="btn border border-gold bg-transparent text-gold hover:bg-gold hover:text-cream px-5 font-normal rounded-none transition-colors text-sm whitespace-nowrap uppercase tracking-wider"
              >
                {t("auth.signup")}
              </Link>
              <Link
                href="/auth/login"
                className="btn bg-dark hover:bg-dark-hover text-gold border border-dark px-5 font-normal rounded-none transition-colors shadow-sm text-sm whitespace-nowrap uppercase tracking-wider"
              >
                {t("auth.login")}
              </Link>
            </div>
          ) : (
            <div className="hidden lg:flex dropdown dropdown-end dropdown-hover">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-md text-gray-700 hover:bg-gray-100">
                <UserCircleIcon className="h-7 w-7" aria-hidden />
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-white rounded-none z-[1] w-52 p-2 shadow-lg border border-[#e5e0d4]">
                {isManager && (
                  <li>
                    <Link href="/admin" className="text-gray-700 hover:text-gold hover:bg-transparent rounded-none px-3 py-2 font-medium">
                      {t("auth.admin")}
                    </Link>
                  </li>
                )}
                {navItems.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`hover:text-gold hover:bg-transparent rounded-none px-3 py-2 font-medium ${
                        isActive(href) ? "text-gold font-bold" : "text-gray-700"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <div className="h-px bg-cream-border my-1" />
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gold hover:bg-transparent rounded-none px-3 py-2 font-medium w-full text-left"
                  >
                    {t("auth.logout")}
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* 모바일 전용: 햄버거 버튼 */}
          <button
            className="flex lg:hidden btn btn-ghost btn-circle btn-md text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label="메뉴 열기"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>

      {/* 모바일 사이드 드로어 — header 바깥에 portal처럼 렌더 */}
      <div className="lg:hidden">
        {/* 오버레이 */}
        <div
          className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />

        {/* 드로어 패널 */}
        <div
          className={`fixed top-0 right-0 z-[70] h-full w-72 bg-dark text-cream shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* 드로어 헤더 */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <p className="text-gold text-xs tracking-[0.3em] uppercase">SEOLGIOK</p>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-ghost btn-circle btn-sm text-cream hover:bg-white/10"
              aria-label="메뉴 닫기"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* 내비게이션 */}
          <nav className="flex flex-col flex-1 py-6 overflow-y-auto">
            {isManager && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-4 text-sm font-medium tracking-wide text-gold/80 hover:text-gold hover:bg-white/5 transition-colors"
              >
                {t("auth.admin")}
              </Link>
            )}
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-6 py-4 text-sm font-medium tracking-wide transition-colors hover:bg-white/5 ${
                  isActive(href) ? "text-gold font-bold border-r-2 border-gold" : "text-cream/80 hover:text-cream"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* 인증 버튼 */}
          <div className="px-6 py-6 border-t border-white/10 space-y-3">
            {!authed ? (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 text-sm font-bold uppercase tracking-widest border border-cream/30 text-cream hover:bg-white/10 transition-colors"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 text-sm font-bold uppercase tracking-widest bg-gold text-cream hover:bg-gold-hover transition-colors"
                >
                  {t("auth.signup")}
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full text-center py-3 text-sm font-bold uppercase tracking-widest border border-cream/30 text-cream hover:bg-white/10 transition-colors"
              >
                {t("auth.logout")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
