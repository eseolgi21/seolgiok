import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function requireAdmin(minLevel = 21) {
    const session = await auth();
    if (!session || (session.user?.level ?? 0) < minLevel) {
        return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { session, error: null };
}
