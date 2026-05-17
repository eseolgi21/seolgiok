import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { BoardType, PostVisibility } from "@/generated/prisma";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { buildPageMetadata } from "@/lib/seo";
import { BreadcrumbListJsonLd, ItemListJsonLd } from "@/components/JsonLd";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "announcement.Seolgiok" });
  return buildPageMetadata(locale, "/announcements", t("metaTitle"), t("metaDescription"));
}

async function getAnnouncements() {
  return prisma.post.findMany({
    where: {
      boardType: BoardType.NOTICE,
      isPublished: true,
      visibility: PostVisibility.PUBLIC,
    },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, publishedAt: true, createdAt: true },
  });
}

export default async function AnnouncementsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("announcement.Seolgiok");

  const posts = await getAnnouncements();

  return (
    <>
      <BreadcrumbListJsonLd items={[
        { name: "설기옥", item: `https://seolgiok.com/${locale}` },
        { name: t("header.title"), item: `https://seolgiok.com/${locale}/announcements` },
      ]} />
      {posts.length > 0 && (
        <ItemListJsonLd items={posts.map((p) => ({
          name: p.title,
          url: `https://seolgiok.com/${locale}/announcements/${p.id}`,
        }))} />
      )}
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <div className="bg-dark text-cream py-16 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold/60" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/60" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/60" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold/60" />
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">SEOLGIOK</p>
        <h1 className="font-serif text-4xl font-bold text-cream">{t("header.title")}</h1>
        <p className="text-cream/60 text-sm mt-3">{t("header.subtitle")}</p>
        <div className="w-12 h-px bg-gold mx-auto mt-6" />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {posts.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-dark/40 text-lg">{t("list.empty")}</p>
            <div className="h-px w-16 bg-gold/20 mx-auto" />
          </div>
        ) : (
          <ul className="divide-y divide-cream-border border border-cream-border bg-white">
            {posts.map((post, i) => {
              const date = post.publishedAt ?? post.createdAt;
              const formatted = new Intl.DateTimeFormat(locale, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date(date));

              return (
                <li key={post.id}>
                  <Link
                    href={`/announcements/${post.id}`}
                    className="flex items-center justify-between px-6 py-5 hover:bg-cream transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-gold/40 font-mono text-xs w-6 shrink-0 text-right">
                        {String(posts.length - i).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-dark text-sm truncate group-hover:text-gold transition-colors">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-dark/40">{formatted}</span>
                      <ChevronRightIcon className="w-4 h-4 text-gold/40 group-hover:text-gold transition-colors" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
    </>
  );
}
