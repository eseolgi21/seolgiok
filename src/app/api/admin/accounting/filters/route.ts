
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { KeywordType } from "@/generated/prisma";
import { requireAdmin } from "@/lib/middleware/admin-auth";

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin(10);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type || (type !== "PURCHASE" && type !== "SALES")) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const filters = await prisma.excelFilter.findMany({
        where: { type: type as KeywordType },
        orderBy: { keyword: "asc" }
    });

    return NextResponse.json({ filters });
}

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const { type, keyword, isInclude } = body;

        if (!type || !keyword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const filter = await prisma.excelFilter.create({
            data: {
                keyword: keyword.trim(),
                type: type as KeywordType,
                isInclude: isInclude ?? false
            }
        });

        return NextResponse.json({ success: true, filter });
    } catch (e: unknown) {
        // Ignore unique constraint violation, just return success
        console.error(e);
        return NextResponse.json({ success: true });
    }
}

export async function DELETE(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await prisma.excelFilter.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
