"use client";

import type { RowPartProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import { useTranslations } from "next-intl";

export function RowPart({
  value,
  onChange,
  disabled,
  errorText,
}: RowPartProps) {
  const t = useTranslations("authSignup");

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, name: e.target.value });
  }

  return (
    <div className="space-y-5 mt-5">
      <div className="w-full">
        <label
          htmlFor="name"
          className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2"
        >
          {t("fields.nickname")}
        </label>
        <input
          id="name"
          className={`w-full bg-cream border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all placeholder:text-gray-400 ${
            errorText?.name ? "border-red-500" : "border-cream-border"
          }`}
          value={value.name}
          onChange={onNameChange}
          autoComplete="name"
          placeholder={t("fields.nicknamePlaceholder")}
          disabled={disabled}
        />
        {errorText?.name && (
          <p className="text-xs text-red-500 mt-1">{errorText.name}</p>
        )}
      </div>
    </div>
  );
}
