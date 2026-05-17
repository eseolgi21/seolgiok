import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 크롤러: admin·api 차단
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      // AI 크롤러 — 명시적 허용
      { userAgent: "GPTBot",        allow: "/" },
      { userAgent: "ChatGPT-User",  allow: "/" },
      { userAgent: "anthropic-ai",  allow: "/" },
      { userAgent: "ClaudeBot",     allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Applebot",      allow: "/" },
      { userAgent: "Googlebot",     allow: "/" },
      { userAgent: "Bingbot",       allow: "/" },
    ],
    sitemap: "https://seolgiok.com/sitemap.xml",
  };
}
