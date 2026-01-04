"use client";

import { Button } from "@/components/ui";
import type { SubmitBarProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import { useTranslations } from "next-intl"; // [추가] 번역 훅 import

export function SubmitBar({ loading, disabled }: SubmitBarProps) {
  // [추가] 'authSignup' 네임스페이스 사용
  const t = useTranslations("authSignup");

  return (
    <div className="pt-4">
      <Button
        type="submit"
        disabled={loading || disabled}
        // [스타일 변경] 설기옥 테마 적용 (Black & Gold)
        className={`
          h-12 w-full rounded-none text-base font-bold text-[#d4b886] shadow-md transition-all border border-[#1a1a1a]
          ${disabled
            ? "bg-[#e5e5e5] text-gray-400 border-transparent cursor-not-allowed"
            : "bg-[#1a1a1a] hover:bg-[#333] hover:text-white"
          }
          uppercase tracking-widest
        `}
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm text-[#d4b886]" />
        ) : (
          t("buttons.submit")
        )}
      </Button>
    </div>
  );
}
