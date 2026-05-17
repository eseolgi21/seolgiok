import { getTranslations, setRequestLocale } from "next-intl/server";
import { promises as fs } from "fs";
import path from "path";
import { MenuGallery } from "./MenuGallery";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return {
    title: `${t("title")} — 설기옥`,
    description: t("subtitle"),
  };
}

async function getMenuImages(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public", "menu");
    const files = await fs.readdir(dir);
    return files
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/menu/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");
  const images = await getMenuImages();

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

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {images.length > 0 ? (
          <MenuGallery images={images} zoomLabel={t("zoom")} closeLabel={t("close")} />
        ) : (
          <div className="text-center py-24 space-y-4">
            <p className="text-dark/40 text-lg">{t("noMenu")}</p>
            <div className="h-px w-16 bg-gold/30 mx-auto" />
            <p className="text-sm text-gold font-medium">{t("inquiryPhone")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
