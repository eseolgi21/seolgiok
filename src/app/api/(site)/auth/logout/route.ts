
import { signOut } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function POST() {
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
