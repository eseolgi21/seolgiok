"use client";

import type { RowPartProps } from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import { useState } from "react";
import { resolveUser } from "@/app/[locale]/(site)/auth/signup/utils/api";
import { useToast } from "@/components/ui/feedback/Toast-provider";
import { useTranslations } from "next-intl"; // [추가] 번역 훅 import

export function RowPart({
  value,
  onChange,
  options,
  disabled,
  errorText,
}: RowPartProps) {
  // [추가] 'authSignup' 네임스페이스 사용
  const t = useTranslations("authSignup");
  const { toast } = useToast();
  const [status, setStatus] = useState<null | "ok" | "fail">(null);

  async function onSearch(): Promise<void> {
    setStatus(null);
    const user = await resolveUser(value.ref);
    const ok = Boolean(user);
    setStatus(ok ? "ok" : "fail");

    // [수정] 토스트 메시지 다국어 적용
    toast({
      title: t("messages.checkRefTitle"), // "추천인 확인"
      description: ok
        ? t("messages.validReferrer") // "유효한 추천인입니다."
        : t("messages.invalidReferrer"), // "추천인을 찾을 수 없습니다."
      variant: ok ? "success" : "error",
      position: "top-right",
      duration: ok ? 2000 : 2500,
    });
  }

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, name: e.target.value });
  }
  function onCountryChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const next = (e.target.value ?? "").toUpperCase();
    onChange({ ...value, countryCode: next });
  }
  function onRefChange(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, ref: e.target.value });
    setStatus(null);
  }

  return (
    <div className="space-y-5 mt-5">
      {/* 닉네임 입력 */}
      <div className="w-full">
        <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.nickname")}
        </label>
        <input
          id="name"
          className={`w-full bg-[#fdfbf7] border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all placeholder:text-gray-400 ${errorText?.name ? "border-red-500" : "border-[#e5e0d4]"
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

      {/* 국가 선택 */}
      <div className="w-full">
        <label htmlFor="countryCode" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.country")}
        </label>
        <div className="relative">
          <select
            id="countryCode"
            className={`w-full bg-[#fdfbf7] border px-4 py-3 text-gray-900 rounded-none appearance-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all ${errorText?.countryCode ? "border-red-500" : "border-[#e5e0d4]"
              }`}
            value={value.countryCode}
            onChange={onCountryChange}
            disabled={disabled}
          >
            {options.map((op) => (
              <option key={op.value} value={op.value}>
                {op.value === "" ? t("fields.countryPlaceholder") : op.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
        {errorText?.countryCode && (
          <p className="text-xs text-red-500 mt-1">{errorText.countryCode}</p>
        )}
      </div>

      {/* 추천인 입력 */}
      <div className="w-full">
        <label htmlFor="ref" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {t("fields.referrer")}
        </label>
        <div className="flex gap-0">
          <input
            id="ref"
            className={`w-full bg-[#fdfbf7] border-y border-l px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886] transition-all placeholder:text-gray-400 ${errorText?.ref ? "border-red-500" : "border-[#e5e0d4]"
              }`}
            value={value.ref}
            onChange={onRefChange}
            placeholder={t("fields.referrerPlaceholder")}
            disabled={disabled}
            aria-describedby="ref-help"
          />
          <button
            type="button"
            className={`px-6 font-bold text-sm uppercase tracking-wide transition-colors border border-[#1a1a1a] ${disabled || value.ref.trim().length === 0
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-[#1a1a1a] text-[#d4b886] hover:bg-[#333] hover:text-white"
              }`}
            onClick={onSearch}
            disabled={disabled || value.ref.trim().length === 0}
            aria-label={t("fields.search")}
          >
            {t("fields.search")}
          </button>
        </div>

        {/* 상태 메시지 */}
        {status === "ok" ? (
          <p id="ref-help" className="text-xs text-[#d4b886] mt-1 font-medium">
            {t("messages.validReferrer")}
          </p>
        ) : status === "fail" ? (
          <p id="ref-help" className="text-xs text-red-500 mt-1">
            {t("messages.invalidReferrer")}
          </p>
        ) : null}

        {errorText?.ref && (
          <p className="text-xs text-red-500 mt-1">{errorText.ref}</p>
        )}
      </div>
    </div>
  );
}
