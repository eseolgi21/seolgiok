
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { getSearchVariants } from "@/lib/string-utils";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // import { getSearchVariants } from "@/lib/string-utils"; // REMOVED

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const keywordsParam = searchParams.get("keywords") || "";
    const keywords = keywordsParam.split(",").map(k => k.trim()).filter(k => k.length > 0);

    // Expand keywords to include Full/Half width variants
    const expandedKeywords = keywords.flatMap(k => getSearchVariants(k));

    const skip = (page - 1) * limit;

    const where: Prisma.SaleItemWhereInput = {
        confirmed: false,
        ...(expandedKeywords.length > 0 ? {
            OR: expandedKeywords.flatMap(k => [
                { itemName: { contains: k, mode: "insensitive" } },
                { category: { contains: k, mode: "insensitive" } },
                { note: { contains: k, mode: "insensitive" } },
                { paymentMethod: { contains: k, mode: "insensitive" } },
            ])
        } : {})
    };

    const [items, total] = await Promise.all([
        prisma.saleItem.findMany({
            where,
            orderBy: { date: "desc" },
            skip,
            take: limit,
        }),
        prisma.saleItem.count({ where }),
    ]);

    return NextResponse.json({
        items,
        metadata: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
}
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { date, category, itemName, amount, paymentMethod, note } = body;

        if (!date || !category || !itemName || amount === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newItem = await prisma.saleItem.create({
            data: {
                date: new Date(date),
                category,
                itemName,
                amount: Number(amount),
                paymentMethod: paymentMethod || "카드",
                note: note || "",
                confirmed: false
            }
        });

        return NextResponse.json(newItem);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        if (data.amount !== undefined) {
            data.amount = Number(data.amount);
        }
        if (data.date) {
            data.date = new Date(data.date);
        }

        const updatedItem = await prisma.saleItem.update({
            where: { id },
            data
        });

        return NextResponse.json(updatedItem);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // NEW: Delete All EXCEPT Keywords (Sales)
        if (body.action === "DELETE_EXCEPT") {
            const { keywords } = body;
            if (!Array.isArray(keywords) || keywords.length === 0) {
                return NextResponse.json({ error: "No keywords provided for exclusion delete" }, { status: 400 });
            }

            const expandedKeywords = keywords.flatMap((k: string) => getSearchVariants(k));

            const res = await prisma.saleItem.deleteMany({
                where: {
                    confirmed: false,
                    NOT: {
                        OR: expandedKeywords.flatMap(k => [
                            { itemName: { contains: k, mode: "insensitive" } },
                            { category: { contains: k, mode: "insensitive" } },
                            { note: { contains: k, mode: "insensitive" } },
                            { paymentMethod: { contains: k, mode: "insensitive" } },
                        ])
                    }
                }
            });
            return NextResponse.json({ count: res.count });
        }

        // Existing: Delete by IDs
        const { ids } = body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const res = await prisma.saleItem.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return NextResponse.json({ count: res.count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete items" }, { status: 500 });
    }
}
