"use client";

import { Link, usePathname as useIntlPathname } from "@/i18n/routing";
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/outline";
// import MainMenuDropdown from "@/components/MainMenuDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations, useLocale } from "next-intl"; // 💡 [추가] useLocale import

// import GlobXlogoImage from "../../public/GlobXlogo.png";
// import QuantylogoImage from "../../public/Quantylogo.png";

// 환경변수에 따라 로고 이미지 결정
// const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME;
// const logoImage = BRAND === "Quanty" ? QuantylogoImage : GlobXlogoImage;

type MainHeaderProps = {
  authed?: boolean;
  userLevel?: number;
};

export default function MainHeader({
  authed = false,
  userLevel = 0,
}: MainHeaderProps) {
  const t = useTranslations("header");
  const locale = useLocale(); // 💡 [추가] 현재 언어 가져오기
  const isManager = Number(userLevel) >= 21;

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      // 💡 [핵심 수정] 로그아웃 시 무조건 루트('/')가 아니라, 현재 언어 경로('/ko', '/en' 등)로 이동
      // 이렇게 해야 로그아웃 후에도 언어가 유지됩니다.
      window.location.assign(`/${locale}`);
    }
  }, [locale]);

  const pathname = useIntlPathname();

  const isActive = useCallback((href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);

  // const PUBLIC_MENU = useMemo(() => [
  //   { href: "/", label: t("public.about") },
  //   { href: "/announcements", label: t("public.announcements") },
  //   { href: "/cases", label: t("public.cases") },
  //   { href: "/events", label: t("public.events") },
  //   { href: "/help", label: t("public.help") },
  // ], [t]);

  // const APP_MENU = useMemo(() => [
  //   { href: "/bot-guide", label: t("app.botGuide") },
  //   { href: "/bot-config", label: t("app.botConfig") },
  //   { href: "/strategy-config", label: t("app.strategyConfig") },
  //   { href: "/history", label: t("app.history") },
  //   { href: "/my-config", label: t("app.apiConfig") },
  // ], [t]);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300
        bg-white/90 border-gray-200
        [:root[data-theme=dark]_&]:bg-black
        [:root[data-theme=dark]_&]:border-white/10"
    >
      <div className="navbar h-16 container mx-auto px-4">
        {/* [1] 왼쪽: 로고 영역 */}
        <div className="navbar-start shrink-0 w-auto">
          <Link
            href="/"
            aria-label={t("aria.home")}
            className="inline-flex items-center lg:-ml-4 group"
          >
            {/* [수정] 텍스트 로고로 변경 */}
            <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 [:root[data-theme=dark]_&]:text-white">
              설기옥
            </h1>
          </Link>
        </div>

        {/* [2] 중앙: 메뉴 영역 (PC: xl 이상 보임 / Mobile: 숨김) */}
        <div className="navbar-center hidden xl:flex items-center justify-center flex-1 min-w-0">
          <ul className="menu menu-horizontal px-1 gap-1">
            {/* 
                User Request: "중간 메뉴들을 모두 삭제하고 소개 메뉴만 남기고 소개메뉴는 홈으로 가게 해줘" 
                Assuming "Introduction" maps to t("public.about") or similar. 
                Existing public.about href was "/".
             */}
            <li>
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-[#d4b886] hover:bg-transparent hover:underline whitespace-nowrap px-3 ${isActive("/")
                  ? "text-[#d4b886] font-bold"
                  : "text-gray-700 [:root[data-theme=dark]_&]:text-gray-300"
                  }`}
              >
                {/* "소개" or t("public.about") */}
                {t("public.about")}
              </Link>
            </li>
          </ul>
        </div>

        {/* [3] 오른쪽: 버튼 영역 */}
        <div className="navbar-end flex items-center gap-2 w-auto shrink-0 ml-auto">
          {isManager && (
            <Link
              href="/admin/dashboard"
              className="hidden sm:inline-flex btn btn-sm btn-outline mr-2
                border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-black
                [:root[data-theme=dark]_&]:border-white/30 [:root[data-theme=dark]_&]:text-gray-300 [:root[data-theme=dark]_&]:hover:bg-white/10 [:root[data-theme=dark]_&]:hover:text-white
                whitespace-nowrap"
            >
              {t("auth.admin")}
            </Link>
          )}

          <LanguageSwitcher
            variant="icon-only"
            direction="down"
            align="right"
            triggerClassName="btn btn-ghost btn-circle"
          />

          {!authed ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/auth/signup"
                className="btn btn-sm border border-[#d4b886] bg-transparent text-[#d4b886] hover:bg-[#d4b886] hover:text-white px-3 sm:px-4 font-normal rounded-none transition-colors text-xs sm:text-sm whitespace-nowrap uppercase tracking-wider"
              >
                {t("auth.signup")}
              </Link>
              <Link
                href="/auth/login"
                className="btn btn-sm bg-[#1a1a1a] hover:bg-[#333] text-[#d4b886] border border-[#1a1a1a] px-3 sm:px-4 font-normal rounded-none transition-colors shadow-sm text-xs sm:text-sm whitespace-nowrap uppercase tracking-wider"
              >
                {t("auth.login")}
              </Link>
            </div>
          ) : (
            // 💡 [수정] 모바일에서도 항상 보이도록 'hidden sm:inline-flex' -> 'inline-flex'로 변경
            <div className="dropdown dropdown-end dropdown-hover">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle inline-flex text-gray-700 hover:bg-gray-100 [:root[data-theme=dark]_&]:text-gray-300 [:root[data-theme=dark]_&]:hover:text-white [:root[data-theme=dark]_&]:hover:bg-white/10"
              >
                <UserCircleIcon className="h-6 w-6" aria-hidden />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-white rounded-none z-[1] w-52 p-2 shadow-lg border border-[#e5e0d4]"
              >
                {/* 1. 관리 메뉴 (레벨 21 이상) */}
                {isManager && (
                  <li>
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-[#d4b886] hover:bg-transparent rounded-none px-3 py-2 font-medium"
                    >
                      {t("auth.admin")}
                    </Link>
                  </li>
                )}

                {/* 2. 프로젝트 소개 */}
                <li>
                  <Link
                    href="/"
                    className="text-gray-700 hover:text-[#d4b886] hover:bg-transparent rounded-none px-3 py-2 font-medium"
                  >
                    {t("public.about")}
                  </Link>
                </li>

                <div className="h-px bg-[#f0ebe0] my-1" />

                {/* 3. 로그아웃 (맨 하단) */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-[#d4b886] hover:bg-transparent rounded-none px-3 py-2 font-medium w-full text-left"
                  >
                    {t("auth.logout")}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
