"use client";

import type { TopPartProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import { useTranslations } from "next-intl"; // [추가] 번역 훅 import

export function TopPart({
  value,
  onChange,
  disabled,
  errorText,
}: TopPartProps) {
  // [추가] 'authSignup' 네임스페이스 사용
  const t = useTranslations("authSignup");

  function onUsername(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, username: e.target.value });
  }
  function onEmail(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, email: e.target.value });
  }

  return (
    <div className="space-y-5">
      {/* 아이디 입력 필드 */}
      <div className="w-full">
        <label htmlFor="username" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.username")}
        </label>
        <input
          id="username"
          className={`w-full bg-[#fdfbf7] border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all placeholder:text-gray-400 ${errorText?.username ? "border-red-500" : "border-[#e5e0d4]"
            }`}
          value={value.username}
          onChange={onUsername}
          autoComplete="username"
          placeholder={t("fields.usernamePlaceholder")}
          disabled={disabled}
        />
        {errorText?.username && (
          <p className="text-xs text-red-500 mt-1">{errorText.username}</p>
        )}
      </div>

      {/* 이메일 입력 필드 */}
      <div className="w-full">
        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.email")}
        </label>
        <input
          id="email"
          type="email"
          className={`w-full bg-[#fdfbf7] border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all placeholder:text-gray-400 ${errorText?.email ? "border-red-500" : "border-[#e5e0d4]"
            }`}
          value={value.email}
          onChange={onEmail}
          autoComplete="email"
          placeholder={t("fields.emailPlaceholder")}
          disabled={disabled}
        />
        {errorText?.email && (
          <p className="text-xs text-red-500 mt-1">{errorText.email}</p>
        )}
      </div>
    </div>
  );
}
