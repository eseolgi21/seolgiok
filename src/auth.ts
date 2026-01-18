import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                console.log("[DEBUG] authorize called with username:", credentials?.username);
                if (!credentials?.username || !credentials?.password) {
                    console.log("[DEBUG] Missing credentials");
                    return null;
                }

                const { prisma } = await import("@/lib/prisma");
                const bcrypt = (await import("bcryptjs")).default;

                const username = String(credentials.username).toLowerCase();
                const password = String(credentials.password);

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [{ username }, { email: username }],
                    },
                    include: {
                        info: true,
                    },
                });

                if (!user) {
                    console.log("[DEBUG] User not found:", username);
                    return null;
                }

                if (!user.passwordHash) {
                    console.log("[DEBUG] User has no password hash");
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);

                if (!isValid) {
                    console.log("[DEBUG] Password mismatch for user:", username);
                    return null;
                }

                console.log("[DEBUG] Login successful for user:", username);
                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    level: user.info?.level ?? 1,
                };
            },
        }),
    ],
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
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
});

// Extend types to include level
declare module "next-auth" {
    interface User {
        level?: number;
    }
    interface Session {
        user: {
            level?: number;
        } & import("next-auth").DefaultSession["user"];
    }
}
