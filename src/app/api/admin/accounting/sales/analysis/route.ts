
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 10) { // Read access
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    try {
        const where: Prisma.SaleItemWhereInput = {
            confirmed: true
        };

        if (startDate && endDate) {
            where.date = {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate))
            };
        }

        const category = searchParams.get("category");
        if (category !== null && category !== undefined) {
            where.category = category;
        }

        const keywords = searchParams.get("keywords");
        if (keywords) {
            const keys = keywords.split(",").map(k => k.trim()).filter(k => k);
            if (keys.length > 0) {
                where.OR = keys.map(k => ({ itemName: { contains: k } }));
            }
        }

        const page = Number(searchParams.get("page") || "1");
        const limit = Number(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Get total count of distinct items for pagination
        const distinctItems = await prisma.saleItem.groupBy({
            by: ['itemName', 'category'],
            where,
            orderBy: { _sum: { amount: 'desc' } }
        });
        const totalItems = distinctItems.length;

        const items = await prisma.saleItem.groupBy({
            by: ['itemName', 'category'],
            where,
            _sum: {
                amount: true
            },
            _count: {
                _all: true
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            skip,
            take: limit
        });

        const analysis = items.map(item => ({
            itemName: item.itemName,
            category: item.category || "기타",
            totalAmount: item._sum.amount || 0,
            count: item._count._all,
            averageAmount: Math.round((item._sum.amount || 0) / item._count._all)
        }));

        // Calculate total spending for the WHOLE period (not just this page)
        const allStats = await prisma.saleItem.aggregate({
            _sum: { amount: true },
            _count: { _all: true },
            where
        });

        return NextResponse.json({
            items: analysis,
            metadata: {
                totalSpending: allStats._sum.amount || 0,
                totalCount: allStats._count._all || 0,
                totalItems,
                page,
                limit
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, startDate, endDate, itemNames } = body;

        let where: Prisma.SaleItemWhereInput = {};

        if (action === "DELETE_ALL_IN_PERIOD") {
            if (!startDate || !endDate) {
                return NextResponse.json({ error: "Start and End dates are required" }, { status: 400 });
            }
            where = {
                date: {
                    gte: startOfDay(parseISO(startDate)),
                    lte: endOfDay(parseISO(endDate))
                },
                confirmed: true
            };
        } else {
            // Default: Delete by itemNames
            if (!Array.isArray(itemNames) || itemNames.length === 0) {
                return NextResponse.json({ error: "No item names provided" }, { status: 400 });
            }
            where = {
                itemName: { in: itemNames },
                confirmed: true
            };

            if (startDate && endDate) {
                where.date = {
                    gte: startOfDay(parseISO(startDate)),
                    lte: endOfDay(parseISO(endDate))
                };
            }
        }

        const res = await prisma.saleItem.deleteMany({ where });

        return NextResponse.json({ count: res.count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete items" }, { status: 500 });
    }
}
