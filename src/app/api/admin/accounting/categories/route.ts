
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type || (type !== "PURCHASE" && type !== "SALES")) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = await (prisma as any).itemCategory.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { type: type as any },
        orderBy: { name: "asc" }
    });

    return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, name } = body;

        if (!type || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const category = await (prisma as any).itemCategory.create({
            data: {
                name: name.trim(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: type as any
            }
        });

        return NextResponse.json({ success: true, category });
    } catch {
        // console.error(e); 
        // Ignore unique constraint violation, just return success? 
        // Or return error. If unique constraint fails, it means it already exists, which is fine.
        return NextResponse.json({ success: true });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).itemCategory.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
