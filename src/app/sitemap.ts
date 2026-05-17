import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// 빌드 타임이 아닌 요청 시 생성 — Railway 빌드 환경에서 DB에 접근할 수 없기 때문
export const dynamic = "force-dynamic";
import { BoardType, PostVisibility } from "@/generated/prisma";

const BASE_URL = "https://seolgiok.com";
const LOCALES = ["ko", "en", "ja", "zh", "vi"] as const;
type Locale = (typeof LOCALES)[number];

const STATIC_PAGES = [
  { path: "",              priority: 1.0, changeFrequency: "daily"   as const },
  { path: "/about",        priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/menu",         priority: 0.9, changeFrequency: "weekly"  as const },
  { path: "/location",     priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/announcements",priority: 0.7, changeFrequency: "weekly"  as const },
];

function alternates(path: string): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`])
  ) as Record<Locale, string>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 정적 페이지 (5 locales × 5 pages = 25 entries)
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.flatMap(
    ({ path, priority, changeFrequency }) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: alternates(path) },
      }))
  );

  // 동적 공지사항 페이지 — DB 오류 시 정적 페이지만 반환
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.post.findMany({
      where: {
        boardType: BoardType.NOTICE,
        isPublished: true,
        visibility: PostVisibility.PUBLIC,
      },
      select: { id: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    postEntries = posts.flatMap((post) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}/announcements/${post.id}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: alternates(`/announcements/${post.id}`),
        },
      }))
    );
  } catch {
    // DB 연결 실패 시 정적 페이지만 포함
  }

  return [...staticEntries, ...postEntries];
}
