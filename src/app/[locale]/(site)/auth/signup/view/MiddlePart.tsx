"use client";

import type { MiddlePartProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import { useTranslations } from "next-intl"; // [추가] 번역 훅 import

export function MiddlePart({
  password,
  password2,
  onPasswordChange,
  onPassword2Change,
  disabled,
  checklist,
}: MiddlePartProps) {
  // [추가] 'authSignup' 네임스페이스 사용
  const t = useTranslations("authSignup");

  return (
    <div className="space-y-5 mt-5">
      {/* 비밀번호 입력 필드 */}
      <div className="w-full">
        <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.password")}
        </label>
        <input
          id="password"
          type="password"
          className="w-full bg-[#fdfbf7] border border-[#e5e0d4] px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all placeholder:text-gray-400"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={t("fields.passwordPlaceholder")}
          aria-describedby="pw-help"
          disabled={disabled}
        />

        {/* 비밀번호 유효성 체크리스트 */}
        <ul
          id="pw-help"
          className="mt-3 flex flex-wrap gap-x-4 gap-y-1"
        >
          <li className={`text-xs flex items-center gap-1 ${checklist.len ? "text-[#d4b886] font-medium" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${checklist.len ? "bg-[#d4b886]" : "bg-gray-300"}`} />
            {t("checklist.len")}
          </li>
          <li className={`text-xs flex items-center gap-1 ${checklist.letter ? "text-[#d4b886] font-medium" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${checklist.letter ? "bg-[#d4b886]" : "bg-gray-300"}`} />
            {t("checklist.letter")}
          </li>
          <li className={`text-xs flex items-center gap-1 ${checklist.digit ? "text-[#d4b886] font-medium" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${checklist.digit ? "bg-[#d4b886]" : "bg-gray-300"}`} />
            {t("checklist.digit")}
          </li>
          <li className={`text-xs flex items-center gap-1 ${checklist.upper ? "text-[#d4b886] font-medium" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${checklist.upper ? "bg-[#d4b886]" : "bg-gray-300"}`} />
            {t("checklist.upper")}
          </li>
          <li className={`text-xs flex items-center gap-1 ${checklist.symbol ? "text-[#d4b886] font-medium" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${checklist.symbol ? "bg-[#d4b886]" : "bg-gray-300"}`} />
            {t("checklist.symbol")}
          </li>
          {checklist.confirmShown && !checklist.confirmOk && (
            <li className="text-xs text-red-500 flex items-center gap-1 w-full mt-1">
              ⚠️ {t("checklist.mismatch")}
            </li>
          )}
        </ul>
      </div>

      {/* 비밀번호 확인 필드 */}
      <div className="w-full">
        <label htmlFor="password2" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.confirmPassword")}
        </label>
        <input
          id="password2"
          type="password"
          className="w-full bg-[#fdfbf7] border border-[#e5e0d4] px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all placeholder:text-gray-400"
          value={password2}
          onChange={(e) => onPassword2Change(e.target.value)}
          placeholder={t("fields.confirmPasswordPlaceholder")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
