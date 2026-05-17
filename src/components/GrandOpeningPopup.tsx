"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { XMarkIcon } from "@heroicons/react/24/outline";

const POPUP_KEY = "sgk_grand_open_v1";
const SHOW_UNTIL = new Date("2026-06-16T00:00:00+09:00");

function getVisible(): boolean {
  try {
    if (new Date() > SHOW_UNTIL) return false;
    const raw = localStorage.getItem(POPUP_KEY);
    if (!raw) return true;
    return Date.now() - Number(raw) >= 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function GrandOpeningPopup() {
  // useSyncExternalStore: 서버 스냅샷=false(SSR 미노출), 클라이언트=localStorage 확인
  const shouldShow = useSyncExternalStore(
    () => () => {},
    getVisible,
    () => false
  );
  const [dismissed, setDismissed] = useState(false);

  if (!shouldShow || dismissed) return null;

  function close(remember: boolean) {
    if (remember) {
      try {
        localStorage.setItem(POPUP_KEY, String(Date.now()));
      } catch {}
    }
    setDismissed(true);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={() => close(false)}
    >
      <div
        className="relative bg-white w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => close(false)}
          className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Image
            src="/images/grand_open.png"
            alt="설기옥 선릉 본점 그랜드 오픈"
            width={600}
            height={400}
            className="w-full object-cover"
            priority
          />
        </div>

        <div className="bg-dark text-cream px-6 py-4">
          <p className="text-gold text-[10px] tracking-[0.3em] uppercase mb-1">Grand Opening</p>
          <h2 className="font-serif text-lg font-bold">설기옥 선릉 본점 오픈</h2>
          <p className="text-cream/60 text-xs mt-1">2026년 6월 1일 · 서울 강남구 선릉역</p>
        </div>

        <div className="flex divide-x divide-cream-border border-t border-cream-border bg-white">
          <button
            onClick={() => close(true)}
            className="flex-1 py-3 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            오늘 하루 보지 않기
          </button>
          <Link
            href="/announcements"
            onClick={() => close(false)}
            className="flex-1 py-3 text-xs font-bold text-center text-dark hover:text-gold transition-colors"
          >
            자세히 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
