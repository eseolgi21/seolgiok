
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
        const where: Prisma.PurchaseItemWhereInput = {
            confirmed: true
        };

        if (startDate && endDate) {
            where.date = {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate))
            };
        }

        const items = await prisma.purchaseItem.groupBy({
            by: ['itemName'],
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
            }
        });

        const analysis = items.map(item => ({
            itemName: item.itemName,
            totalAmount: item._sum.amount || 0,
            count: item._count._all,
            averageAmount: Math.round((item._sum.amount || 0) / item._count._all)
        }));

        const totalSpending = analysis.reduce((sum, item) => sum + item.totalAmount, 0);

        return NextResponse.json({
            items: analysis,
            metadata: {
                totalSpending,
                totalCount: analysis.reduce((sum, item) => sum + item.count, 0)
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
    }
}
