"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  GlobeAltIcon,
  ChevronUpIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect, useMemo } from "react";

export type LangCode = "ko" | "en" | "ja" | "zh" | "vi";
export type LangOption = { code: LangCode; label: string; flag: string };

const LANGS: LangOption[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

type LanguageSwitcherProps = {
  variant?: "flag-label" | "icon-label" | "icon-only";
  direction?: "up" | "down";
  align?: "left" | "right";
  triggerClassName?: string;
  itemClassName?: string;
};

export default function LanguageSwitcher({
  variant = "flag-label",
  direction = "up",
  align = "left",
  triggerClassName = "btn btn-ghost gap-2 px-3 h-10 min-h-10",
  itemClassName = "flex items-center gap-2 w-full",
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const current = useMemo<LangOption>(
    () => LANGS.find((l) => l.code === locale) ?? LANGS[0],
    [locale]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const apply = (code: LangCode) => {
    if (code === locale) {
      setIsOpen(false);
      return;
    }

    // 💡 [핵심 수정] 언어 변경 시 브라우저 쿠키에 NEXT_LOCALE 저장 (유효기간 1년)
    // 이렇게 해야 미들웨어가 새로고침 시에도 이 언어를 기억합니다.
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;

    router.replace(pathname, { locale: code });
    setIsOpen(false);
  };

  if (!mounted) {
    return variant === "icon-only" ? (
      <div className="btn btn-ghost btn-circle skeleton h-9 w-9" />
    ) : (
      <div className="btn btn-ghost btn-square skeleton h-9 w-20" />
    );
  }

  const positionClass =
    direction === "up" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${triggerClassName} flex items-center justify-center`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Change Language"
      >
        {variant === "icon-only" ? (
          <GlobeAltIcon className="h-6 w-6" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              {variant === "icon-label" ? (
                <GlobeAltIcon className="h-5 w-5" />
              ) : (
                <span className="text-lg leading-none">{current.flag}</span>
              )}
              <span className="text-sm font-normal">{current.label}</span>
            </div>
            <ChevronUpIcon
              className={`h-3 w-3 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* 드롭다운 메뉴 목록 */}
      {isOpen && (
        <div
          className={`absolute ${positionClass} ${alignClass} w-max min-w-[160px] rounded-lg border border-base-300 bg-base-100 shadow-xl z-[100]`}
        >
          <ul className="menu p-1 gap-0.5" role="listbox">
            {LANGS.map((op) => (
              <li key={op.code}>
                <button
                  type="button"
                  onClick={() => apply(op.code)}
                  className={`${itemClassName} justify-between px-3 py-2 ${
                    op.code === locale ? "active font-bold" : ""
                  }`}
                  role="option"
                  aria-selected={op.code === locale}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{op.flag}</span>
                    <span className="text-sm">{op.label}</span>
                  </div>
                  {op.code === locale && <CheckIcon className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
