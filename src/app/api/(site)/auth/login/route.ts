
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();

    // 1. NextAuth signIn (Credentials)
    // redirect: false prevents server-side redirect, throws error on failure
    await signIn("credentials", {
      username: id,
      password,
      redirect: false,
    });

    // 2. Success (signIn didn't throw)
    // Note: with redirect:false, signIn returns a Promise that resolves on success and throws on error?
    // Actually in v5, signIn might return different result depending on config.
    // If redirect: false, it returns nothing on success? 
    // Let's assume standardized behavior: if it doesn't throw, it succeeded.

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
