import { auth } from "./lib/auth/auth";
import createMiddleware from "next-intl/middleware";
import { routing, locales, defaultLocale, type AppLocale } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// /admin/* 레이아웃(admin/layout.tsx)의 경로 인식형 권한 게이트가 현재 요청 pathname을
// 읽을 수 있도록 x-pathname 헤더로 전달한다. Server Component는 라우트 파라미터로 locale만
// 받을 뿐 전체 pathname을 알 방법이 없어 이 프록시에서 주입해야 한다.
// Next.js 16은 middleware.ts와 proxy.ts를 동시에 두면 빌드 에러가 나므로("Both middleware
// file ... and proxy file ... are detected") 별도 middleware.ts를 새로 만들지 않고
// 기존 proxy.ts에 얹는다.
const ADMIN_PATH_REGEXP = new RegExp(`^/(${locales.join("|")})/admin(/|$)`);

function getSavedLocale(req: NextRequest): AppLocale | null {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) {
    return cookie as AppLocale;
  }
  return null;
}

function getUrlLocale(req: NextRequest): AppLocale | null {
  const segments = req.nextUrl.pathname.split("/");
  const first = segments[1] ?? "";
  if ((locales as readonly string[]).includes(first)) {
    return first as AppLocale;
  }
  return null;
}

export default auth((req) => {
  const urlLocale = getUrlLocale(req);
  const savedLocale = getSavedLocale(req);

  // URL에 로케일이 없고 저장된 쿠키가 기본값과 다를 때만 리다이렉트
  if (!urlLocale && savedLocale && savedLocale !== defaultLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${savedLocale}${req.nextUrl.pathname}`;
    return NextResponse.redirect(url);
  }

  // admin/layout.tsx 경로 인식형 게이트용 — /admin 이하에서만 pathname 헤더 주입 (blast radius 최소화).
  // next-intl 미들웨어는 전달받은 request의 headers를 그대로 복사해 자신의 응답(next/rewrite)에
  // 반영하므로, intlMiddleware 호출 전에 설정하면 다운스트림 Server Component까지 전달된다.
  if (ADMIN_PATH_REGEXP.test(req.nextUrl.pathname)) {
    req.headers.set("x-pathname", req.nextUrl.pathname);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
