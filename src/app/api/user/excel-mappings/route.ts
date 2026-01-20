
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { KeywordType } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
    name: z.string().min(1),
    type: z.nativeEnum(KeywordType),
    colDate: z.string().min(1),
    colItem: z.string().min(1),
    colAmount: z.string().min(1),
    colCategory: z.string().optional(),
    colNote: z.string().optional(),
    colPayment: z.string().optional(),
    filterExclude: z.string().optional(),
    filterInclude: z.string().optional(),
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as KeywordType | null;

    try {
        const mappings = await prisma.excelMapping.findMany({
            where: {
                userId: session.user.id,
                ...(type ? { type } : {}),
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ mappings });
    } catch {
        return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const data = CreateSchema.parse(body);

        const mapping = await prisma.excelMapping.create({
            data: {
                userId: session.user.id,
                name: data.name,
                type: data.type,
                colDate: data.colDate,
                colItem: data.colItem,
                colAmount: data.colAmount,
                colCategory: data.colCategory,
                colNote: data.colNote,
                colPayment: data.colPayment,
                filterExclude: data.filterExclude,
                filterInclude: data.filterInclude,
            },
        });

        return NextResponse.json({ success: true, mapping });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create mapping" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    try {
        await prisma.excelMapping.delete({
            where: {
                id,
                userId: session.user.id, // Ensure ownership
            },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete mapping" }, { status: 500 });
    }
}
