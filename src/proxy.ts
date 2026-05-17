import { auth } from "./lib/auth/auth";
import createMiddleware from "next-intl/middleware";
import { routing, locales, defaultLocale, type AppLocale } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

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

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
