"use client";

import type { TopPartProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import { useTranslations } from "next-intl";

export function TopPart({
  value,
  onChange,
  disabled,
  errorText,
}: TopPartProps) {
  const t = useTranslations("authSignup");

  function onEmail(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, email: e.target.value });
  }

  return (
    <div className="space-y-5">
      {/* 이메일 입력 필드 */}
      <div className="w-full">
        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.email")}
        </label>
        <input
          id="email"
          type="email"
          className={`w-full bg-cream border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all placeholder:text-gray-400 ${errorText?.email ? "border-red-500" : "border-cream-border"
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
