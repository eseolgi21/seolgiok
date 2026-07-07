import type { NextAuthConfig } from "next-auth";
import { SignJWT, jwtVerify } from "jose";
import { USER_LEVELS } from "@/lib/constants/user-levels";

export const authConfig = {
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.level = user.level;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.level = token.level as number;
                session.user.id = token.sub as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.match(/^\/([a-z]{2})\/admin/);
            const isOnStaff = nextUrl.pathname.match(/^\/([a-z]{2})\/staff/);
            const isOnAuth = nextUrl.pathname.match(/^\/([a-z]{2})\/auth/);

            if (isOnDashboard || isOnStaff) {
                if (isLoggedIn) return true;
                return false;
            }

            if (isOnAuth && isLoggedIn) {
                const level = auth?.user?.level ?? 0;

                // STAFF 미만(일반 회원)은 /staff·/admin 모두 접근 권한이 없으므로 강제 이동시키지
                // 않고 /auth/* 페이지를 그대로 보여준다. staff/layout.tsx가 레벨 미달 사용자를
                // 의도적으로 `/auth/login`으로 보내 다른 계정으로 재로그인할 기회를 주는데, 여기서
                // 다시 가로채 버리면(원래 버그) 그 의도가 무력화된다.
                if (level < USER_LEVELS.STAFF) return true;

                // STAFF 이상은 이미 자기 영역에 로그인할 자격이 있으므로 /auth/* 재방문 시
                // 로케일을 보존한 채 레벨에 맞는 영역으로 보낸다(레벨 무관 "/admin" 고정·로케일
                // 손실 리다이렉트였던 원래 버그 수정).
                const locale = isOnAuth[1];
                const destination = level >= USER_LEVELS.ADMIN ? "/admin" : "/staff";
                return Response.redirect(new URL(`/${locale}${destination}`, nextUrl));
            }

            return true;
        },
    },
    providers: [], // Providers configured in auth.ts
    // Explicitly use JWS HS256 to avoid JWE errors and standardize token format
    jwt: {
        async encode({ token, secret, maxAge }) {
            const maxAgeInSeconds = maxAge ?? 30 * 24 * 60 * 60; // Default to 30 days
            const encodedToken = await new SignJWT(token as Record<string, unknown>)
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime(Date.now() / 1000 + maxAgeInSeconds)
                .sign(new TextEncoder().encode(secret as string));
            return encodedToken;
        },
        async decode({ token, secret }) {
            if (!token) return null;
            try {
                const { payload } = await jwtVerify(
                    token,
                    new TextEncoder().encode(secret as string),
                    { algorithms: ["HS256"] }
                );
                return payload;
            } catch {
                return null;
            }
        },
    },
} satisfies NextAuthConfig;
