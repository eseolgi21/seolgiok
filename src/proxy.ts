import { auth } from "./lib/auth/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  // 1. NextAuth Authentication (handled by auth wrapper)
  // req.auth is available here if needed

  // 2. Internationalization
  return intlMiddleware(req);
});

export const config = {
  // Skip next internal files, static assets, and API routes
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
