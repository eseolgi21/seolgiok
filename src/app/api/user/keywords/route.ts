
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // PURCHASE or SALES

    if (!type) {
        return NextResponse.json({ error: "Type required" }, { status: 400 });
    }

    const keywords = await prisma.searchKeyword.findMany({
        where: {
            userId: session.user.id,
            type: type as "PURCHASE" | "SALES",
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keywords);
}

const PostSchema = z.object({
    keyword: z.string().min(1),
    type: z.enum(["PURCHASE", "SALES"]),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { keyword, type } = PostSchema.parse(body);

        const exists = await prisma.searchKeyword.findFirst({
            where: {
                userId: session.user.id,
                keyword,
                type,
            },
        });

        if (exists) {
            // Just return existing if already there (move to top?)
            // Or update createdAt to make it recent?
            await prisma.searchKeyword.update({
                where: { id: exists.id },
                data: { createdAt: new Date() }
            });
            return NextResponse.json(exists);
        }

        const newKeyword = await prisma.searchKeyword.create({
            data: {
                userId: session.user.id,
                keyword,
                type,
            },
        });

        return NextResponse.json(newKeyword);
    } catch {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Verify ownership
    const kw = await prisma.searchKeyword.findUnique({ where: { id } });
    if (!kw || kw.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    await prisma.searchKeyword.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
