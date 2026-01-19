import type { NextAuthConfig } from "next-auth";
import { SignJWT, jwtVerify } from "jose";

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
            const isOnDashboard = nextUrl.pathname.startsWith("/admin");
            const isOnAuth = nextUrl.pathname.startsWith("/auth");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            if (isOnAuth && isLoggedIn) {
                return Response.redirect(new URL("/admin", nextUrl));
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
            } catch (error) {
                console.error("JWT Decode Error:", error);
                return null;
            }
        },
    },
} satisfies NextAuthConfig;
