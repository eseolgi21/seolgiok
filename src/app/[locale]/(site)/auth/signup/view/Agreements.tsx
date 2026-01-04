"use client";

import type { AgreementsProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import Link from "next/link";
import { useTranslations } from "next-intl"; // [추가] 번역 훅 import

export function Agreements({
  agreeTerms,
  agreePrivacy,
  onChangeTerms,
  onChangePrivacy,
  submitted,
  disabled,
  agreementsOk,
}: AgreementsProps) {
  // [추가] 'authSignup' 네임스페이스 사용
  const t = useTranslations("authSignup");

  // 체크박스 스타일 (체크되었을 때 골드색 링/텍스트)
  const checkboxClass =
    "h-4 w-4 rounded border-gray-300 bg-white text-[#d4b886] focus:ring-[#d4b886] focus:ring-offset-0 cursor-pointer disabled:opacity-50 checked:bg-[#d4b886] checked:border-transparent accent-[#d4b886]";

  // [스타일 변경] 링크 스타일: text-[#d4b886] 적용
  const linkClass =
    "text-[#d4b886] hover:text-[#b09668] hover:underline ml-1 font-medium transition-colors";

  return (
    <div className="space-y-3 pt-2">
      {/* 이용약관 동의 */}
      <label className="flex cursor-pointer items-center gap-3 group">
        <input
          type="checkbox"
          className={checkboxClass}
          checked={agreeTerms}
          onChange={(e) => onChangeTerms(e.target.checked)}
          disabled={disabled}
        />
        <span className="text-sm text-gray-600 group-hover:text-black transition-colors">
          {/* [수정] "이용약관에 동의합니다." -> t("agreements.terms") */}
          {t("agreements.terms")}
          <Link href="/terms" className={linkClass}>
            {/* [수정] "(보기)" -> t("agreements.view") */}
            {t("agreements.view")}
          </Link>
        </span>
      </label>

      {/* 개인정보 동의 */}
      <label className="flex cursor-pointer items-center gap-3 group">
        <input
          type="checkbox"
          className={checkboxClass}
          checked={agreePrivacy}
          onChange={(e) => onChangePrivacy(e.target.checked)}
          disabled={disabled}
        />
        <span className="text-sm text-gray-600 group-hover:text-black transition-colors">
          {/* [수정] "개인정보 이용 정책에 동의합니다." -> t("agreements.privacy") */}
          {t("agreements.privacy")}
          <Link href="/privacy" className={linkClass}>
            {/* [수정] "(보기)" -> t("agreements.view") */}
            {t("agreements.view")}
          </Link>
        </span>
      </label>

      {/* 에러 메시지 */}
      {submitted && !agreementsOk && (
        <div className="text-xs text-red-500 mt-1 pl-1">
          {/* [수정] "* 필수 동의 항목에 체크해 주세요." -> t("agreements.required") */}
          {t("agreements.required")}
        </div>
      )}
    </div>
  );
}
