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
    <div className="relative min-h-[calc(100dvh-4rem)] w-full flex items-center justify-center bg-[#fdfbf7] selection:bg-[#d4b886] selection:text-white pb-20">

      {/* Background decoration or image if needed, for now just clean color or split */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-[#1a1a1a] z-0" />

      {/* [3] 회원가입 카드 컨테이너 */}
      <div className="relative z-10 w-full max-w-[500px] px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-20">
        <div
          className="w-full rounded-none border border-[#e5e0d4] bg-white shadow-xl flex flex-col"
        >
          {/* 헤더 */}
          <div className="p-8 pb-6 border-b border-[#f0ebe0] text-center">
            <h1 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-2">{t("title")}</h1>
            <p className="text-sm text-gray-500 tracking-wide">{t("subtitle")}</p>
            <div className="w-10 h-px bg-[#d4b886] mx-auto mt-6" />
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
