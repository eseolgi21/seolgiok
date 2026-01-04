// next.config.ts

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path"; // 💡 [추가] path 모듈 import

// [핵심 확인] 플러그인 경로가 src/i18n/request.ts를 정확히 가리키는지 확인
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // swcMinify: true, // 이미 설정되어 있다면 유지
  // reactStrictMode: true, // 이미 설정되어 있다면 유지

  // [Alias 설정 유지] Webpack이 @/ 경로를 인식하도록 돕습니다.
  webpack: (config) => {
    return config;
  },
};

export default withNextIntl(nextConfig); // 💡 withNextIntl로 래핑되어야 합니다.
