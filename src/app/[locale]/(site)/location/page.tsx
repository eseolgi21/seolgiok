import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPinIcon, PhoneIcon, ClockIcon, TruckIcon } from "@heroicons/react/24/outline";
import { CopyAddressButton } from "./CopyAddressButton";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "location" });
  return {
    title: `${t("title")} — 설기옥`,
    description: t("subtitle"),
  };
}

export default async function LocationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("location");

  return (
    <div className="min-h-screen bg-cream">

      {/* 헤더 */}
      <div className="bg-dark text-cream py-16 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold/60" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/60" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/60" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold/60" />
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">SEOLGIOK</p>
        <h1 className="font-serif text-4xl font-bold text-cream">{t("title")}</h1>
        <p className="text-cream/60 text-sm mt-3">{t("subtitle")}</p>
        <div className="w-12 h-px bg-gold mx-auto mt-6" />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-10">

        {/* 지도 영역 */}
        <div className="border border-cream-border bg-white shadow-sm overflow-hidden">
          <iframe
            src="https://map.naver.com/p/entry/place/1614979428?lang=ko"
            width="100%"
            height="380"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            title="설기옥 위치"
          />
        </div>

        {/* 정보 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 주소 + 전화 */}
          <div className="bg-white border border-cream-border p-8 space-y-6">
            <div className="flex items-start gap-4">
              <MapPinIcon className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Address</p>
                <p className="text-gray-800 leading-relaxed">{t("address")}</p>
                <CopyAddressButton address={t("address")} label={t("copyAddress")} copiedLabel={t("copied")} />
              </div>
            </div>

            <div className="h-px bg-cream-border" />

            <div className="flex items-start gap-4">
              <PhoneIcon className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Phone</p>
                <a href={`tel:${t("phone")}`} className="text-gray-800 hover:text-gold transition-colors font-medium">
                  {t("phone")}
                </a>
              </div>
            </div>

            <div className="h-px bg-cream-border" />

            <div className="flex items-start gap-4">
              <TruckIcon className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t("parking.title")}</p>
                <p className="text-gray-800">{t("parking.desc")}</p>
                <p className="text-sm text-gold font-medium">{t("parking.free")}</p>
              </div>
            </div>
          </div>

          {/* 영업시간 */}
          <div className="bg-white border border-cream-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <ClockIcon className="w-5 h-5 text-gold" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t("hours.title")}</p>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-start py-4 border-b border-cream-border">
                <span className="font-bold text-dark">{t("hours.weekday")}</span>
                <div className="text-right">
                  <p className="text-gray-800 font-medium">{t("hours.weekdayTime")}</p>
                  <p className="text-xs text-gold mt-1">{t("hours.weekdayNote")}</p>
                </div>
              </div>

              <div className="flex justify-between items-start py-4 border-b border-cream-border">
                <span className="font-bold text-dark">{t("hours.weekend")}</span>
                <div className="text-right">
                  <p className="text-gray-800 font-medium">{t("hours.weekendTime")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-gold" />
                <p className="text-sm font-bold text-gold">{t("hours.allYear")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 네이버 지도 버튼 */}
        <div className="text-center">
          <a
            href="https://naver.me/xX7us7A8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-dark text-gold border border-dark hover:bg-dark-hover px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
          >
            <MapPinIcon className="w-4 h-4" />
            {t("naverMap")}
          </a>
        </div>
      </div>
    </div>
  );
}
