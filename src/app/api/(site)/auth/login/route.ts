
import { signIn } from "@/lib/auth/auth";
import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();

    // 0. Pre-check: Verify user exists to avoid "CredentialsSignin" error log stack trace
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: id }, { email: id }],
      },
    });

    // Timing-safe dummy hash — prevents account enumeration via response time difference
    const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    if (!existingUser) {
      await bcrypt.compare(password, DUMMY_HASH).catch(() => {});
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // 0.1 Pre-check: Verify password matches to avoid "CredentialsSignin" error log
    if (existingUser.passwordHash) {
      const isValid = await bcrypt.compare(password, existingUser.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { ok: false, code: "INVALID_CREDENTIALS" },
          { status: 401 }
        );
      }
    }

    // 1. NextAuth signIn (Credentials)
    // redirect: false prevents server-side redirect, throws error on failure
    await signIn("credentials", {
      username: id,
      password,
      redirect: false,
    });

    // 2. Success (signIn didn't throw)
    return NextResponse.json({
      ok: true,
      user: { username: id },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return NextResponse.json(
            { ok: false, code: "INVALID_CREDENTIALS" },
            { status: 401 }
          );
        default:
          return NextResponse.json(
            { ok: false, code: "UNKNOWN_ERROR" },
            { status: 500 }
          );
      }
    }

    // In some versions, 'Digest...' or 'Callback...' errors might appear
    // But since we use redirect: false, we shouldn't get redirect errors.
    console.error("Login Error:", error);

    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
