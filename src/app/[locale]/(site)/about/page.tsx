import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { BreadcrumbListJsonLd, AboutPageJsonLd } from "@/components/JsonLd";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.Seolgiok" });
  const title = `${t("aboutPageTitle")} — 설기옥`;
  const description = t("metaDescription");
  return buildPageMetadata(locale, "/about", title, description);
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.Seolgiok");

  return (
    <>
      <BreadcrumbListJsonLd items={[
        { name: "설기옥", item: `https://seolgiok.com/${locale}` },
        { name: t("aboutPageTitle"), item: `https://seolgiok.com/${locale}/about` },
      ]} />
      <AboutPageJsonLd
        url={`https://seolgiok.com/${locale}/about`}
        description={t("metaDescription")}
      />
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <div className="bg-dark text-cream py-16 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold/60" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/60" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/60" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold/60" />
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">SEOLGIOK</p>
        <h1 className="font-serif text-4xl font-bold text-cream">{t("aboutPageTitle")}</h1>
        <p className="text-cream/60 text-sm mt-3">{t("metaDescription")}</p>
        <div className="w-12 h-px bg-gold mx-auto mt-6" />
      </div>

      {/* 스토리 섹션 */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src="/images/seolgiok_homescreen.png"
              alt="설기옥"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
              className="object-cover brightness-90 sepia-[0.15]"
            />
          </div>
          <div className="space-y-8">
            <div>
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
              <h2 className="font-serif text-3xl font-bold text-dark leading-tight">
                {t("featuresMainTitleStart")}
                <span className="text-gold">{t("featuresMainTitleHighlight")}</span>
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>{t("featuresMainDescLine1")}</p>
              <p>{t("featuresMainDescLine2")}</p>
              <p>{t("featuresMainDescLine3")}</p>
            </div>
            <div className="w-12 h-px bg-gold" />
          </div>
        </div>
      </section>

      {/* 핵심 가치 */}
      <section className="bg-dark text-cream py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Our Values</p>
            <h2 className="font-serif text-3xl font-bold">{t("valuesSectionTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: t("feature1Title"), desc: t("feature1Desc") },
              { title: t("feature2Title"), desc: t("feature2Desc") },
              { title: t("feature3Title"), desc: t("feature3Desc") },
            ].map(({ title, desc }, i) => (
              <div key={i} className="text-center space-y-4 px-4">
                <div className="w-10 h-px bg-gold mx-auto" />
                <h3 className="font-serif text-xl font-bold text-gold">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-cream">
        <p className="text-gray-500 text-sm mb-6">{t("visitCta")}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/menu"
            className="inline-block bg-dark text-cream border border-dark hover:bg-dark-hover px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
          >
            {t("menuButton")}
          </Link>
          <Link
            href="/location"
            className="inline-block bg-transparent text-dark border border-dark hover:bg-dark hover:text-cream px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
          >
            {t("locationButton")}
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
