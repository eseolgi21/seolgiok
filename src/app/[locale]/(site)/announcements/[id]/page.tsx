import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BoardType, PostVisibility } from "@/generated/prisma";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import sanitizeHtml from "sanitize-html";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  return {
    title: post ? `${post.title} — 설기옥` : "공지사항 — 설기옥",
  };
}

async function getPost(id: string) {
  return prisma.post.findFirst({
    where: {
      id,
      boardType: BoardType.NOTICE,
      isPublished: true,
      visibility: PostVisibility.PUBLIC,
    },
    select: {
      id: true,
      title: true,
      bodyHtml: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("announcement.Seolgiok");

  const post = await getPost(id);
  if (!post) notFound();

  const date = post.publishedAt ?? post.createdAt;
  const formatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

  return (
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <div className="bg-dark text-cream py-16 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold/60" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/60" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/60" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold/60" />
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">SEOLGIOK</p>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-cream max-w-2xl mx-auto px-8 leading-snug">
          {post.title}
        </h1>
        <p className="text-cream/50 text-xs mt-4 tracking-wide">
          {t("detail.publishedAt")} · {formatted}
        </p>
        <div className="w-12 h-px bg-gold mx-auto mt-6" />
      </div>

      {/* 본문 */}
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="bg-white border border-cream-border p-8 md:p-12">
          <div
            className="prose prose-sm md:prose max-w-none
              prose-headings:font-serif prose-headings:text-dark
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-strong:text-dark
              prose-a:text-gold prose-a:no-underline hover:prose-a:underline
              prose-img:rounded prose-img:shadow-sm prose-img:mx-auto
              prose-ul:text-gray-700 prose-ol:text-gray-700
              prose-li:marker:text-gold"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.bodyHtml, {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption", "iframe"]),
              allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ["src", "alt", "width", "height", "class"],
                iframe: ["src", "width", "height", "allowfullscreen", "loading", "title"],
                "*": ["class", "style"],
              },
              allowedIframeHostnames: ["www.youtube.com", "player.vimeo.com"],
            }) }}
          />
        </div>

        {/* 하단 네비게이션 */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-2 text-sm text-dark/60 hover:text-gold transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {t("detail.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
