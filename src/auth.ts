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
                if (!credentials?.username || !credentials?.password) {
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

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);

                if (!isValid) {
                    return null;
                }

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
