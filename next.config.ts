// next.config.ts

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
// import path from "path"; // 💡 [추가] path 모듈 import (Unused)

// [핵심 확인] 플러그인 경로가 src/i18n/request.ts를 정확히 가리키는지 확인
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

// PDF 파일 라우트용 — iframe 미리보기 허용 (X-Frame-Options, frame-ancestors 완화)
const PDF_HEADERS = SECURITY_HEADERS.map((h) => {
  if (h.key === "X-Frame-Options") return { key: h.key, value: "SAMEORIGIN" };
  if (h.key === "Content-Security-Policy")
    return { key: h.key, value: h.value.replace("frame-ancestors 'none'", "frame-ancestors 'self'") };
  return h;
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      // 전체 기본 보안 헤더
      { source: "/(.*)", headers: SECURITY_HEADERS },
      // PDF 파일 라우트 — 동일 출처 iframe 허용 (위 규칙 덮어씀)
      { source: "/api/(admin/staff|staff)/payslips/:id/file", headers: PDF_HEADERS },
    ];
  },

  webpack: (config) => {
    return config;
  },
};

export default withNextIntl(nextConfig); // 💡 withNextIntl로 래핑되어야 합니다.
