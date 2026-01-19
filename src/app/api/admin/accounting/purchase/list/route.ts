
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const keywordsParam = searchParams.get("keywords") || "";
    const keywords = keywordsParam.split(",").map(k => k.trim()).filter(k => k.length > 0);

    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseItemWhereInput = keywords.length > 0 ? {
        OR: keywords.flatMap(k => [
            { itemName: { contains: k, mode: "insensitive" } },
            { category: { contains: k, mode: "insensitive" } },
            { note: { contains: k, mode: "insensitive" } },
        ])
    } : {};

    const [items, total] = await Promise.all([
        prisma.purchaseItem.findMany({
            where,
            orderBy: { date: "desc" },
            skip,
            take: limit,
        }),
        prisma.purchaseItem.count({ where }),
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
