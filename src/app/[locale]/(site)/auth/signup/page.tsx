"use client";

import { SignupForm } from "./view/SignupForm";
import { useTranslations } from "next-intl";
// import Image from "next/image";
// ...
// const bgImage = ...
// const boxBgClass = ...

export default function SignupPage() {
  const t = useTranslations("authSignup");

  return (
    // [1] 전체 컨테이너
    <div className="relative min-h-[calc(100dvh-4rem)] w-full flex items-center justify-center bg-cream selection:bg-gold selection:text-white pb-20">

      <div className="absolute top-0 left-0 w-full h-[300px] bg-dark z-0" />

      {/* [3] 회원가입 카드 컨테이너 */}
      <div className="relative z-10 w-full max-w-[500px] px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-20">
        <div
          className="w-full rounded-none border border-cream-border bg-white shadow-xl flex flex-col"
        >
          {/* 헤더 */}
          <div className="p-8 pb-6 border-b border-cream-border text-center">
            <h1 className="text-3xl font-serif font-bold text-dark mb-2">{t("title")}</h1>
            <p className="text-sm text-gray-500 tracking-wide">{t("subtitle")}</p>
            <div className="w-10 h-px bg-gold mx-auto mt-6" />
          </div>

          {/* 폼 영역 */}
          <div className="p-8 pt-6">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
