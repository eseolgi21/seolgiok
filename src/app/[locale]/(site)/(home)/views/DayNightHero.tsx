"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const DAY_BG    = "#EFE3D2";
const NIGHT_BG  = "#3A2A22";
const DAY_TEXT  = "#6E2F2F";
const NIGHT_TEXT = "#B08A57";

export function DayNightHero() {
  const [split, setSplit] = useState(50);
  const [hinted, setHinted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const update = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSplit(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)));
    setHinted(true);
  }, []);

  // 수평 스와이프일 때만 스크롤 방지
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isHorizontal = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isHorizontal === null) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 4 || dy > 4) isHorizontal = dx > dy;
      }
      if (isHorizontal) {
        e.preventDefault();
        update(e.touches[0].clientX);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [update]);

  return (
    <section
      ref={ref}
      className="relative w-full h-[100svh] overflow-hidden select-none"
      style={{ cursor: "col-resize" }}
      onMouseMove={(e) => update(e.clientX)}
      onMouseLeave={() => setSplit(50)}
    >
      {/* NIGHT 배경 */}
      <div className="absolute inset-0" style={{ background: NIGHT_BG }} />

      {/* DAY 배경 */}
      <div
        className="absolute inset-0"
        style={{
          background: DAY_BG,
          clipPath: `inset(0 ${100 - split}% 0 0)`,
          transition: "clip-path 80ms ease-out",
        }}
      />

      {/* DAY 텍스트 */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)`, transition: "clip-path 80ms ease-out" }}
      >
        <div className="text-center px-6 md:px-12">
          <p
            className="text-[11px] md:text-sm tracking-[0.5em] uppercase mb-4 md:mb-6"
            style={{ color: DAY_TEXT, opacity: 0.5 }}
          >
            SEOLGIOK · DAY
          </p>
          <h1
            className="font-serif text-5xl md:text-7xl xl:text-9xl font-bold mb-3 md:mb-4"
            style={{ color: DAY_TEXT }}
          >
            설기옥
          </h1>
          <p
            className="text-sm md:text-xl tracking-[0.35em] mb-5 md:mb-8"
            style={{ color: DAY_TEXT, opacity: 0.65 }}
          >
            24시간의 기다림
          </p>
          <p
            className="text-sm md:text-xl leading-relaxed md:leading-loose mb-6 md:mb-10"
            style={{ color: DAY_TEXT, opacity: 0.75 }}
          >
            가마솥에서 우러난<br />깊고 진한 한 그릇
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {["맑은 곰탕", "갈비탕"].map((c) => (
              <span
                key={c}
                className="text-xs md:text-base px-4 md:px-6 py-2 md:py-2.5 rounded-full tracking-wider"
                style={{ border: `1px solid ${DAY_TEXT}40`, color: DAY_TEXT, opacity: 0.7 }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* NIGHT 텍스트 */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ clipPath: `inset(0 0 0 ${split}%)`, transition: "clip-path 80ms ease-out" }}
      >
        <div className="text-center px-6 md:px-12">
          <p
            className="text-[11px] md:text-sm tracking-[0.5em] uppercase mb-4 md:mb-6"
            style={{ color: NIGHT_TEXT, opacity: 0.5 }}
          >
            SEOLGIOK · NIGHT
          </p>
          <p
            className="font-serif text-5xl md:text-7xl xl:text-9xl font-bold mb-3 md:mb-4"
            style={{ color: NIGHT_TEXT }}
          >
            설기옥
          </p>
          <p
            className="text-sm md:text-xl tracking-[0.35em] mb-5 md:mb-8"
            style={{ color: NIGHT_TEXT, opacity: 0.65 }}
          >
            한 잔의 여백
          </p>
          <p
            className="text-sm md:text-xl leading-relaxed md:leading-loose mb-6 md:mb-10"
            style={{ color: NIGHT_TEXT, opacity: 0.75 }}
          >
            소고기와 한 잔이<br />마주 앉는 주막상
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {["육회", "수육", "막걸리"].map((c) => (
              <span
                key={c}
                className="text-xs md:text-base px-4 md:px-6 py-2 md:py-2.5 rounded-full tracking-wider"
                style={{ border: `1px solid ${NIGHT_TEXT}40`, color: NIGHT_TEXT, opacity: 0.7 }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 분할선 + 핸들 */}
      <div
        className="absolute inset-y-0 pointer-events-none z-20"
        style={{ left: `${split}%`, transition: "left 80ms ease-out" }}
      >
        <div className="absolute inset-y-0 left-0 w-px" style={{ background: `${NIGHT_TEXT}30` }} />
        <div
          className="absolute top-[28%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full shadow-xl flex items-center justify-center"
          style={{ background: DAY_BG }}
        >
          <span className="text-sm" style={{ color: DAY_TEXT, opacity: 0.5 }}>↔</span>
        </div>
      </div>

      {/* 모바일 스와이프 힌트 — 첫 터치 전에만 표시 */}
      {!hinted && (
        <div
          className="absolute bottom-10 inset-x-0 flex justify-center z-30 md:hidden pointer-events-none"
        >
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs tracking-widest"
            style={{ background: `${DAY_BG}cc`, color: DAY_TEXT, opacity: 0.7 }}
          >
            <span>←</span>
            <span>좌우로 밀어보세요</span>
            <span>→</span>
          </div>
        </div>
      )}
    </section>
  );
}
