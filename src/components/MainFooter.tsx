// src/components/MainFooter.tsx
"use client";

// [핵심 수정] next/link 대신 @/i18n/routing의 Link와 usePathname 사용
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl"; // [추가] 번역 훅
import type { ReactNode } from "react";
import {
  WrenchScrewdriverIcon, // 봇 설정
  AdjustmentsHorizontalIcon, // 전략 설정
  Squares2X2Icon, // 대시보드
  ClockIcon, // 히스토리
  UserCircleIcon, // 개인 설정
} from "@heroicons/react/24/outline";

type Tab = {
  href: string;
  label: string;
  key: string;
  icon: ReactNode;
};

const ICON = "h-5 w-5";
const ICON_HOME = "h-6 w-6";

export default function MainFooter() {
  // [수정] next/navigation의 usePathname 대신 @/i18n/routing의 usePathname 사용
  const pathname = usePathname();
  // [추가] 'header' 네임스페이스(header.json)를 사용하여 번역 함수 생성
  const t = useTranslations("header");

  const isActive = (href: string): boolean => {
    // next-intl의 usePathname을 사용하므로, locale 접두사는 자동으로 제거됩니다.
    // 하지만, URL이 locale 접두사를 포함한 채로 넘어올 경우를 대비하여
    // '/'로 시작하는 경로만 비교합니다.
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // [핵심 수정] t 함수를 사용하여 텍스트를 다국어 처리
  const tabs: Tab[] = [
    {
      href: "/bot-config",
      label: t("app.botConfig"), // 봇 설정 (번역 적용)
      key: "bot-config",
      icon: <WrenchScrewdriverIcon className={ICON} aria-hidden />,
    },
    {
      href: "/strategy-config",
      label: t("app.strategyConfig"), // 전략 설정 (번역 적용)
      key: "strategy-config",
      icon: <AdjustmentsHorizontalIcon className={ICON} aria-hidden />,
    },
    {
      href: "/",
      label: t("app.dashboard"), // 대시보드 (번역 적용)
      key: "dashboard",
      icon: <Squares2X2Icon className={ICON_HOME} aria-hidden />,
    },
    {
      href: "/history",
      label: t("app.history"), // 히스토리 (번역 적용)
      key: "history",
      icon: <ClockIcon className={ICON} aria-hidden />,
    },
    {
      href: "/my-config",
      label: t("app.myConfig"), // 개인 설정 (번역 적용)
      key: "my-config",
      icon: <UserCircleIcon className={ICON} aria-hidden />,
    },
  ];

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40
        bg-base-100 border-t border-base-300
        py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]
      "
      aria-label={t("aria.footerNav") ?? "하단 내비게이션"} // [번역 적용]
    >
      <ul className="grid grid-cols-5 gap-2 px-2">
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <li key={t.key}>
              {/* [핵심 수정] @/i18n/routing의 Link 컴포넌트 사용 */}
              <Link
                href={t.href}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={`
                  flex flex-col items-center justify-center
                  gap-1 rounded-xl
                  min-h-12 py-2
                  text-[11px]
                  transition-colors
                  ${
                    active
                      ? "bg-base-200 text-base-content"
                      : "text-base-content/70 hover:bg-base-200"
                  }
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                `}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
