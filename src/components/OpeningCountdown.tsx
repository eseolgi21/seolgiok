"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const OPENING_DATE = new Date("2026-06-01T00:00:00+09:00");

function calcDaysLeft() {
  const diff = OPENING_DATE.getTime() - Date.now();
  if (diff > 0) return Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (diff > -86_400_000) return 0; // 오픈 당일
  return -1; // 오픈 후 → 배너 숨김
}

export function OpeningCountdown() {
  const t = useTranslations("location.opening");
  const [daysLeft, setDaysLeft] = useState(calcDaysLeft);

  useEffect(() => {
    const id = setInterval(() => setDaysLeft(calcDaysLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (daysLeft < 0) return null;

  return (
    <div className="w-full bg-dark text-cream border-b border-gold/30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-4 text-center">
        <span className="w-3 h-3 rounded-full bg-gold animate-pulse shrink-0" />
        <span className="text-base md:text-lg font-semibold tracking-wide">{t("banner")}</span>
        <span className="text-gold/50 hidden sm:inline text-lg">—</span>
        {daysLeft === 0 ? (
          <span className="text-base md:text-lg font-bold text-gold">{t("today")}</span>
        ) : (
          <span className="text-base md:text-lg font-bold text-gold" suppressHydrationWarning>
            {t("dDay")} D-{daysLeft}
          </span>
        )}
      </div>
    </div>
  );
}
