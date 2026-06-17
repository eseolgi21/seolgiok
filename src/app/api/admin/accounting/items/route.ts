
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { KeywordType } from "@/generated/prisma";
import { requireAdmin } from "@/lib/middleware/admin-auth";

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "PURCHASE" or "SALES"

    if (!type || (type !== "PURCHASE" && type !== "SALES")) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const items = await prisma.itemClassification.findMany({
        where: { type: type as KeywordType }, // Cast to any because generated types might lag slightly or need import
        orderBy: { itemName: "asc" }
    });

    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const { type, text } = body;

        if (!type || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Parse text: "ItemName : Category"
        const lines = text.split("\n");
        const inputs = [];

        for (const line of lines) {
            let parts = line.split(":");
            if (parts.length < 2) {
                // Try tab separator (Excel copy-paste)
                parts = line.split("\t");
            }

            if (parts.length >= 2) {
                const name = parts[0].trim();
                // const cat = parts[parts.length - 1].trim(); // Take last part as category to handle potential issues? No, standard is 0 and 1.
                // Actually if split by tab, there might be empty parts?
                // Let's assume standard 2 columns.

                // If parts > 2, assume the first is item, the last is category? 
                // Or just index 1. Excel copy paste is usually strictly tabs.
                // Let's stick to index 1, but maybe parts[1] is the category.

                if (name && parts[1]) {
                    inputs.push({ itemName: name, category: parts[1].trim() });
                }
            }
        }

        if (inputs.length === 0) {
            return NextResponse.json({ message: "No valid rules parsed" }, { status: 400 });
        }

        const existing = await prisma.itemClassification.findMany({
            where: {
                type: type as KeywordType,
                OR: inputs.map(i => ({ itemName: i.itemName, category: i.category })),
            },
            select: { itemName: true, category: true },
        });
        const existingSet = new Set(existing.map(e => `${e.itemName}|${e.category}`));
        const toCreate = inputs.filter(i => !existingSet.has(`${i.itemName}|${i.category}`));
        if (toCreate.length > 0) {
            await prisma.itemClassification.createMany({
                data: toCreate.map(i => ({ itemName: i.itemName, category: i.category, type: type as KeywordType })),
                skipDuplicates: true,
            });
        }
        const count = toCreate.length;

        return NextResponse.json({ success: true, count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const type = searchParams.get("type");

    if (id) {
        await prisma.itemClassification.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    }

    if (category && type) {
        const { count } = await prisma.itemClassification.deleteMany({
            where: {
                category: category,
                type: type as KeywordType
            }
        });
        return NextResponse.json({ success: true, count });
    }

    return NextResponse.json({ error: "ID or Category+Type required" }, { status: 400 });


    return NextResponse.json({ success: true });
}
