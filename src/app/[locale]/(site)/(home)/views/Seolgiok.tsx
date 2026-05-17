"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPinIcon, PhoneIcon, ClockIcon } from "@heroicons/react/24/outline";

export function SeolgiokView() {
  const t = useTranslations("home.Seolgiok");
  const tLoc = useTranslations("location");

  const faqs = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
    { q: t("faqQ5"), a: t("faqA5") },
    { q: t("faqQ6"), a: t("faqA6") },
  ];

  const features = [
    { num: "01", title: t("feature1Title"), desc: t("feature1Desc") },
    { num: "02", title: t("feature2Title"), desc: t("feature2Desc") },
    { num: "03", title: t("feature3Title"), desc: t("feature3Desc") },
  ];

  return (
    <div className="min-h-screen bg-cream text-dark font-sans selection:bg-gold selection:text-white">

      {/* Hero */}
      <section className="relative w-full min-h-[100svh] bg-dark flex flex-col lg:flex-row">

        {/* 텍스트 패널 — 모바일: 하단 전체 / 데스크탑: 좌측 절반 */}
        <div className="order-2 lg:order-1 lg:w-1/2 flex items-center justify-center px-8 py-16 lg:py-0 lg:px-16 xl:px-24">
          <div className="text-cream max-w-md w-full">
            <p className="text-cream/60 text-xs tracking-[0.5em] uppercase mb-5">
              {t("heroSubtitle")}
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-xs md:text-sm tracking-[0.3em] text-cream/40 mb-10">
              KOREAN BEEF BONE SOUP
            </p>

            {/* 황금 구분선 */}
            <div className="w-12 h-px bg-gold mb-10" />

            {/* 가치관 뱃지 */}
            <div className="flex flex-wrap gap-2 mb-12">
              {[t("feature1Title"), t("feature2Title"), t("feature3Title")].map((v) => (
                <span
                  key={v}
                  className="border border-gold/40 text-gold/80 text-xs tracking-[0.2em] px-4 py-2 uppercase"
                >
                  {v}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/menu"
                className="bg-gold text-cream px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gold-hover transition-colors text-center"
              >
                {t("heroButton")}
              </Link>
              <Link
                href="/location"
                className="bg-transparent text-cream border border-cream/40 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-cream/10 transition-colors text-center"
              >
                {t("locationButton")}
              </Link>
            </div>
          </div>
        </div>

        {/* 이미지 패널 — 모바일: 상단 55vw 고정 / 데스크탑: 우측 절반 전체 높이 */}
        <div className="order-1 lg:order-2 lg:w-1/2 relative h-[55vw] max-h-[480px] lg:max-h-none lg:h-auto lg:min-h-[100svh]">
          <Image
            src="/images/seolgiok_homescreen.png"
            alt="설기옥 — 한우 곰탕 장인"
            fill
            className="object-cover object-[50%_60%] brightness-[0.85]"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* 왼쪽 패딩 쪽으로 스며드는 그라데이션 (데스크탑) */}
          <div className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-dark to-transparent" />
          {/* 텍스트 패널 방향 아래 그라데이션 (모바일) */}
          <div className="lg:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-dark to-transparent" />
        </div>

        {/* 스크롤 힌트 — 데스크탑 전용 */}
        <div className="hidden lg:flex absolute bottom-8 left-1/4 -translate-x-1/2 animate-bounce opacity-40">
          <svg className="w-5 h-5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 철학 / Story */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <p className="text-crimson text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-dark leading-tight">
          {t("featuresMainTitleStart")}
          <span className="text-crimson">{t("featuresMainTitleHighlight")}</span>
        </h2>
        <div className="space-y-4 text-gray-600 leading-relaxed text-sm md:text-base max-w-2xl mx-auto break-keep">
          <p>{t("featuresMainDescLine1")}</p>
          <p>{t("featuresMainDescLine2")}</p>
          <p>{t("featuresMainDescLine3")}</p>
        </div>
        <div className="w-12 h-px bg-crimson mx-auto mt-10" />
      </section>

      {/* 메뉴 프리뷰 */}
      <section className="bg-dark py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Signature Menu</p>
            <h2 className="font-serif text-3xl font-bold text-cream">{t("menuSectionTitle")}</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {[
              { num: "01", name: t("menu1Name"), desc: t("menu1Desc"), src: "/menu/맑은곰탕.png" },
              { num: "02", name: t("menu2Name"), desc: t("menu2Desc"), src: "/menu/갈비탕.png" },
              { num: "03", name: t("menu3Name"), desc: t("menu3Desc"), src: "/menu/갈비찜.png" },
              { num: "04", name: t("menu4Name"), desc: t("menu4Desc"), src: "/menu/곱창전골.png" },
            ].map(({ num, name, desc, src }) => (
              <div key={num} className="relative aspect-square overflow-hidden group">
                <Image
                  src={src}
                  alt={name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-gold/60 font-mono text-xs mb-1">{num}</p>
                  <h3 className="font-serif text-base font-bold text-cream leading-tight">{name}</h3>
                  <p className="text-cream/50 text-xs mt-1 leading-relaxed hidden sm:block">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/menu"
              className="inline-block bg-transparent text-gold border border-gold px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gold hover:text-cream transition-colors"
            >
              {t("menuViewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* 핵심 가치 */}
      <section className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-crimson text-xs tracking-[0.3em] uppercase mb-3">Our Values</p>
            <h2 className="font-serif text-3xl font-bold text-dark">{t("valuesSectionTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map(({ num, title, desc }) => (
              <div key={num} className="text-center space-y-4 px-4">
                <p className="font-serif text-3xl font-bold text-crimson/30">{num}</p>
                <div className="w-10 h-px bg-crimson mx-auto" />
                <h3 className="font-serif text-lg font-bold text-dark">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed break-keep">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 예약 CTA */}
      <section className="bg-dark text-cream py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gold text-xs tracking-[0.5em] uppercase mb-4">Reservation</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t("reservationTitle")}</h2>
          <div className="w-12 h-px bg-gold/60 mx-auto mb-6" />
          <p className="text-cream/70 text-sm mb-10 leading-relaxed">{t("reservationDesc")}</p>
          <a
            href="tel:0507-1376-9086"
            className="inline-flex items-center gap-3 bg-gold text-cream px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-gold-hover transition-colors"
          >
            <PhoneIcon className="w-4 h-4" />
            {t("reservationCallBtn")} · 0507-1376-9086
          </a>
        </div>
      </section>

      {/* 위치 프리뷰 */}
      <section className="bg-dark text-cream py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Location</p>
                <h2 className="font-serif text-3xl font-bold">{t("locationButton")}</h2>
              </div>
              <div className="space-y-5 text-gray-400 text-sm leading-relaxed">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <p>{tLoc("address")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-gold shrink-0" />
                  <p>{tLoc("phone")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p>{tLoc("hours.weekday")} · {tLoc("hours.weekdayTime")}</p>
                    <p className="text-xs text-gold mt-1">{tLoc("hours.weekdayNote")}</p>
                    <p className="mt-1">{tLoc("hours.weekend")} · {tLoc("hours.weekendTime")}</p>
                    <p className="text-xs text-gold/70 mt-2">{tLoc("hours.allYear")}</p>
                  </div>
                </div>
              </div>
              <Link
                href="/location"
                className="inline-flex items-center gap-2 bg-transparent text-gold border border-gold px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gold hover:text-cream transition-colors"
              >
                <MapPinIcon className="w-4 h-4" />
                {t("viewDetail")}
              </Link>
            </div>

            <div className="relative h-72 lg:h-96 overflow-hidden border border-white/10">
              <iframe
                src="https://map.naver.com/p/entry/place/1614979428?lang=ko"
                allow="accelerometer; gyroscope; geolocation"
                allowFullScreen
                loading="lazy"
                title="설기옥 위치"
                style={{
                  border: 0,
                  display: "block",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "200%",
                  height: "200%",
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-crimson text-xs tracking-[0.3em] uppercase mb-3">FAQ</p>
            <h2 className="font-serif text-3xl font-bold text-dark">
              {t("faqTitleStart")}
              <span className="text-crimson">{t("faqTitleHighlight")}</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4">{t("faqSubtitle")}</p>
          </div>

          <div className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <details key={i} className="group border border-cream-border bg-white">
                <summary className="flex justify-between items-center px-6 py-5 cursor-pointer list-none">
                  <span className="font-medium text-dark text-sm pr-4 break-keep">{q}</span>
                  <span className="text-crimson text-xl shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <div className="px-6 pb-5 pt-1 border-t border-cream-border">
                  <p className="text-gray-500 text-sm leading-relaxed break-keep">{a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-12 space-y-3">
            <p className="text-gray-400 text-sm">{t("faqFooterText")}</p>
            <a
              href="tel:0507-1376-9086"
              className="inline-block bg-dark text-cream border border-dark hover:bg-dark-hover px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
            >
              {t("faqFooterButton")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
